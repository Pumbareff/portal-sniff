// Shopee Connection Status
// GET /api/shopee/status -> all connected shops
// GET /api/shopee/status?shop_id=X -> single shop status

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop_id } = req.query;

    if (shop_id) {
      // Single shop status
      const { data, error } = await supabase
        .from('shopee_tokens')
        .select('shop_id, shop_name, region, token_expires_at, refresh_expires_at, connected_at, updated_at, is_active')
        .eq('shop_id', shop_id)
        .single();

      if (error || !data) {
        return res.status(200).json({ connected: false, shop_id: parseInt(shop_id) });
      }

      const now = new Date();
      const tokenExpires = new Date(data.token_expires_at);
      const refreshExpires = new Date(data.refresh_expires_at);
      const isHealthy = data.is_active && refreshExpires > now;

      return res.status(200).json({
        connected: data.is_active,
        shop_id: data.shop_id,
        shop_name: data.shop_name,
        region: data.region,
        token_expires: data.token_expires_at,
        refresh_expires: data.refresh_expires_at,
        connected_at: data.connected_at,
        is_healthy: isHealthy,
        token_status: tokenExpires > now ? 'valid' : 'expired',
        refresh_status: refreshExpires > now ? 'valid' : 'expired',
      });
    }

    // All connected shops
    const { data: shops, error } = await supabase
      .from('shopee_tokens')
      .select('shop_id, shop_name, region, token_expires_at, refresh_expires_at, connected_at, updated_at, is_active')
      .eq('is_active', true)
      .order('connected_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Erro ao buscar lojas: ' + error.message });
    }

    const now = new Date();
    const result = (shops || []).map(s => ({
      shop_id: s.shop_id,
      shop_name: s.shop_name,
      region: s.region,
      connected_at: s.connected_at,
      is_healthy: new Date(s.refresh_expires_at) > now,
      token_status: new Date(s.token_expires_at) > now ? 'valid' : 'expired',
    }));

    return res.status(200).json({
      connected: result.length > 0,
      shops: result,
      total: result.length,
    });

  } catch (error) {
    console.error('Shopee Status Error:', error);
    return res.status(500).json({ error: 'Erro ao verificar status: ' + error.message });
  }
}
