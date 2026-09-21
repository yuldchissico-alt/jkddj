from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database.core.connection import get_db
from database.models.push_subscription import PushSubscription
from services.push_notifications import push_service
from api.auth.deps import get_company_id


router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/vapid-public-key")
def get_vapid_public_key():
    public_key = push_service.get_public_key()
    if not public_key:
        raise HTTPException(status_code=503, detail="VAPID public key não configurada")
    return {"public_key": public_key}


class SubscriptionCreate(BaseModel):
    endpoint: str
    keys: dict  # {"p256dh": "...", "auth": "..."}


class SubscriptionResponse(BaseModel):
    id: int
    endpoint: str
    is_active: bool
    
    class Config:
        from_attributes = True


@router.post("/subscribe", response_model=SubscriptionResponse)
def subscribe_to_push(
    subscription: SubscriptionCreate,
    request: Request,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id)
):
    """
    Registra uma nova subscrição de push notification.
    Se o endpoint já existir, retorna a subscrição existente.
    """
    # Verificar se já existe (dentro da mesma empresa)
    existing = db.query(PushSubscription).filter(
        PushSubscription.endpoint == subscription.endpoint,
        PushSubscription.company_id == company_id
    ).first()
    
    if existing:
        # Reativar se estava inativa
        if not existing.is_active:
            existing.is_active = True
            db.commit()
            db.refresh(existing)
        return existing
    
    # Criar nova subscrição
    new_subscription = PushSubscription(
        company_id=company_id,
        endpoint=subscription.endpoint,
        p256dh=subscription.keys.get("p256dh", ""),
        auth=subscription.keys.get("auth", ""),
        user_agent=request.headers.get("user-agent", ""),
        is_active=True
    )
    
    db.add(new_subscription)
    db.commit()
    db.refresh(new_subscription)
    
    return new_subscription


@router.delete("/unsubscribe")
def unsubscribe_from_push(
    endpoint: str,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id)
):
    """Remove ou desativa uma subscrição de push notification."""
    subscription = db.query(PushSubscription).filter(
        PushSubscription.endpoint == endpoint,
        PushSubscription.company_id == company_id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscrição não encontrada")
    
    # Desativar ao invés de deletar (para manter histórico)
    subscription.is_active = False
    db.commit()
    
    return {"message": "Subscrição removida com sucesso"}


@router.post("/test")
def send_test_notification(
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id)
):
    """Envia uma notificação de teste para todas as subscrições ativas."""
    subscriptions = db.query(PushSubscription).filter(
        PushSubscription.is_active == True,
        PushSubscription.company_id == company_id
    ).all()
    
    if not subscriptions:
        raise HTTPException(
            status_code=404,
            detail="Nenhuma subscrição ativa encontrada"
        )
    
    success_count = 0
    
    for sub in subscriptions:
        success = push_service.send_notification(
            subscription=sub,
            title="LomusTrack 🎉",
            body="Venda Aprovada!\nValor: 1.656 MT",
            data={"url": "/sales", "amount": "1.656 MT"}
        )
        
        if success:
            success_count += 1
        else:
            sub.is_active = False
    
    db.commit()
    
    return {
        "message": f"Notificação de teste enviada para {success_count} dispositivo(s)",
        "total_sent": success_count,
        "total_subscriptions": len(subscriptions)
    }


@router.get("/subscriptions")
def list_subscriptions(
    db: Session = Depends(get_db),
    company_id: int = Depends(get_company_id)
):
    """Lista todas as subscrições ativas."""
    subscriptions = db.query(PushSubscription).filter(
        PushSubscription.is_active == True,
        PushSubscription.company_id == company_id
    ).all()
    
    return {
        "total": len(subscriptions),
        "subscriptions": [sub.to_dict() for sub in subscriptions]
    }
