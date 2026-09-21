-- Fix missing multi-tenant columns for company-scoped endpoints and dashboards
ALTER TABLE admins ADD COLUMN IF NOT EXISTS company_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_admins_company_id ON admins(company_id);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS company_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON transactions(company_id);

ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);

ALTER TABLE products ADD COLUMN IF NOT EXISTS company_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);

ALTER TABLE facebook_accounts ADD COLUMN IF NOT EXISTS company_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_facebook_accounts_company_id ON facebook_accounts(company_id);

ALTER TABLE webhook_endpoints ADD COLUMN IF NOT EXISTS company_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_company_id ON webhook_endpoints(company_id);

ALTER TABLE campaign_tags ADD COLUMN IF NOT EXISTS company_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_campaign_tags_company_id ON campaign_tags(company_id);

ALTER TABLE campaign_presets ADD COLUMN IF NOT EXISTS company_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_campaign_presets_company_id ON campaign_presets(company_id);

ALTER TABLE campaign_markers ADD COLUMN IF NOT EXISTS company_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_campaign_markers_company_id ON campaign_markers(company_id);

ALTER TABLE campaign_actions ADD COLUMN IF NOT EXISTS company_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_campaign_actions_company_id ON campaign_actions(company_id);

ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS company_id INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS uq_company_settings_company_id ON company_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_company_settings_company_id ON company_settings(company_id);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gemini_accounts') THEN
        ALTER TABLE gemini_accounts ADD COLUMN IF NOT EXISTS company_id INTEGER;
        CREATE INDEX IF NOT EXISTS idx_gemini_accounts_company_id ON gemini_accounts(company_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_accounts') THEN
        ALTER TABLE stripe_accounts ADD COLUMN IF NOT EXISTS company_id INTEGER;
        CREATE INDEX IF NOT EXISTS idx_stripe_accounts_company_id ON stripe_accounts(company_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'push_subscriptions') THEN
        ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS company_id INTEGER;
        CREATE INDEX IF NOT EXISTS idx_push_subscriptions_company_id ON push_subscriptions(company_id);
    END IF;
END $$;

UPDATE admins SET company_id = 1 WHERE company_id IS NULL;
UPDATE transactions SET company_id = 1 WHERE company_id IS NULL;
UPDATE customers SET company_id = 1 WHERE company_id IS NULL;
UPDATE products SET company_id = 1 WHERE company_id IS NULL;
UPDATE facebook_accounts SET company_id = 1 WHERE company_id IS NULL;
UPDATE webhook_endpoints SET company_id = 1 WHERE company_id IS NULL;
UPDATE campaign_tags SET company_id = 1 WHERE company_id IS NULL;
UPDATE campaign_presets SET company_id = 1 WHERE company_id IS NULL;
UPDATE campaign_markers SET company_id = 1 WHERE company_id IS NULL;
UPDATE campaign_actions SET company_id = 1 WHERE company_id IS NULL;
UPDATE company_settings SET company_id = 1 WHERE company_id IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gemini_accounts') THEN
        UPDATE gemini_accounts SET company_id = 1 WHERE company_id IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_accounts') THEN
        UPDATE stripe_accounts SET company_id = 1 WHERE company_id IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'push_subscriptions') THEN
        UPDATE push_subscriptions SET company_id = 1 WHERE company_id IS NULL;
    END IF;
END $$;
