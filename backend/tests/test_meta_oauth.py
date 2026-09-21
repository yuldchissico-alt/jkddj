import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import httpx

from api.meta.oauth import choose_primary_ad_account, meta_oauth_callback


class DummyQuery:
    def __init__(self, result=None):
        self.result = result

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self.result

    def order_by(self, *args, **kwargs):
        return self


def test_meta_oauth_callback_handles_profile_fetch_error():
    request = SimpleNamespace(
        query_params={
            "code": "test-code",
            "state": "test-state",
        }
    )

    db = MagicMock()
    db.query.side_effect = lambda model: DummyQuery(None)

    async def fake_client_post(*args, **kwargs):
        response = MagicMock()
        response.raise_for_status.return_value = None
        response.json.return_value = {"access_token": "abc123", "expires_in": 3600}
        return response

    async def fake_client_get(*args, **kwargs):
        response = MagicMock()
        response.status_code = 400
        response.text = "bad token"
        response.json.return_value = {"error": {"message": "Invalid OAuth access token."}}
        return response

    with patch("api.meta.oauth.verify_token", return_value={"sub": "42", "company_id": "7", "type": "meta_oauth"}), \
         patch("api.meta.oauth.META_APP_SECRET", "secret"), \
         patch("api.meta.oauth.META_APP_ID", "app-id"), \
         patch("api.meta.oauth.httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value.post = AsyncMock(side_effect=fake_client_post)
        mock_client.return_value.__aenter__.return_value.get = AsyncMock(side_effect=fake_client_get)

        response = asyncio.run(meta_oauth_callback(request, db))

        assert response.status_code == 302
        assert "meta_status=error" in response.headers["location"]


def test_choose_primary_ad_account_uses_account_id_from_adaccounts():
    profile = {"id": "user-123", "name": "Jane"}
    adaccounts = [
        {"id": "ad-1", "account_id": "act_987654321", "name": "Primary"},
        {"id": "ad-2", "account_id": "act_222222222", "name": "Secondary"},
    ]

    assert choose_primary_ad_account(profile, adaccounts) == "act_987654321"


def test_choose_primary_ad_account_handles_missing_account_id_field():
    profile = {"id": "user-123", "name": "Jane"}
    adaccounts = [
        {"id": "act_555555555", "name": "Primary"},
        {"id": "act_777777777", "name": "Secondary"},
    ]

    assert choose_primary_ad_account(profile, adaccounts) == "act_555555555"
