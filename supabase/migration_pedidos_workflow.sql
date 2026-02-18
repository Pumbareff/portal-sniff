-- Migration: Pedidos Fornecedor - Workflow Status Flow
-- Run this on Supabase SQL Editor
-- Portal Sniff - 2026-02-18

-- New timestamp columns for each status transition
ALTER TABLE pedidos_fornecedor
ADD COLUMN IF NOT EXISTS enviado_next_at timestamptz,
ADD COLUMN IF NOT EXISTS aprovado_at timestamptz,
ADD COLUMN IF NOT EXISTS ok_faturar_at timestamptz,
ADD COLUMN IF NOT EXISTS faturado_at timestamptz,
ADD COLUMN IF NOT EXISTS cancelado_at timestamptz;

-- Next response fields
ALTER TABLE pedidos_fornecedor
ADD COLUMN IF NOT EXISTS pedido_next_ref text,
ADD COLUMN IF NOT EXISTS preco_next_sugerido numeric,
ADD COLUMN IF NOT EXISTS motivo_recusa text,
ADD COLUMN IF NOT EXISTS motivo_cancelamento text;

-- Migrate existing statuses to new flow
UPDATE pedidos_fornecedor SET status = 'pendente' WHERE status = 'pendente';
UPDATE pedidos_fornecedor SET status = 'aprovado' WHERE status = 'respondida';
UPDATE pedidos_fornecedor SET status = 'faturado' WHERE status = 'aprovada';
UPDATE pedidos_fornecedor SET status = 'cancelado' WHERE status = 'rejeitada';
