-- ============================================================
-- LOG POSE - Database Schema Completo
-- ============================================================
-- Este arquivo contém o schema completo para criar o banco
-- de dados do Log Pose do zero.
-- ============================================================

-- Criar o banco de dados (execute separadamente se necessário)
-- CREATE DATABASE logpose;
-- \c logpose;

-- ============================================================
-- CRIAR TIPOS ENUM
-- ============================================================

CREATE TYPE userrole AS ENUM ('owner', 'admin', 'viewer');
CREATE TYPE transactionstatus AS ENUM ('APPROVED', 'REFUNDED', 'CHARGEBACK', 'PENDING', 'TRIAL');
CREATE TYPE paymentplatform AS ENUM ('KIWIFY', 'PAYT', 'API');
CREATE TYPE webhookplatform AS ENUM ('KIWIFY', 'PAYT', 'API');
CREATE TYPE recoverytype AS ENUM ('ABANDONED_CART', 'DECLINED_CARD', 'UNPAID_PIX', 'TRIAL');
CREATE TYPE recoverychannel AS ENUM ('WHATSAPP', 'EMAIL', 'SMS', 'BACK_REDIRECT', 'OTHER');
CREATE TYPE checkoutplatform AS ENUM ('KIWIFY', 'PAYT');
CREATE TYPE markertype AS ENUM ('VIDEO', 'CHECKOUT', 'PRODUCT', 'PLATFORM');
CREATE TYPE actiontype AS ENUM ('BUDGET_INCREASE', 'BUDGET_DECREASE', 'PAUSE', 'ACTIVATE');

-- ============================================================
-- TABELA: company_settings
-- Configurações gerais da empresa
-- ============================================================

CREATE TABLE company_settings (
    id SERIAL PRIMARY KEY,
    tax_rate FLOAT DEFAULT 12.3,
    operational_costs JSONB DEFAULT '[]'::jsonb,
    kpi_colors JSONB DEFAULT '{
        "roas": {
            "green": {"min": 3},
            "yellow": {"min": 2, "max": 3},
            "red": {"max": 2}
        },
        "cpa": null,
        "ctr": null,
        "cpc": null
    }'::jsonb,
    ai_instructions JSONB DEFAULT '{
        "metrics": {
            "roas": null,
            "cpa": null,
            "cpc": null,
            "connect_rate": null
        },
        "additional_prompt": ""
    }'::jsonb,
    stripe_enabled BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO company_settings (id) VALUES (1);

-- ============================================================
-- TABELA: admins
-- Usuários administradores do sistema
-- ============================================================

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    role userrole NOT NULL DEFAULT 'admin',
    invite_token VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ix_admins_email ON admins(email);
CREATE INDEX ix_admins_invite_token ON admins(invite_token);

-- ============================================================
-- TABELA: customers
-- Clientes que realizaram compras
-- ============================================================

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    cpf VARCHAR(20),
    total_spent FLOAT DEFAULT 0.0,
    total_orders INTEGER DEFAULT 0,
    first_purchase_at TIMESTAMP WITH TIME ZONE,
    last_purchase_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ix_customers_email ON customers(email);
CREATE INDEX ix_customers_external_id ON customers(external_id);

-- ============================================================
-- TABELA: products
-- Produtos cadastrados
-- ============================================================

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: product_aliases
-- Nomes alternativos para produtos
-- ============================================================

CREATE TABLE product_aliases (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    alias VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (product_id, alias)
);

CREATE INDEX ix_product_aliases_product_id ON product_aliases(product_id);
CREATE INDEX ix_product_aliases_alias ON product_aliases(alias);

-- ============================================================
-- TABELA: checkouts
-- URLs de checkout vinculadas a produtos
-- ============================================================

CREATE TABLE checkouts (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url VARCHAR(500) DEFAULT '',
    price FLOAT NOT NULL DEFAULT 0.0,
    platform checkoutplatform NOT NULL,
    checkout_code VARCHAR(255),
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ix_checkouts_product_id ON checkouts(product_id);
CREATE INDEX ix_checkouts_checkout_code ON checkouts(checkout_code);

-- ============================================================
-- TABELA: order_bumps
-- Order bumps vinculados a produtos
-- ============================================================

CREATE TABLE order_bumps (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    external_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    price FLOAT NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ix_order_bumps_product_id ON order_bumps(product_id);

-- ============================================================
-- TABELA: upsells
-- Upsells vinculados a produtos
-- ============================================================

CREATE TABLE upsells (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    external_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    price FLOAT NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ix_upsells_product_id ON upsells(product_id);

-- ============================================================
-- TABELA: customer_products
-- Relacionamento entre clientes e produtos comprados
-- ============================================================

CREATE TABLE customer_products (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    first_purchase_at TIMESTAMP WITH TIME ZONE,
    last_purchase_at TIMESTAMP WITH TIME ZONE,
    total_spent FLOAT DEFAULT 0.0,
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (customer_id, product_id)
);

CREATE INDEX ix_customer_products_customer_id ON customer_products(customer_id);
CREATE INDEX ix_customer_products_product_id ON customer_products(product_id);

-- ============================================================
-- TABELA: webhook_endpoints
-- Endpoints de webhook para receber dados das plataformas
-- ============================================================

CREATE TABLE webhook_endpoints (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    platform webhookplatform NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ix_webhook_endpoints_slug ON webhook_endpoints(slug);

-- ============================================================
-- TABELA: transactions
-- Transações de vendas recebidas via webhook
-- ============================================================

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) UNIQUE NOT NULL,
    platform paymentplatform NOT NULL,
    status transactionstatus DEFAULT 'APPROVED',
    amount FLOAT NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    customer_email VARCHAR(255),
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    src TEXT,
    webhook_slug VARCHAR(50),
    checkout_url VARCHAR(1024),
    order_bumps JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ix_transactions_customer_id ON transactions(customer_id);
CREATE INDEX ix_transactions_product_id ON transactions(product_id);
CREATE INDEX ix_transactions_customer_email ON transactions(customer_email);
CREATE INDEX ix_transactions_webhook_slug ON transactions(webhook_slug);
CREATE INDEX ix_transactions_external_id ON transactions(external_id);

-- ============================================================
-- TABELA: recoveries
-- Tentativas de recuperação de vendas perdidas
-- ============================================================

CREATE TABLE recoveries (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    product_name VARCHAR(255),
    type recoverytype NOT NULL,
    amount FLOAT NOT NULL,
    recovered BOOLEAN DEFAULT false,
    channel recoverychannel,
    src VARCHAR(255),
    webhook_slug VARCHAR(50),
    recovered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ix_recoveries_customer_id ON recoveries(customer_id);
CREATE INDEX ix_recoveries_customer_email ON recoveries(customer_email);

-- ============================================================
-- TABELA: recovery_channel_configs
-- Configurações de canais de recuperação
-- ============================================================

CREATE TABLE recovery_channel_configs (
    id SERIAL PRIMARY KEY,
    channel recoverychannel NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT false,
    label VARCHAR(100),
    is_custom BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: refund_reasons
-- Motivos de reembolso
-- ============================================================

CREATE TABLE refund_reasons (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ix_refund_reasons_transaction_id ON refund_reasons(transaction_id);

-- ============================================================
-- TABELA: facebook_accounts
-- Contas do Facebook Ads conectadas
-- ============================================================

CREATE TABLE facebook_accounts (
    id SERIAL PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    account_id VARCHAR(100) UNIQUE NOT NULL,
    access_token VARCHAR(500) NOT NULL,
    business_id VARCHAR(100),
    token_valid BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: vturb_accounts
-- Contas VTurb conectadas
-- ============================================================

CREATE TABLE vturb_accounts (
    id SERIAL PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    api_token VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: gemini_accounts
-- Contas Google Gemini (IA) conectadas
-- ============================================================

CREATE TABLE gemini_accounts (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: stripe_accounts
-- Contas Stripe conectadas
-- ============================================================

CREATE TABLE stripe_accounts (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: campaign_presets
-- Presets salvos para criação de campanhas
-- ============================================================

CREATE TABLE campaign_presets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: campaign_tags
-- Tags para organizar campanhas
-- ============================================================

CREATE TABLE campaign_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: campaign_markers
-- Marcadores para campanhas (ex: vídeo, checkout, produto)
-- ============================================================

CREATE TABLE campaign_markers (
    id SERIAL PRIMARY KEY,
    campaign_id VARCHAR(100) NOT NULL,
    marker_type markertype NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ix_campaign_markers_campaign_id ON campaign_markers(campaign_id);

-- ============================================================
-- TABELA: campaign_actions
-- Histórico de ações realizadas em campanhas
-- ============================================================

CREATE TABLE campaign_actions (
    id SERIAL PRIMARY KEY,
    campaign_id VARCHAR(100) NOT NULL,
    campaign_name VARCHAR(255),
    action_type actiontype NOT NULL,
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    performed_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ix_campaign_actions_campaign_id ON campaign_actions(campaign_id);

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================

-- Criar funções para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em tabelas que possuem updated_at
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON company_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recoveries_updated_at BEFORE UPDATE ON recoveries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
