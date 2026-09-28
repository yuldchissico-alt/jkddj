from integrations.webhook.hotmart import parse_hotmart_webhook
from database.models.transaction import PaymentPlatform, TransactionStatus


def test_parse_hotmart_webhook_extracts_hotmart_specific_fields():
    payload = {
        "event": "sale.approved",
        "status": "approved",
        "amount": 7996,
        "currency": "BRL",
        "product": {
            "id": "prod-123",
            "name": "Curso de Vendas",
            "price": 19990,
        },
        "buyer": {
            "name": "Maria Silva",
            "email": "maria@example.com",
            "cpf": "12345678909",
            "phone": "5511999999999",
        },
        "checkout": {
            "url": "https://pay.hotmart.com/ABC123",
        },
        "utm": {
            "source": "instagram",
            "medium": "social",
            "campaign": "blackfriday",
        },
        "order_bumps": [{"name": "Bônus 1", "price": 990}]
    }

    event = parse_hotmart_webhook(payload)

    assert event is not None
    assert event.platform == PaymentPlatform.HOTMART
    assert event.status == TransactionStatus.APPROVED
    assert event.product_external_id == "prod-123"
    assert event.product_name == "Curso de Vendas"
    assert event.product_price == 199.9
    assert event.customer_email == "maria@example.com"
    assert event.customer_name == "Maria Silva"
    assert event.checkout_url == "https://pay.hotmart.com/ABC123"
    assert event.utm_source == "instagram"
    assert event.utm_campaign == "blackfriday"
    assert event.order_bumps == [{"name": "Bônus 1", "price": 990}]


def test_parse_hotmart_webhook_v2_approved():
    payload = {
        "id": "2b3e8c90-1234-4567-8901",
        "creation_date": 1640995200000,
        "event": "PURCHASE_APPROVED",
        "version": "2.0.0",
        "data": {
            "product": {
                "id": 98765,
                "name": "Mentoria Exclusiva Hotmart",
                "ucode": "MNT123XYZ"
            },
            "buyer": {
                "name": "Carlos Souza",
                "email": "carlos@example.com",
                "checkout_phone": "11988887777",
                "document": "98765432100"
            },
            "purchase": {
                "transaction": "HP9876543210",
                "status": "APPROVED",
                "price": {
                    "value": 497.00,
                    "currency_value": "BRL"
                },
                "payment": {
                    "type": "CREDIT_CARD",
                    "method": "CREDIT_CARD"
                },
                "origin": {
                    "utm_source": "facebook",
                    "utm_campaign": "escala-pro",
                    "src": "stories_lead"
                }
            }
        }
    }

    event = parse_hotmart_webhook(payload)

    assert event is not None
    assert event.platform == PaymentPlatform.HOTMART
    assert event.status == TransactionStatus.APPROVED
    assert event.external_id == "HP9876543210"
    assert event.amount == 497.00
    assert event.product_name == "Mentoria Exclusiva Hotmart"
    assert event.customer_email == "carlos@example.com"
    assert event.customer_name == "Carlos Souza"
    assert event.customer_phone == "11988887777"
    assert event.customer_cpf == "98765432100"
    assert event.utm_source == "facebook"
    assert event.utm_campaign == "escala-pro"
    assert event.src == "stories_lead"
    assert event.checkout_url == "https://pay.hotmart.com/MNT123XYZ"


def test_parse_hotmart_webhook_v2_refund_and_chargeback():
    refund_payload = {
        "event": "PURCHASE_REFUNDED",
        "data": {
            "product": {"id": 1, "name": "Produto"},
            "buyer": {"email": "buyer@test.com"},
            "purchase": {"transaction": "HP_REFUND", "status": "REFUNDED", "price": {"value": 150.0}}
        }
    }
    event_refund = parse_hotmart_webhook(refund_payload)
    assert event_refund is not None
    assert event_refund.status == TransactionStatus.REFUNDED

    cb_payload = {
        "event": "PURCHASE_CHARGEBACK",
        "data": {
            "product": {"id": 1, "name": "Produto"},
            "buyer": {"email": "buyer@test.com"},
            "purchase": {"transaction": "HP_CB", "status": "CHARGEBACK", "price": {"value": 150.0}}
        }
    }
    event_cb = parse_hotmart_webhook(cb_payload)
    assert event_cb is not None
    assert event_cb.status == TransactionStatus.CHARGEBACK

