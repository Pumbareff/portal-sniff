-- Migration: Portal Fornecedor
-- Date: 2026-02-19
-- Adds supplier portal support

-- 1. Add fornecedor columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fornecedor_nome TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telefone_whatsapp TEXT;

-- 2. Add PDF URL column to pedidos_fornecedor
ALTER TABLE pedidos_fornecedor ADD COLUMN IF NOT EXISTS pedido_next_pdf_url TEXT;

-- 3. Create storage bucket for supplier PDFs (run manually in Supabase Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('pedidos-fornecedor', 'pedidos-fornecedor', true);

-- 4. Index for supplier queries
CREATE INDEX IF NOT EXISTS idx_profiles_fornecedor_nome ON profiles(fornecedor_nome) WHERE fornecedor_nome IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pedidos_fornecedor_status ON pedidos_fornecedor(status);
