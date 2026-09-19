import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from database.core.connection import get_db
from database.models.webhook_endpoint import WebhookEndpoint, WebhookPlatform
from api.auth.deps import get_current_user, get_company_id

router = APIRouter(prefix="/platforms", tags=["platforms"])


class WebhookCreate(BaseModel):
    platform: str  # "kiwify" or "payt"
    name: str


class WebhookResponse(BaseModel):
    id: int
    slug: str
    platform: str
    name: str
    created_at: datetime | None = None

    class Config:
        from_attributes = True


@router.get("/webhooks", response_model=list[WebhookResponse])
def list_webhooks(
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    endpoints = db.query(WebhookEndpoint).filter(
        WebhookEndpoint.company_id == company_id
    ).order_by(WebhookEndpoint.id.desc()).all()
    return [
        WebhookResponse(
            id=ep.id,
            slug=ep.slug,
            platform=ep.platform.value,
            name=ep.name,
            created_at=ep.created_at,
        )
        for ep in endpoints
    ]


@router.post("/webhooks", response_model=WebhookResponse, status_code=201)
def create_webhook(
    payload: WebhookCreate,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    platform_value = payload.platform.lower()
    if platform_value not in [p.value for p in WebhookPlatform]:
        raise HTTPException(status_code=400, detail="Plataforma inválida")

    slug = uuid.uuid4().hex[:8]

    endpoint = WebhookEndpoint(
        company_id=company_id,
        slug=slug,
        platform=WebhookPlatform(platform_value),
        name=payload.name,
    )
    db.add(endpoint)
    db.commit()
    db.refresh(endpoint)

    return WebhookResponse(
        id=endpoint.id,
        slug=endpoint.slug,
        platform=endpoint.platform.value,
        name=endpoint.name,
        created_at=endpoint.created_at,
    )


@router.delete("/webhooks/{webhook_id}", status_code=204)
def delete_webhook(
    webhook_id: int,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id),
):
    endpoint = db.query(WebhookEndpoint).filter(
        WebhookEndpoint.id == webhook_id,
        WebhookEndpoint.company_id == company_id
    ).first()
    if not endpoint:
        raise HTTPException(status_code=404, detail="Webhook não encontrado")
    db.delete(endpoint)
    db.commit()
