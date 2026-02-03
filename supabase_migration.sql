-- Portal Sniff - Dashboard + Agua Marinha Enhancement Tables
-- Run this in Supabase SQL Editor

-- 1. Comunicados (Announcements)
CREATE TABLE IF NOT EXISTS comunicados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'info' CHECK (priority IN ('urgente', 'importante', 'info')),
  author TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

ALTER TABLE comunicados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read comunicados" ON comunicados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert comunicados" ON comunicados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete own comunicados" ON comunicados FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. Datas Importantes (Important Dates)
CREATE TABLE IF NOT EXISTS datas_importantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date DATE NOT NULL,
  category TEXT NOT NULL DEFAULT 'evento' CHECK (category IN ('feriado', 'meta', 'evento', 'deadline')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

ALTER TABLE datas_importantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read datas" ON datas_importantes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert datas" ON datas_importantes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can delete own datas" ON datas_importantes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed important dates for 2026
INSERT INTO datas_importantes (title, description, date, category) VALUES
  ('Dia das Maes', 'Segunda data mais importante do varejo', '2026-05-10', 'meta'),
  ('Dia dos Namorados', 'Alta demanda em presentes', '2026-06-12', 'meta'),
  ('Dia dos Pais', 'Foco em kits masculinos', '2026-08-09', 'meta'),
  ('Black Friday', 'Maior evento de vendas do ano', '2026-11-27', 'meta'),
  ('Natal', 'Encerramento do ano fiscal', '2026-12-25', 'feriado')
ON CONFLICT DO NOTHING;

-- 3. AM Produtos (Top 20 Curva A with Padrao Sniff checklist)
CREATE TABLE IF NOT EXISTS am_produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  mlc TEXT DEFAULT '',
  titulo_seo BOOLEAN DEFAULT FALSE,
  campo_modelo BOOLEAN DEFAULT FALSE,
  marca BOOLEAN DEFAULT FALSE,
  capa BOOLEAN DEFAULT FALSE,
  clip BOOLEAN DEFAULT FALSE,
  afiliados BOOLEAN DEFAULT FALSE,
  pi BOOLEAN DEFAULT FALSE,
  ads BOOLEAN DEFAULT FALSE,
  full_check BOOLEAN DEFAULT FALSE,
  pi_atual NUMERIC DEFAULT 0,
  pi_alvo NUMERIC DEFAULT 0,
  estrategia TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE am_produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read am_produtos" ON am_produtos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert am_produtos" ON am_produtos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update am_produtos" ON am_produtos FOR UPDATE TO authenticated USING (true);

-- Seed Top 20 products
INSERT INTO am_produtos (nome, mlc, pi_atual, pi_alvo, estrategia) VALUES
  ('Kit Banho Premium 400ml', 'MLC-001', 3, 1, 'Agressivo'),
  ('Shampoo Neutro 500ml', 'MLC-002', 5, 2, 'Briga'),
  ('Condicionador Hidratacao 300ml', 'MLC-003', 2, 1, 'Agressivo'),
  ('Sabonete Liquido Lavanda 250ml', 'MLC-004', 8, 3, 'Estavel'),
  ('Creme Corporal Karite 400ml', 'MLC-005', 1, 1, 'Manter'),
  ('Kit Presente Feminino', 'MLC-006', 4, 2, 'Briga'),
  ('Difusor Ambiente Bamboo 200ml', 'MLC-007', 6, 3, 'Estavel'),
  ('Vela Aromatica Vanilla 180g', 'MLC-008', 3, 1, 'Agressivo'),
  ('Sabonete Barra Kit 5un', 'MLC-009', 7, 4, 'Estavel'),
  ('Hidratante Maos Peonia 75ml', 'MLC-010', 2, 1, 'Agressivo'),
  ('Oleo Corporal Amendoas 150ml', 'MLC-011', 10, 5, 'Estavel'),
  ('Esfoliante Corporal Acucar 300g', 'MLC-012', 4, 2, 'Briga'),
  ('Kit Viagem 5 Pecas', 'MLC-013', 5, 3, 'Briga'),
  ('Agua de Colonia Fresh 200ml', 'MLC-014', 3, 1, 'Agressivo'),
  ('Mascara Capilar Nutricao 300g', 'MLC-015', 6, 2, 'Briga'),
  ('Sabonete Glicerina Camomila 90g', 'MLC-016', 9, 5, 'Estavel'),
  ('Kit Masculino Sport 3pc', 'MLC-017', 2, 1, 'Agressivo'),
  ('Creme Pentear Cachos 300ml', 'MLC-018', 4, 2, 'Briga'),
  ('Aromatizador Spray Linho 250ml', 'MLC-019', 7, 3, 'Estavel'),
  ('Kit Spa Day Completo', 'MLC-020', 1, 1, 'Manter');

-- 4. AM Defesa Catalogo (Catalog Defense Log)
CREATE TABLE IF NOT EXISTS am_defesa_catalogo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID REFERENCES am_produtos(id),
  produto_nome TEXT NOT NULL DEFAULT '',
  codigo_mlc TEXT DEFAULT '',
  tipo TEXT NOT NULL CHECK (tipo IN ('vendedor_novo', 'titulo_alterado', 'marca_alterada', 'info_alterada')),
  nome_invasor TEXT DEFAULT '',
  descricao TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'denunciado', 'resolvido')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

ALTER TABLE am_defesa_catalogo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read am_defesa" ON am_defesa_catalogo FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert am_defesa" ON am_defesa_catalogo FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update am_defesa" ON am_defesa_catalogo FOR UPDATE TO authenticated USING (true);

-- 5. AM Clips (Clip Tracker)
CREATE TABLE IF NOT EXISTS am_clips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID REFERENCES am_produtos(id),
  produto_nome TEXT NOT NULL DEFAULT '',
  sku TEXT DEFAULT '',
  responsavel TEXT NOT NULL CHECK (responsavel IN ('Mari', 'Jonathan', 'Freelancer')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'produzindo', 'aprovacao', 'aprovado', 'publicado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

ALTER TABLE am_clips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read am_clips" ON am_clips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert am_clips" ON am_clips FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update am_clips" ON am_clips FOR UPDATE TO authenticated USING (true);

-- 6. Vendedor Produtos (BaseLinker Catalog with 3 Price Levels)
CREATE TABLE IF NOT EXISTS vendedor_produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT UNIQUE,
  nome TEXT NOT NULL,
  ean TEXT DEFAULT '',
  estoque INTEGER DEFAULT 0,
  preco_1 NUMERIC(10,2) DEFAULT 0,
  preco_2 NUMERIC(10,2) DEFAULT 0,
  preco_3 NUMERIC(10,2) DEFAULT 0,
  categoria TEXT DEFAULT '',
  marca TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vendedor_produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read vendedor_produtos" ON vendedor_produtos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert vendedor_produtos" ON vendedor_produtos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update vendedor_produtos" ON vendedor_produtos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete vendedor_produtos" ON vendedor_produtos FOR DELETE TO authenticated USING (true);

-- Index for faster searches
CREATE INDEX IF NOT EXISTS idx_vendedor_produtos_sku ON vendedor_produtos(sku);
CREATE INDEX IF NOT EXISTS idx_vendedor_produtos_nome ON vendedor_produtos(nome);
CREATE INDEX IF NOT EXISTS idx_vendedor_produtos_ean ON vendedor_produtos(ean);
