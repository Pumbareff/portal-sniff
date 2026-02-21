// Shopee API - Consolidated Handler (Vercel Hobby plan: max 12 functions)
// Routes via ?action= query param:
//   GET  /api/shopee?action=auth        -> generate OAuth URL
//   GET  /api/shopee?action=callback     -> OAuth callback (code + shop_id)
//   GET  /api/shopee?action=status       -> connection status
//   POST /api/shopee?action=disconnect   -> deactivate shop
//   POST /api/shopee?action=sync_orders  -> sync orders for a shop (90 days)
//   POST /api/shopee?action=sync_escrow  -> sync escrow for completed orders
//   POST /api/shopee?action=sync         -> full sync (orders + escrow) for all shops
//   GET  /api/shopee?action=dashboard    -> dashboard data from Supabase
//   GET  /api/shopee?action=orders       -> paginated orders from Supabase

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 60 };

const IS_SANDBOX = process.env.SHOPEE_SANDBOX !== 'false';
const BASE_URL = IS_SANDBOX
  ? 'https://openplatform.sandbox.test-stable.shopee.sg/api/v2'
  : 'https://partner.shopeemobile.com/api/v2';
const PORTAL_URL = 'https://portal-sniff.vercel.app';
const REDIRECT_URI = `${PORTAL_URL}/api/shopee?action=callback`;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Signing helpers ───

function getTimestamp() {
  return Math.floor(Date.now() / 1000);
}

function hmacSign(partnerId, partnerKey, path, timestamp, accessToken, shopId) {
  let base = `${partnerId}${path}${timestamp}`;
  if (accessToken && shopId) base += `${accessToken}${shopId}`;
  return crypto.createHmac('sha256', partnerKey).update(base).digest('hex');
}

function getClient() {
  const partnerId = parseInt(process.env.SHOPEE_PARTNER_ID);
  const partnerKey = process.env.SHOPEE_PARTNER_KEY;
  if (!partnerId || !partnerKey) {
    throw new Error('SHOPEE_PARTNER_ID e SHOPEE_PARTNER_KEY devem estar configurados');
  }
  return { partnerId, partnerKey };
}

// ─── Token management ───

async function getValidToken(shopId) {
  const { data: tokenRow, error } = await supabase
    .from('shopee_tokens')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .single();

  if (error || !tokenRow) throw new Error(`No active token for shop ${shopId}`);

  const now = new Date();
  const tokenExpires = new Date(tokenRow.token_expires_at);

  // If token still valid (with 5 min buffer), return it
  if (tokenExpires > new Date(now.getTime() + 5 * 60 * 1000)) {
    return tokenRow.access_token;
  }

  // Token expired or expiring soon - refresh it
  const refreshExpires = new Date(tokenRow.refresh_expires_at);
  if (refreshExpires <= now) {
    throw new Error(`Refresh token expired for shop ${shopId}. Re-authorize required.`);
  }

  const { partnerId, partnerKey } = getClient();
  const path = '/api/v2/auth/access_token/get';
  const ts = getTimestamp();
  const sig = hmacSign(partnerId, partnerKey, path, ts);
  const url = `${BASE_URL}/auth/access_token/get?partner_id=${partnerId}&timestamp=${ts}&sign=${sig}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shop_id: parseInt(shopId),
      refresh_token: tokenRow.refresh_token,
      partner_id: partnerId,
    }),
  });
  const data = await resp.json();

  if (data.error && data.error !== '') {
    throw new Error(`Token refresh failed for shop ${shopId}: ${data.error} - ${data.message || ''}`);
  }

  const newTokenExpires = new Date(now.getTime() + data.expire_in * 1000);
  const newRefreshExpires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await supabase.from('shopee_tokens').update({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_expires_at: newTokenExpires.toISOString(),
    refresh_expires_at: newRefreshExpires.toISOString(),
    updated_at: now.toISOString(),
  }).eq('shop_id', shopId);

  return data.access_token;
}

// ─── Generic Shopee API call ───

async function shopeeApiCall(apiPath, params, shopId) {
  const { partnerId, partnerKey } = getClient();
  const accessToken = await getValidToken(shopId);
  const ts = getTimestamp();
  const fullPath = `/api/v2${apiPath}`;
  const sig = hmacSign(partnerId, partnerKey, fullPath, ts, accessToken, shopId);

  const queryParams = new URLSearchParams({
    partner_id: partnerId,
    timestamp: ts,
    sign: sig,
    access_token: accessToken,
    shop_id: shopId,
    ...params,
  });

  const url = `${BASE_URL}${apiPath}?${queryParams}`;
  const resp = await fetch(url);
  const data = await resp.json();

  if (data.error && data.error !== '' && data.error !== 0) {
    throw new Error(`Shopee API ${apiPath} error: ${data.error} - ${data.message || JSON.stringify(data)}`);
  }

  return data;
}

// ─── Auth handlers (existing) ───

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

  await supabase.from('shopee_tokens').upsert(tokenRow, { onConflict: 'shop_id' });

  // Best-effort shop name fetch
  let shopName = null;
  try {
    const info = await shopeeApiCall('/shop/get_shop_info', {}, parseInt(shop_id));
    shopName = info.response?.shop_name || null;
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
    return res.status(200).json({
      connected: data.is_active,
      shop_id: data.shop_id,
      shop_name: data.shop_name,
      region: data.region,
      token_expires: data.token_expires_at,
      refresh_expires: data.refresh_expires_at,
      connected_at: data.connected_at,
      is_healthy: data.is_active && new Date(data.refresh_expires_at) > now,
      token_status: new Date(data.token_expires_at) > now ? 'valid' : 'expired',
      refresh_status: new Date(data.refresh_expires_at) > now ? 'valid' : 'expired',
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

// ─── Sync: Orders ───

async function syncOrdersForShop(shopId, daysBack = 90) {
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - daysBack * 24 * 60 * 60;

  // Shopee limits time_range to 15 days per call
  const CHUNK_DAYS = 15;
  const chunkSeconds = CHUNK_DAYS * 24 * 60 * 60;
  let allOrderSns = [];

  // Phase 1: Collect all order_sn via get_order_list (15-day windows)
  let windowStart = startTime;
  while (windowStart < now) {
    let windowEnd = Math.min(windowStart + chunkSeconds, now);
    let cursor = '';
    let hasMore = true;

    while (hasMore) {
      const params = {
        time_range_field: 'create_time',
        time_from: windowStart,
        time_to: windowEnd,
        page_size: 100,
      };
      if (cursor) params.cursor = cursor;

      const data = await shopeeApiCall('/order/get_order_list', params, shopId);
      const resp = data.response || {};
      const orderList = resp.order_list || [];
      allOrderSns.push(...orderList.map(o => o.order_sn));

      hasMore = resp.more || false;
      cursor = resp.next_cursor || '';
    }

    windowStart = windowEnd;
  }

  if (allOrderSns.length === 0) {
    return { orders_fetched: 0, orders_upserted: 0 };
  }

  // Deduplicate
  allOrderSns = [...new Set(allOrderSns)];

  // Phase 2: Get order details in batches of 50
  let totalUpserted = 0;
  for (let i = 0; i < allOrderSns.length; i += 50) {
    const batch = allOrderSns.slice(i, i + 50);
    const data = await shopeeApiCall('/order/get_order_detail', {
      order_sn_list: batch.join(','),
      response_optional_fields: 'buyer_user_id,buyer_username,estimated_shipping_fee,actual_shipping_fee,total_amount,pay_time,buyer_cancel_reason,item_list,ship_by_date,payment_method,shipping_carrier,tracking_number,package_list,order_chargeable_weight_gram',
    }, shopId);

    const orders = data.response?.order_list || [];
    const rows = orders.map(o => ({
      order_sn: o.order_sn,
      shop_id: shopId,
      order_status: o.order_status,
      buyer_user_id: o.buyer_user_id || null,
      buyer_username: o.buyer_username || null,
      total_amount: parseFloat(o.total_amount) || 0,
      actual_shipping_fee: parseFloat(o.actual_shipping_fee) || 0,
      buyer_paid: parseFloat(o.buyer_total_amount || o.total_amount) || 0,
      seller_discount: parseFloat(o.seller_discount || 0),
      shopee_discount: parseFloat(o.shopee_discount || 0),
      voucher_from_seller: parseFloat(o.voucher_from_seller || 0),
      voucher_from_shopee: parseFloat(o.voucher_from_shopee || 0),
      coins: parseFloat(o.coins || 0),
      shipping_carrier: o.shipping_carrier || null,
      tracking_number: o.tracking_number || (o.package_list?.[0]?.logistics_channel_name) || null,
      estimated_shipping_fee: parseFloat(o.estimated_shipping_fee) || 0,
      payment_method: o.payment_method || null,
      create_time: o.create_time,
      update_time: o.update_time,
      pay_time: o.pay_time || null,
      ship_by_date: o.ship_by_date || null,
      days_to_ship: o.days_to_ship || null,
      items: JSON.stringify((o.item_list || []).map(it => ({
        item_id: it.item_id,
        item_name: it.item_name,
        item_sku: it.item_sku,
        model_id: it.model_id,
        model_name: it.model_name,
        model_sku: it.model_sku,
        quantity: it.model_quantity_purchased || it.quantity_purchased,
        price: parseFloat(it.model_discounted_price || it.model_original_price || 0),
        image_url: it.image_info?.image_url || null,
      }))),
      raw_detail: JSON.stringify(o),
      synced_at: new Date().toISOString(),
    }));

    if (rows.length > 0) {
      const { error } = await supabase.from('shopee_orders').upsert(rows, { onConflict: 'order_sn,shop_id' });
      if (error) console.error(`Upsert error batch ${i}:`, error.message);
      else totalUpserted += rows.length;
    }
  }

  return { orders_fetched: allOrderSns.length, orders_upserted: totalUpserted };
}

async function handleSyncOrders(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { shop_id, days = 90 } = req.body || req.query;
  if (!shop_id) return res.status(400).json({ error: 'shop_id required' });

  const startedAt = Date.now();

  // Create sync log entry
  const { data: logEntry } = await supabase.from('shopee_sync_log')
    .insert({ shop_id: parseInt(shop_id), sync_type: 'orders', status: 'running' })
    .select('id').single();

  try {
    const result = await syncOrdersForShop(parseInt(shop_id), parseInt(days));

    await supabase.from('shopee_sync_log').update({
      status: 'completed',
      orders_fetched: result.orders_fetched,
      orders_upserted: result.orders_upserted,
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
    }).eq('id', logEntry.id);

    return res.status(200).json({ success: true, shop_id: parseInt(shop_id), ...result, duration_ms: Date.now() - startedAt });
  } catch (error) {
    await supabase.from('shopee_sync_log').update({
      status: 'error',
      error_message: error.message,
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
    }).eq('id', logEntry.id);

    return res.status(500).json({ error: error.message, shop_id: parseInt(shop_id) });
  }
}

// ─── Sync: Escrow ───

async function syncEscrowForShop(shopId) {
  // Get all COMPLETED orders that don't have escrow yet
  const { data: orders, error } = await supabase
    .from('shopee_orders')
    .select('order_sn')
    .eq('shop_id', shopId)
    .eq('order_status', 'COMPLETED')
    .not('order_sn', 'in', `(SELECT order_sn FROM shopee_escrow WHERE shop_id = ${shopId})`);

  // Fallback: if subquery doesn't work, get all COMPLETED and filter
  let orderSns;
  if (error || !orders) {
    const { data: allCompleted } = await supabase
      .from('shopee_orders')
      .select('order_sn')
      .eq('shop_id', shopId)
      .eq('order_status', 'COMPLETED');

    const { data: existingEscrow } = await supabase
      .from('shopee_escrow')
      .select('order_sn')
      .eq('shop_id', shopId);

    const existingSet = new Set((existingEscrow || []).map(e => e.order_sn));
    orderSns = (allCompleted || []).filter(o => !existingSet.has(o.order_sn)).map(o => o.order_sn);
  } else {
    orderSns = orders.map(o => o.order_sn);
  }

  if (orderSns.length === 0) {
    return { escrow_fetched: 0 };
  }

  let fetched = 0;
  for (const orderSn of orderSns) {
    try {
      const data = await shopeeApiCall('/payment/get_escrow_detail', { order_sn: orderSn }, shopId);
      const resp = data.response || {};

      const row = {
        order_sn: orderSn,
        shop_id: shopId,
        order_income: parseFloat(resp.order_income || 0),
        buyer_total_amount: parseFloat(resp.buyer_total_amount || 0),
        original_price: parseFloat(resp.original_price || 0),
        seller_discount: parseFloat(resp.seller_discount || 0),
        shopee_discount: parseFloat(resp.shopee_discount || 0),
        voucher_from_seller: parseFloat(resp.voucher_from_seller || 0),
        voucher_from_shopee: parseFloat(resp.voucher_from_shopee || 0),
        coins: parseFloat(resp.coins || 0),
        buyer_paid_shipping_fee: parseFloat(resp.buyer_paid_shipping_fee || 0),
        commission_fee: parseFloat(resp.commission_fee || 0),
        service_fee: parseFloat(resp.service_fee || 0),
        transaction_fee: parseFloat(resp.final_product_protection || resp.transaction_fee || 0),
        escrow_amount: parseFloat(resp.escrow_amount || resp.order_income || 0),
        escrow_tax: parseFloat(resp.escrow_tax || 0),
        raw_escrow: JSON.stringify(resp),
        synced_at: new Date().toISOString(),
      };

      await supabase.from('shopee_escrow').upsert(row, { onConflict: 'order_sn,shop_id' });
      fetched++;
    } catch (e) {
      console.warn(`Escrow fetch failed for ${orderSn}:`, e.message);
    }
  }

  return { escrow_fetched: fetched, escrow_total: orderSns.length };
}

async function handleSyncEscrow(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { shop_id } = req.body || req.query;
  if (!shop_id) return res.status(400).json({ error: 'shop_id required' });

  const startedAt = Date.now();

  const { data: logEntry } = await supabase.from('shopee_sync_log')
    .insert({ shop_id: parseInt(shop_id), sync_type: 'escrow', status: 'running' })
    .select('id').single();

  try {
    const result = await syncEscrowForShop(parseInt(shop_id));

    await supabase.from('shopee_sync_log').update({
      status: 'completed',
      escrow_fetched: result.escrow_fetched,
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
    }).eq('id', logEntry.id);

    return res.status(200).json({ success: true, shop_id: parseInt(shop_id), ...result, duration_ms: Date.now() - startedAt });
  } catch (error) {
    await supabase.from('shopee_sync_log').update({
      status: 'error',
      error_message: error.message,
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
    }).eq('id', logEntry.id);

    return res.status(500).json({ error: error.message, shop_id: parseInt(shop_id) });
  }
}

// ─── Sync: Full orchestrator ───

async function handleSync(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { shop_id, days = 90 } = req.body || {};

  // If shop_id provided, sync just that shop
  const shopIds = [];
  if (shop_id) {
    shopIds.push(parseInt(shop_id));
  } else {
    // All active shops
    const { data: shops } = await supabase
      .from('shopee_tokens')
      .select('shop_id')
      .eq('is_active', true);
    shopIds.push(...(shops || []).map(s => s.shop_id));
  }

  if (shopIds.length === 0) {
    return res.status(400).json({ error: 'No active shops to sync' });
  }

  const results = [];
  for (const sid of shopIds) {
    const startedAt = Date.now();
    const { data: logEntry } = await supabase.from('shopee_sync_log')
      .insert({ shop_id: sid, sync_type: 'full', status: 'running' })
      .select('id').single();

    try {
      const orderResult = await syncOrdersForShop(sid, parseInt(days));
      const escrowResult = await syncEscrowForShop(sid);

      await supabase.from('shopee_sync_log').update({
        status: 'completed',
        orders_fetched: orderResult.orders_fetched,
        orders_upserted: orderResult.orders_upserted,
        escrow_fetched: escrowResult.escrow_fetched,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt,
      }).eq('id', logEntry.id);

      results.push({ shop_id: sid, success: true, ...orderResult, ...escrowResult, duration_ms: Date.now() - startedAt });
    } catch (error) {
      await supabase.from('shopee_sync_log').update({
        status: 'error',
        error_message: error.message,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt,
      }).eq('id', logEntry.id);

      results.push({ shop_id: sid, success: false, error: error.message });
    }
  }

  return res.status(200).json({ success: true, results });
}

// ─── Dashboard data ───

async function handleDashboard(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { shop_id } = req.query;

  // Summary per shop
  const { data: summary, error: sumError } = await supabase
    .from('shopee_dashboard_summary')
    .select('*');

  if (sumError) {
    return res.status(500).json({ error: 'Dashboard query failed: ' + sumError.message });
  }

  // Daily orders (last 30 days)
  const { data: daily, error: dailyError } = await supabase
    .from('shopee_daily_orders')
    .select('*')
    .order('order_date', { ascending: false })
    .limit(90);

  // Sync log (last 10)
  const { data: syncLog } = await supabase
    .from('shopee_sync_log')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(10);

  // Filter by shop_id if provided
  const filtered = shop_id
    ? (summary || []).filter(s => String(s.shop_id) === String(shop_id))
    : summary;

  const dailyFiltered = shop_id
    ? (daily || []).filter(d => String(d.shop_id) === String(shop_id))
    : daily;

  return res.status(200).json({
    summary: filtered || [],
    daily: dailyFiltered || [],
    sync_log: syncLog || [],
  });
}

// ─── Orders list ───

async function handleOrders(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { shop_id, status, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = supabase
    .from('shopee_orders')
    .select('order_sn, shop_id, order_status, buyer_username, total_amount, actual_shipping_fee, shipping_carrier, tracking_number, payment_method, create_time, items, synced_at', { count: 'exact' })
    .order('create_time', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (shop_id) query = query.eq('shop_id', shop_id);
  if (status) query = query.eq('order_status', status);

  const { data, error, count } = await query;

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({
    orders: data || [],
    total: count || 0,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil((count || 0) / parseInt(limit)),
  });
}

// ─── Main router ───

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
      case 'sync_orders': return await handleSyncOrders(req, res);
      case 'sync_escrow': return await handleSyncEscrow(req, res);
      case 'sync': return await handleSync(req, res);
      case 'dashboard': return await handleDashboard(req, res);
      case 'orders': return await handleOrders(req, res);
      default: return res.status(400).json({
        error: `Acao desconhecida: ${action}`,
        valid: ['auth', 'callback', 'status', 'disconnect', 'sync_orders', 'sync_escrow', 'sync', 'dashboard', 'orders'],
      });
    }
  } catch (error) {
    console.error(`Shopee API [${action}] Error:`, error);
    if (action === 'callback') {
      return res.redirect(`${PORTAL_URL}/?shopee=error&reason=${encodeURIComponent(error.message)}`);
    }
    return res.status(500).json({ error: error.message });
  }
}
