-- Shopee API Integration - Token Storage
-- Run this in Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS shopee_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id BIGINT UNIQUE NOT NULL,
  shop_name TEXT,
  region TEXT DEFAULT 'BR',
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  refresh_expires_at TIMESTAMPTZ NOT NULL,
  partner_id BIGINT NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Index for active shop lookups
CREATE INDEX IF NOT EXISTS idx_shopee_tokens_active
  ON shopee_tokens (shop_id, is_active)
  WHERE is_active = TRUE;

-- RLS: Only service role can access (serverless functions use service key)
ALTER TABLE shopee_tokens ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (API routes use SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY "Service role full access" ON shopee_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);
