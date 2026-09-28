"""
Serviço principal que orquestra todas as buscas da Meta Ads.
Ponto de entrada único para a camada de API.
Usa asyncio.gather para paralelizar e cache para evitar chamadas duplicadas.
"""
import asyncio
import logging

from integrations.meta_ads.client import MetaAdsClient
from integrations.meta_ads.campaigns import fetch_campaigns
from integrations.meta_ads.adsets import fetch_adsets
from integrations.meta_ads.ads import fetch_ads
from integrations.meta_ads.account import fetch_account_insights
from integrations.meta_ads.cache import (
    get_cached, set_cached, build_cache_key,
)
from integrations.meta_ads.schemas import (
    CampaignInsights,
    AdSetInsights,
    AdInsights,
    AccountInsightsSummary,
)
from services.currency import convert_spend_to_system_base

logger = logging.getLogger(__name__)

# TTL do cache em segundos (5 minutos)
CACHE_TTL = 300


class MetaAdsService:
    """
    Fachada para toda integração com Meta Ads.
    Usa cache + paralelização para minimizar chamadas à API.
    Converte automaticamente spend de USD (ou outra moeda) para a base do sistema.
    """

    def __init__(self, access_token: str, account_id: str, currency: str = "BRL"):
        self.client = MetaAdsClient(access_token, account_id)
        self._account_id = account_id
        self.currency = (currency or "BRL").upper()

    async def detect_currency(self) -> str:
        """Busca a moeda configurada na conta de anúncios na Meta Graph API."""
        try:
            data = await self.client._get(f"{self.client.account_id}", params={"fields": "currency"})
            curr = data.get("currency")
            if curr:
                self.currency = curr.upper()
                return self.currency
        except Exception as e:
            logger.warning(f"Erro ao detectar moeda da conta {self.client.account_id}: {e}")
        return self.currency

    async def get_campaigns(
        self, date_start: str, date_end: str,
    ) -> list[CampaignInsights]:
        key = build_cache_key(
            self._account_id, f"campaigns_{self.currency}", date_start, date_end,
        )
        cached = get_cached(key)
        if cached is not None:
            return cached
        result = await fetch_campaigns(self.client, date_start, date_end)
        if self.currency != "BRL":
            for c in result:
                c.spend = convert_spend_to_system_base(c.spend, self.currency)
                c.cpc = convert_spend_to_system_base(c.cpc, self.currency)
        set_cached(key, result, CACHE_TTL)
        return result

    async def get_adsets(
        self, date_start: str, date_end: str,
    ) -> list[AdSetInsights]:
        key = build_cache_key(
            self._account_id, f"adsets_{self.currency}", date_start, date_end,
        )
        cached = get_cached(key)
        if cached is not None:
            return cached
        result = await fetch_adsets(self.client, date_start, date_end)
        if self.currency != "BRL":
            for a in result:
                a.spend = convert_spend_to_system_base(a.spend, self.currency)
                a.cpc = convert_spend_to_system_base(a.cpc, self.currency)
        set_cached(key, result, CACHE_TTL)
        return result

    async def get_ads(
        self, date_start: str, date_end: str,
    ) -> list[AdInsights]:
        key = build_cache_key(
            self._account_id, f"ads_{self.currency}", date_start, date_end,
        )
        cached = get_cached(key)
        if cached is not None:
            return cached
        result = await fetch_ads(self.client, date_start, date_end)
        if self.currency != "BRL":
            for ad in result:
                ad.spend = convert_spend_to_system_base(ad.spend, self.currency)
                ad.cpc = convert_spend_to_system_base(ad.cpc, self.currency)
        set_cached(key, result, CACHE_TTL)
        return result

    async def get_all_levels(
        self, date_start: str, date_end: str,
    ) -> tuple[list[CampaignInsights], list[AdSetInsights], list[AdInsights]]:
        """
        Busca campanhas, adsets e ads em paralelo.
        Usa cache individual para cada nível.
        Reduz tempo total de resposta significativamente.
        """
        campaigns, adsets, ads = await asyncio.gather(
            self.get_campaigns(date_start, date_end),
            self.get_adsets(date_start, date_end),
            self.get_ads(date_start, date_end),
        )
        return campaigns, adsets, ads

    async def get_account_summary(
        self, date_start: str, date_end: str,
    ) -> AccountInsightsSummary:
        key = build_cache_key(
            self._account_id, f"account_{self.currency}", date_start, date_end,
        )
        cached = get_cached(key)
        if cached is not None:
            return cached
        result = await fetch_account_insights(
            self.client, date_start, date_end,
        )
        if self.currency != "BRL":
            result.spend = convert_spend_to_system_base(result.spend, self.currency)
            result.cpc = convert_spend_to_system_base(result.cpc, self.currency)
        set_cached(key, result, CACHE_TTL)
        return result

    async def close(self):
        await self.client.close()
