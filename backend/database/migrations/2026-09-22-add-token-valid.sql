-- Migration: Add token_valid column to facebook_accounts table
-- Date: 2026-09-22
-- Description: Adds token_valid column to track if Facebook tokens are still valid
-- This column is required by meta_data.py, meta_spend.py, and daily_report_data.py

-- Add token_valid column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'facebook_accounts' 
        AND column_name = 'token_valid'
    ) THEN
        ALTER TABLE facebook_accounts 
        ADD COLUMN token_valid BOOLEAN NOT NULL DEFAULT TRUE;
        
        RAISE NOTICE 'Added token_valid column to facebook_accounts table';
    ELSE
        RAISE NOTICE 'token_valid column already exists in facebook_accounts table';
    END IF;
END $$;
