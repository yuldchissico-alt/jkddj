"""
Serviço central de moedas e conversão para Metical (MZN).
Moçambique utiliza o Metical (MZN / MT).

Cotações de conversão para Metical:
- 1 USD = 64 MZN (Cotação padrão do Metical em relação ao Dólar Americano)
- 1 BRL = 13 MZN (Cotação padrão utilizada no sistema: 1 Real = 13 Meticais)
- 1 EUR = 70 MZN (Cotação Euro / Metical)
- 1 MZN = 1 MZN (Valor direto em Metical)
"""
import logging
from typing import Tuple

logger = logging.getLogger(__name__)

RATES_TO_MZN = {
    "USD": 64.0,
    "BRL": 13.0,
    "EUR": 70.0,
    "MZN": 1.0,
    "MT": 1.0,
}

BASE_MZN_PER_BRL = 13.0  # Base interna do sistema para manter compatibilidade com frontend (valor * 13)


def normalize_currency_code(currency: str | None) -> str:
    """Normaliza o código de moeda para ISO uppercase."""
    if not currency:
        return "BRL"
    c = str(currency).strip().upper()
    if c in {"USD", "$", "US$", "DOLAR", "DOLLAR"}:
        return "USD"
    if c in {"BRL", "R$", "REAL", "REAIS"}:
        return "BRL"
    if c in {"EUR", "€", "EURO"}:
        return "EUR"
    if c in {"MZN", "MT", "METICAL", "METICAIS"}:
        return "MZN"
    return c


def to_metical(amount: float, currency: str | None) -> float:
    """Converte um valor em qualquer moeda suportada diretamente para Metical (MZN)."""
    curr = normalize_currency_code(currency)
    rate = RATES_TO_MZN.get(curr, RATES_TO_MZN["BRL"])
    return round(float(amount) * rate, 2)


def to_system_base(amount: float, currency: str | None) -> Tuple[float, float, str, float]:
    """
    Processa um valor recebido em qualquer moeda (USD, BRL, MZN, EUR) e retorna:
    (amount_base, amount_mzn, original_currency, original_amount)

    - amount_base: Valor normalizado para a base do sistema (base * 13 == amount_mzn)
    - amount_mzn: Valor exato em Meticais (MT)
    - original_currency: Código da moeda de origem ('USD', 'BRL', etc.)
    - original_amount: Valor original recebido na moeda de origem
    """
    curr = normalize_currency_code(currency)
    orig_amt = float(amount or 0.0)
    mzn_amt = to_metical(orig_amt, curr)
    base_amt = round(mzn_amt / BASE_MZN_PER_BRL, 4)
    return base_amt, mzn_amt, curr, orig_amt


def convert_spend_to_system_base(spend: float, currency: str | None) -> float:
    """
    Converte o spend da Meta Ads (que vem na moeda da conta de anúncios, ex: USD ou BRL)
    para a base do sistema (BRL base), garantindo que ao multiplicar por 13 no frontend
    ou subtrair do revenue, o valor em Meticais (MT) seja matematicamente exato.
    """
    if not spend:
        return 0.0
    base_amt, _, _, _ = to_system_base(spend, currency)
    return base_amt

