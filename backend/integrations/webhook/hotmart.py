from typing import Any, Dict, Optional
import logging

from database.models.transaction import TransactionStatus, PaymentPlatform
from integrations.webhook.schemas import StandardizedWebhookEvent

logger = logging.getLogger(__name__)


def _map_status(raw_status: str | None) -> TransactionStatus:
    status = (raw_status or "").lower()

    if status in {"approved", "paid", "completed", "success"}:
        return TransactionStatus.APPROVED
    if status in {"refunded", "refund", "reversed"}:
        return TransactionStatus.REFUNDED
    if status in {"chargeback", "dispute", "disputed"}:
        return TransactionStatus.CHARGEBACK
    if status in {"trial", "trialing"}:
        return TransactionStatus.TRIAL
    return TransactionStatus.PENDING


def parse_hotmart_webhook(payload: Dict[str, Any]) -> Optional[StandardizedWebhookEvent]:
    """
    Parser específico para webhooks da Hotmart.

    A Hotmart tem campos próprios como:
    - buyer / purchaser
    - product / product_id
    - checkout.url
    - utm (source, medium, campaign, content, term)
    - event e status do evento em vez dos campos da Kiwify.
    """
    try:
        event_name = str(payload.get("event") or payload.get("type") or payload.get("status") or "")
        status = _map_status(str(payload.get("status") or payload.get("event_status") or ""))

        product = payload.get("product") or {}
        buyer = payload.get("buyer") or payload.get("customer") or payload.get("purchaser") or {}
        checkout = payload.get("checkout") or {}
        utm = payload.get("utm") or {}

        def normalize_money(value: Any) -> float:
            if value is None:
                return 0.0
            if isinstance(value, (int, float)):
                return float(value)
            if isinstance(value, str):
                try:
                    return float(value)
                except ValueError:
                    return 0.0
            return 0.0

        amount = normalize_money(payload.get("amount", 0) or 0)
        product_price = normalize_money(product.get("price", 0) or 0)

        def to_reais(value: float) -> float:
            if value <= 0:
                return 0.0
            if value >= 100 and abs(value - round(value)) < 1e-9:
                return value / 100.0
            return value

        amount = to_reais(amount)
        product_price = to_reais(product_price)

        external_id = str(
            payload.get("id")
            or payload.get("order_id")
            or payload.get("transaction_id")
            or payload.get("sale_id")
            or event_name
            or ""
        )

        customer_email = buyer.get("email") or payload.get("email") or ""
        customer_name = buyer.get("name") or payload.get("full_name") or payload.get("customer_name")
        customer_cpf = buyer.get("cpf") or buyer.get("document") or payload.get("cpf")
        customer_phone = buyer.get("phone") or buyer.get("mobile") or payload.get("phone")

        return StandardizedWebhookEvent(
            external_id=external_id,
            platform=PaymentPlatform.HOTMART,
            status=status,
            amount=float(amount),
            original_status=str(payload.get("status") or payload.get("event_status") or event_name),
            payment_method=str(payload.get("payment_method") or payload.get("method") or ""),
            payment_status=str(payload.get("payment_status") or payload.get("status") or ""),
            product_external_id=str(product.get("id") or product.get("product_id") or payload.get("product_id") or ""),
            product_name=str(product.get("name") or payload.get("product_name") or ""),
            product_price=float(product_price),
            customer_external_id=str(buyer.get("id") or buyer.get("customer_id") or payload.get("buyer_id") or ""),
            customer_email=customer_email,
            customer_name=customer_name,
            customer_cpf=customer_cpf,
            customer_phone=customer_phone,
            utm_source=utm.get("source") or utm.get("utm_source"),
            utm_medium=utm.get("medium") or utm.get("utm_medium"),
            utm_campaign=utm.get("campaign") or utm.get("utm_campaign"),
            utm_content=utm.get("content") or utm.get("utm_content"),
            utm_term=utm.get("term") or utm.get("utm_term"),
            src=utm.get("src") or utm.get("sck"),
            checkout_url=checkout.get("url") or payload.get("checkout_url"),
            order_bumps=payload.get("order_bumps", []) or [],
        )

    except Exception as e:
        logger.error(f"Erro ao parsear webhook da Hotmart: {e}", exc_info=True)
        return None
