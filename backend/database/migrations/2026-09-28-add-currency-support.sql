-- Adicionar suporte a múltiplas moedas (USD, BRL, MZN) na tabela de transações
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS original_currency VARCHAR(10) DEFAULT 'BRL',
    ADD COLUMN IF NOT EXISTS original_amount DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS amount_mzn DOUBLE PRECISION;

-- Atualizar registros existentes que não possuem amount_mzn
UPDATE transactions
SET 
    original_currency = COALESCE(original_currency, 'BRL'),
    original_amount = COALESCE(original_amount, amount),
    amount_mzn = COALESCE(amount_mzn, amount * 13)
WHERE amount_mzn IS NULL;
