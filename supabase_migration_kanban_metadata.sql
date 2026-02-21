-- Migration: Add metadata JSONB column to gestao_produtos_parados
-- Required for Kanban enhanced features (marketplace checklist, timestamps, financials, etc.)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/shaohvrqjimlodzroazt/sql/new

ALTER TABLE gestao_produtos_parados
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Optional: Create index for faster metadata queries
CREATE INDEX IF NOT EXISTS idx_gestao_parados_metadata
ON gestao_produtos_parados USING gin (metadata);

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'gestao_produtos_parados' AND column_name = 'metadata';
