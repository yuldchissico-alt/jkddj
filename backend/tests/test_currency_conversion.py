from services.currency import to_metical, to_system_base, normalize_currency_code
from integrations.webhook.hotmart import parse_hotmart_webhook
from integrations.webhook.kiwify import parse_kiwify_webhook
from integrations.webhook.payt import parse_payt_webhook
from integrations.webhook.api_direct import parse_api_webhook
from database.models.transaction import TransactionStatus, PaymentPlatform


def test_normalize_currency_code():
    assert normalize_currency_code("usd") == "USD"
    assert normalize_currency_code("USD") == "USD"
    assert normalize_currency_code("$") == "USD"
    assert normalize_currency_code("brl") == "BRL"
    assert normalize_currency_code("R$") == "BRL"
    assert normalize_currency_code("mzn") == "MZN"
    assert normalize_currency_code("MT") == "MZN"
    assert normalize_currency_code("eur") == "EUR"
    assert normalize_currency_code(None) == "BRL"


def test_to_metical():
    # 1 USD = 64 MZN
    assert to_metical(100.0, "USD") == 6400.0
    assert to_metical(50.0, "USD") == 3200.0

    # 1 BRL = 13 MZN
    assert to_metical(100.0, "BRL") == 1300.0
    assert to_metical(197.0, "BRL") == 2561.0

    # 1 EUR = 70 MZN
    assert to_metical(10.0, "EUR") == 700.0

    # 1 MZN = 1 MZN
    assert to_metical(1500.0, "MZN") == 1500.0


def test_to_system_base_maintains_exact_mzn_value_after_frontend_multiplication():
    # Frontend faz: valor * 13 = MT
    # Portanto base_amount * 13 DEVE ser igual a amount_mzn!

    # USD $100
    base_usd, mzn_usd, curr_usd, orig_usd = to_system_base(100.0, "USD")
    assert curr_usd == "USD"
    assert orig_usd == 100.0
    assert mzn_usd == 6400.0
    assert round(base_usd * 13, 2) == 6400.0

    # BRL R$100
    base_brl, mzn_brl, curr_brl, orig_brl = to_system_base(100.0, "BRL")
    assert curr_brl == "BRL"
    assert orig_brl == 100.0
    assert mzn_brl == 1300.0
    assert round(base_brl * 13, 2) == 1300.0

    # MZN 2600 MT
    base_mzn, mzn_mzn, curr_mzn, orig_mzn = to_system_base(2600.0, "MZN")
    assert curr_mzn == "MZN"
    assert orig_mzn == 2600.0
    assert mzn_mzn == 2600.0
    assert round(base_mzn * 13, 2) == 2600.0


def test_hotmart_webhook_captures_usd_currency():
    payload = {
        "event": "PURCHASE_APPROVED",
        "data": {
            "product": {"id": 123, "name": "Global Course USD"},
            "buyer": {"name": "John Doe", "email": "john@global.com"},
            "purchase": {
                "transaction": "HP_USD_001",
                "status": "APPROVED",
                "price": {
                    "value": 50.00,
                    "currency_value": "USD"
                }
            }
        }
    }
    event = parse_hotmart_webhook(payload)
    assert event is not None
    assert event.currency == "USD"
    assert event.amount == 50.00

    base, mzn, curr, orig = to_system_base(event.amount, event.currency)
    assert curr == "USD"
    assert mzn == 3200.0  # 50 USD * 64 = 3200 MT
    assert round(base * 13, 2) == 3200.0


def test_kiwify_webhook_captures_currency():
    payload = {
        "order_id": "kiwi_usd_123",
        "order_status": "paid",
        "Commissions": {
            "my_commission": 2500,  # $25.00
            "currency": "USD"
        },
        "Product": {"product_id": "p1", "product_name": "Ebook USD"},
        "Customer": {"email": "customer@usd.com", "full_name": "Buyer"}
    }
    event = parse_kiwify_webhook(payload)
    assert event is not None
    assert event.currency == "USD"
    assert event.amount == 25.0

    base, mzn, curr, _ = to_system_base(event.amount, event.currency)
    assert mzn == 1600.0  # 25 USD * 64 = 1600 MT
    assert round(base * 13, 2) == 1600.0


def test_api_webhook_captures_currency():
    payload = {
        "external_id": "api_sale_1",
        "status": "approved",
        "amount": 75.0,
        "currency": "USD",
        "product_external_id": "prod_1",
        "product_name": "API Prod",
        "customer_email": "api@test.com"
    }
    event = parse_api_webhook(payload)
    assert event is not None
    assert event.currency == "USD"
    assert event.amount == 75.0


def test_convert_spend_to_system_base():
    from services.currency import convert_spend_to_system_base

    # Se a conta Meta gastou $100 USD:
    # 100 USD = 6400 MT. Na base do sistema (base * 13 == 6400), base é 492.3077.
    # Quando o frontend multiplica por 13, dá exatamente 6400 MT!
    spend_usd = 100.0
    base_spend = convert_spend_to_system_base(spend_usd, "USD")
    assert round(base_spend * 13, 2) == 6400.0

    # Se a conta Meta gastou R$ 100 BRL:
    # 100 BRL = 1300 MT. Na base do sistema, base é 100.0.
    spend_brl = 100.0
    base_spend_brl = convert_spend_to_system_base(spend_brl, "BRL")
    assert base_spend_brl == 100.0
    assert round(base_spend_brl * 13, 2) == 1300.0
