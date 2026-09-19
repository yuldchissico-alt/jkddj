// Taxa de conversão BRL para MZN (Metical de Moçambique)
// Aproximadamente 1 BRL = 13 MZN
const BRL_TO_MZN = 13;

/**
 * Converte valor de BRL para MZN
 */
function convertToMZN(brlValue: number): number {
  return brlValue * BRL_TO_MZN;
}

/**
 * Formata valores em Metical (valor já em MZN)
 */
export function formatMZN(mznValue: number, decimals: number = 2): string {
  return `${mznValue.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} MT`;
}

/**
 * Converte BRL para MZN e formata
 */
export function convertAndFormatMZN(brlValue: number, decimals: number = 2): string {
  return formatMZN(convertToMZN(brlValue), decimals);
}

/**
 * Formata valores monetários de forma compacta para caber em cards.
 * Ex: 1234 -> "16.042 MT", 12345 -> "160,5 mil MT", 1234567 -> "16,05 M MT"
 * Valores são convertidos de BRL para MZN automaticamente
 */
export function fmtCompact(value: number): string {
  const mznValue = convertToMZN(value);
  const abs = Math.abs(mznValue);
  const sign = mznValue < 0 ? "-" : "";

  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} B MT`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} M MT`;
  }
  if (abs >= 100_000) {
    return `${sign}${(abs / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil MT`;
  }

  return `${abs.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} MT`;
}

/**
 * Formato completo sempre com 2 casas decimais.
 * Valores são convertidos de BRL para MZN automaticamente
 */
export function fmtFull(value: number): string {
  const mznValue = convertToMZN(value);
  return `${mznValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MT`;
}

/**
 * Formata número grande de forma compacta (sem símbolo de moeda).
 * Ex: 12345 -> "12,3 mil", 1234567 -> "1,23 M"
 */
export function fmtNumber(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} M`;
  }
  if (abs >= 100_000) {
    return `${sign}${(abs / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  }

  return value.toLocaleString("pt-BR");
}
