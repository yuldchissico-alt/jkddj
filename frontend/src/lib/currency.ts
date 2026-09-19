/**
 * Utilitário de formatação de moeda para Moçambique
 * Backend armazena valores em BRL, frontend exibe em MZN
 * Taxa de conversão: 1 BRL = 13 MZN
 */

export const BRL_TO_MZN = 13;

/**
 * Formata valor em MZN (Metical Moçambicano)
 * @param value - Valor numérico
 * @param options - Opções de formatação
 */
export function formatMZN(
  value: number,
  options?: {
    compact?: boolean; // true = "65k", false = "65.000"
    showSymbol?: boolean; // Mostrar "MT" 
    decimals?: number; // Casas decimais (padrão: 0)
  }
): string {
  const { compact = false, showSymbol = true, decimals = 0 } = options ?? {};

  if (compact) {
    const symbol = showSymbol ? " MT" : "";
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M${symbol}`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}k${symbol}`;
    }
    return `${value.toFixed(decimals)}${symbol}`;
  }

  const formatted = value.toLocaleString("pt-MZ", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showSymbol ? `MT ${formatted}` : formatted;
}

/**
 * Formata com estilo de moeda completo (MT 1.234,56)
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-MZ", {
    style: "currency",
    currency: "MZN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Símbolo de moeda para inputs
 */
export const CURRENCY_SYMBOL = "MT";

/**
 * Converte MZN (do input do usuário) para BRL (para enviar ao backend)
 */
export function mznToBRL(mznValue: number): number {
  return mznValue / BRL_TO_MZN;
}

/**
 * Converte BRL (do backend) para MZN (para mostrar ao usuário)
 */
export function brlToMZN(brlValue: number): number {
  return brlValue * BRL_TO_MZN;
}
