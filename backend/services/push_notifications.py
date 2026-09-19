import os
import json
from typing import Optional
from pywebpush import webpush, WebPushException
from sqlalchemy.orm import Session
from database.models.push_subscription import PushSubscription
from datetime import datetime


class PushNotificationService:
    """Serviço para enviar notificações push usando Web Push Protocol"""
    
    def __init__(self):
        self.vapid_private_key = os.getenv("VAPID_PRIVATE_KEY")
        self.vapid_public_key = os.getenv("VAPID_PUBLIC_KEY")
        self.vapid_claims = {
            "sub": f"mailto:{os.getenv('VAPID_CLAIM_EMAIL', 'admin@lomustrack.app')}"
        }
        
        if not self.vapid_private_key or not self.vapid_public_key:
            print("⚠️  VAPID keys não configuradas. Push notifications desabilitadas.")
    
    def send_notification(
        self,
        subscription: PushSubscription,
        title: str,
        body: str,
        data: Optional[dict] = None
    ) -> bool:
        """
        Envia uma notificação push para uma subscrição específica.
        
        Args:
            subscription: Objeto PushSubscription do banco
            title: Título da notificação
            body: Corpo da notificação
            data: Dados adicionais (opcional)
        
        Returns:
            True se enviado com sucesso, False caso contrário
        """
        if not self.vapid_private_key or not self.vapid_public_key:
            print("⚠️  VAPID keys não configuradas")
            return False
        
        try:
            subscription_info = {
                "endpoint": subscription.endpoint,
                "keys": {
                    "p256dh": subscription.p256dh,
                    "auth": subscription.auth
                }
            }
            
            payload = {
                "title": title,
                "body": body,
                "data": data or {}
            }
            
            webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload),
                vapid_private_key=self.vapid_private_key,
                vapid_claims=self.vapid_claims
            )
            
            return True
            
        except WebPushException as e:
            print(f"❌ Erro ao enviar push notification: {e}")
            if e.response and e.response.status_code in [404, 410]:
                # Subscrição expirada ou inválida
                return False
            return False
        except Exception as e:
            print(f"❌ Erro inesperado ao enviar notificação: {e}")
            return False
    
    def send_sale_notification(
        self,
        db: Session,
        amount: float,
        product_name: str = "Produto",
        customer_name: Optional[str] = None,
        company_id: int = 1
    ):
        """
        Envia notificação de venda para todas as subscrições ativas.
        
        Args:
            db: Sessão do banco de dados
            amount: Valor da venda em BRL
            product_name: Nome do produto vendido
            customer_name: Nome do cliente (opcional)
            company_id: ID da empresa (multi-tenant)
        """
        # Converter BRL para MZN (1 BRL = 13 MZN)
        amount_mzn = amount * 13
        
        # Formatar valor
        formatted_amount = f"{amount_mzn:,.0f}".replace(",", ".") + " MT"
        
        # Construir mensagem (sem nome do cliente)
        body = f"Venda Aprovada!\nValor: {formatted_amount}"
        
        # Buscar todas as subscrições ativas DA MESMA EMPRESA
        subscriptions = db.query(PushSubscription).filter(
            PushSubscription.is_active == True,
            PushSubscription.company_id == company_id
        ).all()
        
        if not subscriptions:
            print("ℹ️  Nenhuma subscrição ativa encontrada")
            return
        
        # Enviar para cada subscrição
        success_count = 0
        failed_count = 0
        
        for sub in subscriptions:
            success = self.send_notification(
                subscription=sub,
                title="LomusTrack 🎉",
                body=body,
                data={
                    "url": "/sales",
                    "amount": formatted_amount,
                    "product": product_name
                }
            )
            
            if success:
                success_count += 1
                # Atualizar timestamp de último uso
                sub.last_used_at = datetime.utcnow()
                db.commit()
            else:
                failed_count += 1
                # Desativar subscrição inválida
                sub.is_active = False
                db.commit()
        
        print(f"✅ Notificações enviadas: {success_count} sucesso, {failed_count} falhas")


# Instância global do serviço
push_service = PushNotificationService()
