-- Migration: Remover tabela de OAuth do Meta Ads
-- Data: 2026-09-19
-- Descrição: Remove a tabela meta_connections (OAuth removido do sistema)

-- Drop tabela se existir
DROP TABLE IF EXISTS meta_connections;

-- Comentário: Sistema agora usa apenas tokens de acesso manual via facebook_accounts
