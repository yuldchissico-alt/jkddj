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
