-- Adicionar coluna de moeda (USD, BRL, etc.) para contas do Facebook Ads
ALTER TABLE facebook_accounts
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'BRL';

UPDATE facebook_accounts
SET currency = 'BRL'
WHERE currency IS NULL;
