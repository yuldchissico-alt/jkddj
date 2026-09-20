from api.meta.oauth import _choose_primary_ad_account


def test_choose_primary_ad_account_uses_account_id_from_adaccounts():
    payload = {
        "data": [
            {"id": "act_999", "account_id": "999", "name": "Conta A"},
            {"id": "act_888", "account_id": "888", "name": "Conta B"},
        ]
    }

    assert _choose_primary_ad_account(payload) == ("act_999", "Conta A")


def test_choose_primary_ad_account_handles_missing_account_id_field():
    payload = {
        "data": [
            {"id": "act_321", "name": "Conta sem account_id"},
            {"id": "act_654", "name": "Outra conta"},
        ]
    }

    assert _choose_primary_ad_account(payload) == ("act_321", "Conta sem account_id")
