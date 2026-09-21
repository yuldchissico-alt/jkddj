-- Migration: Remover tabela de OAuth do Meta Ads
-- Data: 2026-09-19
-- Descrição: Remove a tabela meta_connections (OAuth removido do sistema)

DROP TABLE IF EXISTS meta_connections;
