-- Guard Catalogo - Supabase Migration
-- Run this in Supabase SQL Editor

-- 1. Products table
CREATE TABLE IF NOT EXISTS defesa_produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  preco NUMERIC(10,2),
  sku TEXT,
  ean TEXT,
  imagem_url TEXT,
  ml_link TEXT,
  status TEXT DEFAULT 'ativo',
  invasores_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Actions table (Kanban)
CREATE TABLE IF NOT EXISTS defesa_acoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  produto_id UUID REFERENCES defesa_produtos(id) ON DELETE SET NULL,
  produto_nome TEXT,
  tipo TEXT,
  status TEXT DEFAULT 'pendente',
  responsavel TEXT,
  prazo DATE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Notifications table
CREATE TABLE IF NOT EXISTS defesa_notificacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT,
  lida BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Share links table
CREATE TABLE IF NOT EXISTS defesa_share_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'ativo',
  expires_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Activity log table
CREATE TABLE IF NOT EXISTS defesa_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Expand am_defesa_catalogo with new columns
ALTER TABLE am_defesa_catalogo ADD COLUMN IF NOT EXISTS preco_invasor NUMERIC(10,2);
ALTER TABLE am_defesa_catalogo ADD COLUMN IF NOT EXISTS link_invasor TEXT;
ALTER TABLE am_defesa_catalogo ADD COLUMN IF NOT EXISTS reincidente BOOLEAN DEFAULT FALSE;

-- 7. RLS Policies
ALTER TABLE defesa_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE defesa_acoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE defesa_notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE defesa_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE defesa_activity_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "defesa_produtos_all" ON defesa_produtos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "defesa_acoes_all" ON defesa_acoes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "defesa_notificacoes_all" ON defesa_notificacoes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "defesa_share_links_all" ON defesa_share_links FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "defesa_activity_log_all" ON defesa_activity_log FOR ALL USING (auth.role() = 'authenticated');
