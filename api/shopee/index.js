// Shopee API - Consolidated Handler (Vercel Hobby plan: max 12 functions)
// Routes via ?action= query param:
//   GET  /api/shopee?action=auth     -> generate OAuth URL
//   GET  /api/shopee?action=callback  -> OAuth callback (code + shop_id)
//   GET  /api/shopee?action=status    -> connection status
//   POST /api/shopee?action=disconnect -> deactivate shop

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const IS_SANDBOX = process.env.SHOPEE_SANDBOX !== 'false'; // sandbox by default until Go Live
const BASE_URL = IS_SANDBOX
  ? 'https://openplatform.sandbox.test-stable.shopee.sg/api/v2'
  : 'https://partner.shopeemobile.com/api/v2';
const PORTAL_URL = 'https://portal-sniff.vercel.app';
const REDIRECT_URI = `${PORTAL_URL}/api/shopee?action=callback`;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- Signing helpers ---

function getTimestamp() {
  return Math.floor(Date.now() / 1000);
}

function hmacSign(partnerId, partnerKey, path, timestamp, accessToken, shopId) {
  let base = `${partnerId}${path}${timestamp}`;
  if (accessToken && shopId) base += `${accessToken}${shopId}`;
  return crypto.createHmac('sha256', partnerKey).update(base).digest('hex');
}

// --- ShopeeClient (inline) ---

function getClient() {
  const partnerId = parseInt(process.env.SHOPEE_PARTNER_ID);
  const partnerKey = process.env.SHOPEE_PARTNER_KEY;
  if (!partnerId || !partnerKey) {
    throw new Error('SHOPEE_PARTNER_ID e SHOPEE_PARTNER_KEY devem estar configurados');
  }
  return { partnerId, partnerKey };
}

function buildAuthUrl(partnerId, partnerKey, redirectUri) {
  const path = '/api/v2/shop/auth_partner';
  const ts = getTimestamp();
  const sig = hmacSign(partnerId, partnerKey, path, ts);
  const params = new URLSearchParams({ partner_id: partnerId, timestamp: ts, sign: sig, redirect: redirectUri });
  return `${BASE_URL}/shop/auth_partner?${params}`;
}

async function exchangeCode(partnerId, partnerKey, code, shopId) {
  const path = '/api/v2/auth/token/get';
  const ts = getTimestamp();
  const sig = hmacSign(partnerId, partnerKey, path, ts);
  const url = `${BASE_URL}/auth/token/get?partner_id=${partnerId}&timestamp=${ts}&sign=${sig}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, shop_id: parseInt(shopId), partner_id: partnerId }),
  });
  const data = await resp.json();
  if (data.error) throw new Error(`Shopee token error: ${data.error} - ${data.message || ''}`);
  return data;
}

async function getShopInfo(partnerId, partnerKey, shopId, accessToken) {
  const path = '/api/v2/shop/get_shop_info';
  const ts = getTimestamp();
  const sig = hmacSign(partnerId, partnerKey, path, ts, accessToken, shopId);
  const params = new URLSearchParams({ partner_id: partnerId, timestamp: ts, sign: sig, access_token: accessToken, shop_id: shopId });
  const resp = await fetch(`${BASE_URL}/shop/get_shop_info?${params}`);
  return resp.json();
}

// --- Action handlers ---

async function handleAuth(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { partnerId, partnerKey } = getClient();
  const url = buildAuthUrl(partnerId, partnerKey, REDIRECT_URI);
  return res.status(200).json({ url });
}

async function handleCallback(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { code, shop_id } = req.query;
  if (!code || !shop_id) {
    return res.redirect(`${PORTAL_URL}/?shopee=error&reason=missing_params`);
  }

  const { partnerId, partnerKey } = getClient();
  const tokenData = await exchangeCode(partnerId, partnerKey, code, shop_id);

  const now = new Date();
  const tokenExpires = new Date(now.getTime() + tokenData.expire_in * 1000);
  const refreshExpires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const tokenRow = {
    shop_id: parseInt(shop_id),
    region: 'BR',
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    token_expires_at: tokenExpires.toISOString(),
    refresh_expires_at: refreshExpires.toISOString(),
    partner_id: partnerId,
    connected_at: now.toISOString(),
    updated_at: now.toISOString(),
    is_active: true,
  };

  // Save tokens
  await supabase.from('shopee_tokens').upsert(tokenRow, { onConflict: 'shop_id' });

  // Best-effort shop name fetch
  let shopName = null;
  try {
    const info = await getShopInfo(partnerId, partnerKey, parseInt(shop_id), tokenData.access_token);
    shopName = info.response?.shop_name || info.shop_name || null;
  } catch (e) {
    console.warn('Could not fetch shop info:', e.message);
  }

  if (shopName) {
    await supabase.from('shopee_tokens').update({ shop_name: shopName }).eq('shop_id', shop_id);
  }

  return res.redirect(`${PORTAL_URL}/?shopee=connected&shop_id=${shop_id}`);
}

async function handleStatus(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { shop_id } = req.query;

  if (shop_id) {
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

    return res.status(200).json({
      connected: data.is_active,
      shop_id: data.shop_id,
      shop_name: data.shop_name,
      region: data.region,
      token_expires: data.token_expires_at,
      refresh_expires: data.refresh_expires_at,
      connected_at: data.connected_at,
      is_healthy: data.is_active && refreshExpires > now,
      token_status: tokenExpires > now ? 'valid' : 'expired',
      refresh_status: refreshExpires > now ? 'valid' : 'expired',
    });
  }

  // All active shops
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

  return res.status(200).json({ connected: result.length > 0, shops: result, total: result.length });
}

async function handleDisconnect(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { shop_id } = req.body || {};
  if (!shop_id) {
    return res.status(400).json({ error: 'shop_id e obrigatorio' });
  }

  const { data, error } = await supabase
    .from('shopee_tokens')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('shop_id', shop_id)
    .select('shop_id, shop_name')
    .single();

  if (error) return res.status(500).json({ error: 'Erro ao desconectar: ' + error.message });
  if (!data) return res.status(404).json({ error: 'Loja nao encontrada' });

  return res.status(200).json({ success: true, message: `Loja ${data.shop_name || data.shop_id} desconectada`, shop_id: data.shop_id });
}

// --- Main router ---

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action || 'status';

  try {
    switch (action) {
      case 'auth': return await handleAuth(req, res);
      case 'callback': return await handleCallback(req, res);
      case 'status': return await handleStatus(req, res);
      case 'disconnect': return await handleDisconnect(req, res);
      default: return res.status(400).json({ error: `Acao desconhecida: ${action}`, valid: ['auth', 'callback', 'status', 'disconnect'] });
    }
  } catch (error) {
    console.error(`Shopee API [${action}] Error:`, error);
    if (action === 'callback') {
      return res.redirect(`${PORTAL_URL}/?shopee=error&reason=${encodeURIComponent(error.message)}`);
    }
    return res.status(500).json({ error: error.message });
  }
}
