-- Migration: Add status and is_active columns to facebook_accounts table
-- Date: 2026-09-22
-- Description: Adds status and is_active columns if they don't exist

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'facebook_accounts' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE facebook_accounts 
        ADD COLUMN status VARCHAR(30) DEFAULT 'discovered';
        
        RAISE NOTICE 'Added status column to facebook_accounts table';
    ELSE
        RAISE NOTICE 'status column already exists in facebook_accounts table';
    END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'facebook_accounts' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE facebook_accounts 
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT FALSE;
        
        RAISE NOTICE 'Added is_active column to facebook_accounts table';
    ELSE
        RAISE NOTICE 'is_active column already exists in facebook_accounts table';
    END IF;
END $$;

-- Add last_sync_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'facebook_accounts' 
        AND column_name = 'last_sync_at'
    ) THEN
        ALTER TABLE facebook_accounts 
        ADD COLUMN last_sync_at TIMESTAMP;
        
        RAISE NOTICE 'Added last_sync_at column to facebook_accounts table';
    ELSE
        RAISE NOTICE 'last_sync_at column already exists in facebook_accounts table';
    END IF;
END $$;
