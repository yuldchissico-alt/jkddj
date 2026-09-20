import os
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode, quote

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from api.auth.deps import get_current_user
from api.auth.token import create_access_token, verify_token
from database.core.connection import get_db
from database.models.admin import Admin
from database.models.facebook_account import FacebookAccount
from database.models.meta_connection import MetaConnection

router = APIRouter(prefix="/meta", tags=["meta"])

META_APP_ID = os.getenv("META_APP_ID", "")
META_APP_SECRET = os.getenv("META_APP_SECRET", "")
META_REDIRECT_URI = os.getenv("META_REDIRECT_URI", "http://localhost:8000/api/meta/callback")
META_GRAPH_API_VERSION = os.getenv("META_GRAPH_API_VERSION", "v25.0")
# OAuth scopes must be valid Facebook Login permissions. Marketing API data access happens after authorization.
META_SCOPES = ",".join([
    "ads_read",
    "business_management",
    "pages_show_list",
    "public_profile",
])


class MetaOAuthConnectResponse(BaseModel):
    auth_url: str
    state: str


class MetaOAuthCallbackRequest(BaseModel):
    code: str | None = None
    state: str | None = None
    error: str | None = None
    error_description: str | None = None


@router.get("/connect", response_model=MetaOAuthConnectResponse)
def connect_meta(db: Session = Depends(get_db), current_user: Admin = Depends(get_current_user)):
    if not META_APP_ID:
        raise HTTPException(status_code=500, detail="META_APP_ID não configurado no backend")

    state = create_access_token({
        "sub": str(current_user.id),
        "company_id": str(current_user.company_id),
        "type": "meta_oauth",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
    })
    params = {
        "client_id": META_APP_ID,
        "redirect_uri": META_REDIRECT_URI,
        "scope": META_SCOPES,
        "response_type": "code",
        "state": state,
        "auth_type": "rerequest",
    }
    auth_url = f"https://www.facebook.com/{META_GRAPH_API_VERSION}/dialog/oauth?{urlencode(params)}"

    existing = db.query(MetaConnection).filter(
        MetaConnection.company_id == current_user.company_id,
        MetaConnection.user_id == current_user.id,
    ).first()
    if existing:
        existing.status = "connecting"
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()

    return MetaOAuthConnectResponse(auth_url=auth_url, state=state)


@router.get("/callback")
async def meta_oauth_callback(request: Request, db: Session = Depends(get_db)):
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    error = request.query_params.get("error")
    error_description = request.query_params.get("error_description")

    if error:
        return RedirectResponse(url=f"/facebook-ads?meta_status=error&detail={error_description or error}", status_code=302)

    if not code or not state:
        raise HTTPException(status_code=400, detail="Código de autorização ou state ausentes")

    payload = verify_token(state)
    if not payload or payload.get("type") != "meta_oauth":
        raise HTTPException(status_code=401, detail="State de OAuth inválido")

    user_id = payload.get("sub")
    company_id = payload.get("company_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Usuário não identificado no state do OAuth")

    try:
        user_id = int(user_id)
        if company_id is not None:
            company_id = int(company_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="State de OAuth inválido")

    if not META_APP_SECRET:
        raise HTTPException(status_code=500, detail="META_APP_SECRET não configurado no backend")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            token_response = await client.post(
                "https://graph.facebook.com/oauth/access_token",
                params={
                    "client_id": META_APP_ID,
                    "client_secret": META_APP_SECRET,
                    "code": code,
                    "redirect_uri": META_REDIRECT_URI,
                },
            )
            token_response.raise_for_status()
            token_data = token_response.json()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Falha ao trocar code por token: {exc}")

    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in", 0)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in)) if expires_in else None

    if not access_token:
        raise HTTPException(status_code=400, detail="Meta não retornou access token")

    try:
        profile = await _fetch_meta_profile(access_token)
    except Exception as exc:
        detail = f"Falha ao buscar perfil da conta Meta: {exc}"
        return RedirectResponse(url=f"/facebook-ads?meta_status=error&detail={quote(detail)}", status_code=302)

    try:
        ad_accounts = await _fetch_meta_ad_accounts(access_token)
    except Exception as exc:
        detail = f"Falha ao listar contas de anúncios da Meta: {exc}"
        return RedirectResponse(url=f"/facebook-ads?meta_status=error&detail={quote(detail)}", status_code=302)

    account_id, account_name = _choose_primary_ad_account(ad_accounts)

    if not account_id:
        detail = "Nenhuma conta de anúncios foi encontrada para esta conta Meta. Verifique as permissões de anúncio e o acesso à conta da Meta."
        return RedirectResponse(url=f"/facebook-ads?meta_status=error&detail={quote(detail)}", status_code=302)

    connection = db.query(MetaConnection).filter(
        MetaConnection.company_id == company_id,
        MetaConnection.user_id == user_id,
    ).first()
    if connection is None:
        connection = MetaConnection(
            company_id=company_id,
            user_id=user_id,
            status="connected",
        )
        db.add(connection)

    connection.account_id = account_id
    connection.account_name = account_name or profile.get("name") or profile.get("account_name")
    connection.email = profile.get("email")
    connection.access_token = access_token
    connection.refresh_token = refresh_token
    connection.token_expires_at = expires_at
    connection.scope = profile.get("permissions") or "ads_management,ads_read"
    connection.status = "connected"
    connection.last_sync_at = datetime.now(timezone.utc)

    existing_fb = db.query(FacebookAccount).filter(
        FacebookAccount.account_id == account_id,
        FacebookAccount.company_id == company_id,
    ).first()
    if existing_fb:
        existing_fb.label = connection.account_name or existing_fb.label
        existing_fb.access_token = access_token
        existing_fb.business_id = existing_fb.business_id or "meta_oauth"
        existing_fb.token_valid = True
    else:
        db.add(FacebookAccount(
            company_id=company_id,
            label=connection.account_name or "Meta Ads",
            account_id=account_id,
            access_token=access_token,
            business_id="meta_oauth",
            token_valid=True,
        ))

    db.commit()

    return RedirectResponse(url="/facebook-ads?meta_status=connected", status_code=302)


@router.get("/status")
def meta_status(db: Session = Depends(get_db), current_user: Admin = Depends(get_current_user)):
    connection = db.query(MetaConnection).filter(
        MetaConnection.company_id == current_user.company_id,
        MetaConnection.user_id == current_user.id,
    ).order_by(MetaConnection.id.desc()).first()

    fb_account = db.query(FacebookAccount).filter(
        FacebookAccount.company_id == current_user.company_id,
        FacebookAccount.token_valid.is_(True),
    ).order_by(FacebookAccount.id.desc()).first()

    if connection is None and fb_account is None:
        return {
            "status": "not_connected",
            "account_name": None,
            "account_id": None,
            "connected": False,
        }

    if connection is None and fb_account is not None:
        return {
            "status": "connected",
            "account_name": fb_account.label,
            "account_id": fb_account.account_id,
            "connected": True,
            "last_sync_at": fb_account.created_at.isoformat() if fb_account.created_at else None,
        }

    status_value = connection.status
    if connection.token_expires_at and connection.token_expires_at < datetime.now(timezone.utc):
        status_value = "token_expired"

    return {
        "status": status_value,
        "account_name": connection.account_name or fb_account.label if fb_account else connection.account_name,
        "account_id": connection.account_id or (fb_account.account_id if fb_account else None),
        "connected": status_value == "connected",
        "last_sync_at": connection.last_sync_at.isoformat() if connection.last_sync_at else None,
    }


@router.delete("/disconnect")
def disconnect_meta(db: Session = Depends(get_db), current_user: Admin = Depends(get_current_user)):
    connection = db.query(MetaConnection).filter(
        MetaConnection.company_id == current_user.company_id,
        MetaConnection.user_id == current_user.id,
    ).order_by(MetaConnection.id.desc()).first()

    if connection and connection.account_id:
        fb_account = db.query(FacebookAccount).filter(
            FacebookAccount.company_id == current_user.company_id,
            FacebookAccount.account_id == connection.account_id,
        ).first()
        if fb_account:
            fb_account.token_valid = False

    db.query(MetaConnection).filter(
        MetaConnection.company_id == current_user.company_id,
        MetaConnection.user_id == current_user.id,
    ).delete()
    db.commit()
    return {"status": "disconnected"}


def _normalize_meta_ad_account_id(value: str | int | None) -> str | None:
    if value is None:
        return None

    normalized = str(value).strip()
    if not normalized:
        return None
    if normalized.startswith("act_"):
        return normalized
    if normalized.isdigit():
        return f"act_{normalized}"
    return normalized


def _choose_primary_ad_account(payload: dict) -> tuple[str | None, str | None]:
    for account in payload.get("data", []):
        if not isinstance(account, dict):
            continue

        ad_account_id = account.get("account_id") or account.get("id")
        ad_account_name = account.get("name") or account.get("account_name") or "Meta Ads"
        normalized_id = _normalize_meta_ad_account_id(ad_account_id)
        if normalized_id:
            return normalized_id, str(ad_account_name)

    return None, None


async def _fetch_meta_ad_accounts(access_token: str) -> dict:
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            "https://graph.facebook.com/me/adaccounts",
            params={
                "fields": "account_id,id,name",
                "access_token": access_token,
                "limit": 100,
            },
        )
        response.raise_for_status()
        return response.json()


async def _fetch_meta_profile(access_token: str) -> dict:
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            "https://graph.facebook.com/me",
            params={
                "fields": "id,name,email",
                "access_token": access_token,
            },
        )
        response.raise_for_status()
        payload = response.json()
    return {
        "id": payload.get("id"),
        "name": payload.get("name"),
        "email": payload.get("email"),
        "company_id": None,
        "user_id": None,
        "permissions": [],
    }
