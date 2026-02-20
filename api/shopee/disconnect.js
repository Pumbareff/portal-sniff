// Shopee Disconnect - Deactivate shop connection
// POST /api/shopee/disconnect body: { shop_id }

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop_id } = req.body || {};

    if (!shop_id) {
      return res.status(400).json({ error: 'shop_id e obrigatorio' });
    }

    const { data, error } = await supabase
      .from('shopee_tokens')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('shop_id', shop_id)
      .select('shop_id, shop_name')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Erro ao desconectar: ' + error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Loja nao encontrada' });
    }

    return res.status(200).json({
      success: true,
      message: `Loja ${data.shop_name || data.shop_id} desconectada`,
      shop_id: data.shop_id,
    });

  } catch (error) {
    console.error('Shopee Disconnect Error:', error);
    return res.status(500).json({ error: 'Erro ao desconectar: ' + error.message });
  }
}
