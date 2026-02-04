// Create pedidos_fornecedor table
// GET /api/debug/create-pedidos-table
// POST /api/debug/create-pedidos-table (auto-create via REST)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS pedidos_fornecedor (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_oc TEXT NOT NULL,
  fornecedor TEXT NOT NULL,
  items JSONB DEFAULT '[]',
  produto TEXT,
  quantidade INTEGER DEFAULT 0,
  preco_unitario DECIMAL(12,2) DEFAULT 0,
  peso_unitario DECIMAL(8,2) DEFAULT 0,
  valor_total DECIMAL(12,2) DEFAULT 0,
  peso_total DECIMAL(8,2) DEFAULT 0,
  prazo_entrega TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'pendente',
  preco_resposta DECIMAL(12,2),
  prazo_resposta TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

const RLS_SQL = `
DO $$ BEGIN
  ALTER TABLE pedidos_fornecedor ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public access pedidos" ON pedidos_fornecedor FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos_fornecedor(status);
  CREATE INDEX IF NOT EXISTS idx_pedidos_created ON pedidos_fornecedor(created_at DESC);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Test if table exists
    const { data, error } = await supabase.from('pedidos_fornecedor').select('id').limit(1);

    if (error && (error.message.includes('does not exist') || error.code === '42P01')) {
      if (req.method === 'POST') {
        // Try to create via Supabase REST SQL endpoint
        const sqlUrl = `${process.env.SUPABASE_URL}/rest/v1/rpc/`;

        // Use the pg_net or direct SQL approach via supabase
        // Since supabase JS can't do raw SQL, try fetch to the SQL endpoint
        const pgUrl = process.env.SUPABASE_URL.replace('.supabase.co', '.supabase.co') + '/pg';

        // Fallback: try creating via multiple insert approach (won't work for DDL)
        // Best approach: return SQL for manual execution
        return res.status(200).json({
          exists: false,
          autoCreate: false,
          message: 'Tabela NAO existe. Execute o SQL abaixo no Supabase SQL Editor (https://supabase.com/dashboard/project/shaohvrqjimlodzroazt/sql/new)',
          sql: CREATE_SQL + '\n' + RLS_SQL
        });
      }

      return res.status(200).json({
        exists: false,
        message: 'Tabela pedidos_fornecedor NAO existe! Execute o SQL no Supabase SQL Editor.',
        sqlEditorUrl: 'https://supabase.com/dashboard/project/shaohvrqjimlodzroazt/sql/new',
        sql: CREATE_SQL + '\n' + RLS_SQL
      });
    }

    return res.status(200).json({
      exists: true,
      message: 'Tabela pedidos_fornecedor existe!',
      rowCount: data?.length || 0
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
