from typing import Any, Dict, Optional
import logging

from database.models.transaction import TransactionStatus, PaymentPlatform
from integrations.webhook.schemas import StandardizedWebhookEvent

logger = logging.getLogger(__name__)


def _map_status(raw_status: str | None) -> TransactionStatus:
    status = (raw_status or "").lower().strip()

    if status in {
        "approved", "paid", "completed", "success", "complete",
        "purchase_approved", "purchase_complete", "switch_plan"
    }:
        return TransactionStatus.APPROVED
    if status in {
        "refunded", "refund", "reversed",
        "purchase_refunded", "purchase_canceled", "canceled", "cancelled",
        "purchase_expired", "expired"
    }:
        return TransactionStatus.REFUNDED
    if status in {
        "chargeback", "dispute", "disputed",
        "purchase_chargeback", "purchase_protest", "protest"
    }:
        return TransactionStatus.CHARGEBACK
    if status in {"trial", "trialing"}:
        return TransactionStatus.TRIAL
    return TransactionStatus.PENDING


def parse_hotmart_webhook(payload: Dict[str, Any]) -> Optional[StandardizedWebhookEvent]:
    """
    Parser para webhooks da Hotmart.
    Suporta tanto a versão moderna (Webhook 2.0 com envelope 'data')
    quanto versões legadas/planas com campos na raiz do payload.
    """
    try:
        data = payload.get("data")
        is_v2 = isinstance(data, dict) and bool(data)
        d = data if is_v2 else payload

        event_name = str(payload.get("event") or payload.get("type") or payload.get("status") or "")
        
        # Sub-objetos (suporta v2 em data.* e v1/legado no root)
        product = d.get("product") or payload.get("product") or {}
        buyer = d.get("buyer") or d.get("customer") or d.get("purchaser") or payload.get("buyer") or payload.get("customer") or {}
        purchase = d.get("purchase") or payload.get("purchase") or {}
        checkout = d.get("checkout") or payload.get("checkout") or {}
        origin = purchase.get("origin") or {} if isinstance(purchase, dict) else {}
        utm = d.get("utm") or payload.get("utm") or origin or {}

        # Mapeamento de status
        raw_status = (
            (purchase.get("status") if isinstance(purchase, dict) else None)
            or payload.get("status")
            or payload.get("event_status")
            or event_name
        )
        status = _map_status(str(raw_status))

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

        # Preço e Valor
        if is_v2:
            # Em Webhook 2.0, price.value já vem em Reais (ex: 197.00)
            price_info = purchase.get("price") or purchase.get("full_price") or {}
            raw_amount = price_info.get("value") if isinstance(price_info, dict) else purchase.get("price")
            if raw_amount is None:
                raw_amount = payload.get("amount", 0)
            amount = normalize_money(raw_amount)

            raw_prod_price = product.get("price")
            if isinstance(raw_prod_price, dict):
                raw_prod_price = raw_prod_price.get("value")
            product_price = normalize_money(raw_prod_price) if raw_prod_price is not None else amount
        else:
            # Em formato legado / v1, centavos inteiros (ex: 7996 -> 79.96)
            def to_reais(value: float) -> float:
                if value <= 0:
                    return 0.0
                if value >= 100 and abs(value - round(value)) < 1e-9:
                    return value / 100.0
                return value

            amount = to_reais(normalize_money(payload.get("amount", 0) or 0))
            product_price = to_reais(normalize_money(product.get("price", 0) or 0))

        # ID da Transação (em v2 é purchase.transaction como 'HP1234567890')
        external_id = str(
            (purchase.get("transaction") if isinstance(purchase, dict) else None)
            or payload.get("id")
            or payload.get("order_id")
            or payload.get("transaction_id")
            or payload.get("sale_id")
            or event_name
            or ""
        )

        customer_email = (
            buyer.get("email")
            or payload.get("email")
            or ""
        )
        customer_name = (
            buyer.get("name")
            or payload.get("full_name")
            or payload.get("customer_name")
        )
        customer_cpf = (
            buyer.get("document")
            or buyer.get("cpf")
            or payload.get("cpf")
        )
        customer_phone = (
            buyer.get("checkout_phone")
            or buyer.get("phone")
            or buyer.get("mobile")
            or payload.get("phone")
        )

        payment_info = purchase.get("payment") or {} if isinstance(purchase, dict) else {}
        payment_method = str(
            payment_info.get("type")
            or payment_info.get("method")
            or payload.get("payment_method")
            or payload.get("method")
            or ""
        )

        checkout_url = (
            checkout.get("url")
            or payload.get("checkout_url")
            or (f"https://pay.hotmart.com/{product.get('ucode')}" if product.get("ucode") else None)
        )

        return StandardizedWebhookEvent(
            external_id=external_id,
            platform=PaymentPlatform.HOTMART,
            status=status,
            amount=float(amount),
            original_status=str(raw_status),
            payment_method=payment_method,
            payment_status=str(payload.get("payment_status") or raw_status or ""),
            product_external_id=str(product.get("id") or product.get("product_id") or payload.get("product_id") or product.get("ucode") or ""),
            product_name=str(product.get("name") or payload.get("product_name") or ""),
            product_price=float(product_price),
            customer_external_id=str(buyer.get("id") or buyer.get("customer_id") or payload.get("buyer_id") or ""),
            customer_email=customer_email,
            customer_name=customer_name,
            customer_cpf=customer_cpf,
            customer_phone=customer_phone,
            utm_source=origin.get("utm_source") or utm.get("source") or utm.get("utm_source"),
            utm_medium=origin.get("utm_medium") or utm.get("medium") or utm.get("utm_medium"),
            utm_campaign=origin.get("utm_campaign") or utm.get("campaign") or utm.get("utm_campaign"),
            utm_content=origin.get("utm_content") or utm.get("content") or utm.get("utm_content"),
            utm_term=origin.get("utm_term") or utm.get("term") or utm.get("utm_term"),
            src=origin.get("src") or origin.get("sck") or utm.get("src") or utm.get("sck"),
            checkout_url=checkout_url,
            order_bumps=d.get("order_bumps") or payload.get("order_bumps", []) or [],
        )

    except Exception as e:
        logger.error(f"Erro ao parsear webhook da Hotmart: {e}", exc_info=True)
        return None
