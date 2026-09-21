import logging
from sqlalchemy import text
from datetime import datetime, date, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

logger = logging.getLogger(__name__)

# Timezone padrão: São Paulo (UTC-3 / UTC-2 no horário de verão)
SAO_PAULO_TZ = "America/Sao_Paulo"

try:
    SP_ZONE = ZoneInfo(SAO_PAULO_TZ)
except ZoneInfoNotFoundError:
    # Windows e imagens Linux mínimas não trazem a base IANA de timezones
    # (pacote Python "tzdata"). O Brasil não observa horário de verão desde
    # 2019, então o offset fixo UTC-3 é correto para São Paulo.
    logger.warning(
        "Base IANA de timezones indisponível; usando offset fixo UTC-3 para "
        "São Paulo. Instale o pacote 'tzdata' para o cálculo exato."
    )
    SP_ZONE = timezone(timedelta(hours=-3))

# Default SQL para created_at e updated_at com timezone São Paulo
CREATED_AT_DEFAULT = text("(NOW() AT TIME ZONE 'America/Sao_Paulo')")
UPDATED_AT_DEFAULT = text("(NOW() AT TIME ZONE 'America/Sao_Paulo')")


def now_sp() -> datetime:
    """Retorna datetime.now() no timezone de São Paulo."""
    return datetime.now(SP_ZONE).replace(tzinfo=None)


def today_sp() -> date:
    """Retorna a data de hoje no timezone de São Paulo."""
    return datetime.now(SP_ZONE).date()


def today_sp_str() -> str:
    """Retorna a data de hoje no formato YYYY-MM-DD (São Paulo)."""
    return today_sp().isoformat()
