import hashlib
import os
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from api.auth.deps import get_company_id, get_current_user
from database.core.connection import get_db
from database.models.utm_click import UTMClick, UTMConversion

router = APIRouter(prefix="/utm", tags=["utm"])


class UTMClickPayload(BaseModel):
    url: str | None = None
    landing_url: str | None = None
    page_url: str | None = None
    referrer: str | None = None
    source: str | None = None
    medium: str | None = None
    campaign: str | None = None
    content: str | None = None
    term: str | None = None
    tracking_id: str | None = None
    user_agent: str | None = None
    ip_address: str | None = None


class UTMConversionPayload(BaseModel):
    click_id: int | None = None
    campaign_id: str | None = None
    campaign_name: str | None = None
    source: str | None = None
    medium: str | None = None
    campaign: str | None = None
    content: str | None = None
    term: str | None = None
    conversion_type: str | None = None
    value: float = 0.0
    currency: str = "BRL"
    reference: str | None = None
    payload: dict[str, Any] | None = None


@router.post("/click")
def register_click(
    payload: UTMClickPayload,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    company_id: int = Depends(get_company_id),
):
    landing_url = payload.landing_url or payload.url or payload.page_url or ""
    raw_track = "|".join([
        str(payload.source or ""),
        str(payload.medium or ""),
        str(payload.campaign or ""),
        str(payload.content or ""),
        str(payload.term or ""),
        str(landing_url),
        str(payload.tracking_id or ""),
    ])
    click_hash = hashlib.sha256(raw_track.encode("utf-8")).hexdigest()[:64]

    existing = db.query(UTMClick).filter(
        UTMClick.company_id == company_id,
        UTMClick.click_hash == click_hash,
    ).order_by(UTMClick.id.desc()).first()

    if existing:
        return {
            "status": "ok",
            "click_id": existing.id,
            "tracking_id": existing.tracking_id,
            "duplicate": True,
        }

    click = UTMClick(
        company_id=company_id,
        user_id=current_user.id,
        source=payload.source,
        medium=payload.medium,
        campaign=payload.campaign,
        content=payload.content,
        term=payload.term,
        landing_url=landing_url,
        referrer=payload.referrer,
        page_url=payload.page_url,
        ip_address=payload.ip_address,
        user_agent=payload.user_agent,
        tracking_id=payload.tracking_id or hashlib.sha256(f"{company_id}:{datetime.now(timezone.utc).timestamp()}".encode()).hexdigest()[:16],
        click_hash=click_hash,
        campaign_id=payload.campaign,
        campaign_name=payload.campaign,
    )
    db.add(click)
    db.commit()
    db.refresh(click)
    return {
        "status": "ok",
        "click_id": click.id,
        "tracking_id": click.tracking_id,
        "duplicate": False,
    }


@router.post("/conversion")
def register_conversion(
    payload: UTMConversionPayload,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    company_id: int = Depends(get_company_id),
):
    click = None
    if payload.click_id is not None:
        click = db.query(UTMClick).filter(
            UTMClick.id == payload.click_id,
            UTMClick.company_id == company_id,
        ).first()

    if click is None:
        click = db.query(UTMClick).filter(
            UTMClick.company_id == company_id,
            UTMClick.campaign == (payload.campaign or ""),
        ).order_by(UTMClick.id.desc()).first()

    conversion = UTMConversion(
        company_id=company_id,
        click_id=click.id if click else None,
        campaign_id=payload.campaign_id or (click.campaign_id if click else None),
        campaign_name=payload.campaign_name or (click.campaign_name if click else None),
        source=payload.source or (click.source if click else None),
        medium=payload.medium or (click.medium if click else None),
        campaign=payload.campaign or (click.campaign if click else None),
        content=payload.content or (click.content if click else None),
        term=payload.term or (click.term if click else None),
        conversion_type=payload.conversion_type or "sale",
        value=payload.value,
        currency=payload.currency,
        reference=payload.reference,
        payload=str(payload.payload) if payload.payload else None,
    )
    db.add(conversion)
    if click:
        click.is_conversion = True
    db.commit()
    return {"status": "ok", "conversion_id": conversion.id}


@router.get("/summary")
def tracking_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    company_id: int = Depends(get_company_id),
):
    clicks = db.query(func.count(UTMClick.id)).filter(UTMClick.company_id == company_id).scalar() or 0
    conversions = db.query(func.count(UTMConversion.id)).filter(UTMConversion.company_id == company_id).scalar() or 0
    revenue = db.query(func.coalesce(func.sum(UTMConversion.value), 0)).filter(UTMConversion.company_id == company_id).scalar() or 0
    return {
        "clicks": clicks,
        "conversions": conversions,
        "revenue": float(revenue),
        "companies": [company_id],
        "user_id": current_user.id,
    }
