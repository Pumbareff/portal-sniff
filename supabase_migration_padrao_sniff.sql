-- Migration: Add BaseLinker columns to am_produtos for Padrao Sniff
-- Date: 2026-02-18

ALTER TABLE am_produtos
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS ean TEXT,
  ADD COLUMN IF NOT EXISTS preco NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estoque INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS imagem_url TEXT,
  ADD COLUMN IF NOT EXISTS baselinker_id TEXT,
  ADD COLUMN IF NOT EXISTS peso NUMERIC(8,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_kit BOOLEAN DEFAULT FALSE;

-- Unique index on SKU to allow upsert by SKU
CREATE UNIQUE INDEX IF NOT EXISTS am_produtos_sku_unique ON am_produtos(sku) WHERE sku IS NOT NULL;
