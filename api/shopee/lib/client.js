// Shopee API Client - HMAC-SHA256 signing + token management
// Used by all /api/shopee/* endpoints

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://partner.shopeemobile.com/api/v2';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getTimestamp() {
  return Math.floor(Date.now() / 1000);
}

function sign(partnerId, partnerKey, path, timestamp, accessToken, shopId) {
  // Auth endpoints: partner_id + path + timestamp
  // Shop endpoints: partner_id + path + timestamp + access_token + shop_id
  let baseString = `${partnerId}${path}${timestamp}`;
  if (accessToken && shopId) {
    baseString += `${accessToken}${shopId}`;
  }
  return crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');
}

export class ShopeeClient {
  constructor() {
    this.partnerId = parseInt(process.env.SHOPEE_PARTNER_ID);
    this.partnerKey = process.env.SHOPEE_PARTNER_KEY;
    if (!this.partnerId || !this.partnerKey) {
      throw new Error('SHOPEE_PARTNER_ID e SHOPEE_PARTNER_KEY devem estar configurados');
    }
  }

  // Generate OAuth authorization URL
  getAuthUrl(redirectUri) {
    const path = '/api/v2/shop/auth_partner';
    const timestamp = getTimestamp();
    const signature = sign(this.partnerId, this.partnerKey, path, timestamp);
    const params = new URLSearchParams({
      partner_id: this.partnerId,
      timestamp,
      sign: signature,
      redirect: redirectUri,
    });
    return `${BASE_URL}/shop/auth_partner?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  async exchangeCode(code, shopId) {
    const path = '/api/v2/auth/token/get';
    const timestamp = getTimestamp();
    const signature = sign(this.partnerId, this.partnerKey, path, timestamp);

    const url = `${BASE_URL}/auth/token/get?partner_id=${this.partnerId}&timestamp=${timestamp}&sign=${signature}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        shop_id: parseInt(shopId),
        partner_id: this.partnerId,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Shopee token exchange error: ${data.error} - ${data.message || ''}`);
    }
    return data;
  }

  // Refresh access token
  async refreshToken(shopId) {
    const { data: tokenRow, error: fetchErr } = await supabase
      .from('shopee_tokens')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .single();

    if (fetchErr || !tokenRow) {
      throw new Error(`Tokens nao encontrados para shop_id ${shopId}`);
    }

    const path = '/api/v2/auth/access_token/get';
    const timestamp = getTimestamp();
    const signature = sign(this.partnerId, this.partnerKey, path, timestamp);

    const url = `${BASE_URL}/auth/access_token/get?partner_id=${this.partnerId}&timestamp=${timestamp}&sign=${signature}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refresh_token: tokenRow.refresh_token,
        shop_id: parseInt(shopId),
        partner_id: this.partnerId,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`Shopee refresh error: ${data.error} - ${data.message || ''}`);
    }

    // Persist new tokens
    const now = new Date();
    const tokenExpires = new Date(now.getTime() + data.expire_in * 1000);
    // Refresh token validity: ~30 days from Shopee
    const refreshExpires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { error: updateErr } = await supabase
      .from('shopee_tokens')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_expires_at: tokenExpires.toISOString(),
        refresh_expires_at: refreshExpires.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('shop_id', shopId);

    if (updateErr) {
      throw new Error(`Erro ao salvar tokens: ${updateErr.message}`);
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_expires_at: tokenExpires.toISOString(),
    };
  }

  // Get valid access token (auto-refresh if expiring within 5min)
  async getAccessToken(shopId) {
    const { data: tokenRow, error } = await supabase
      .from('shopee_tokens')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .single();

    if (error || !tokenRow) {
      throw new Error(`Loja ${shopId} nao conectada`);
    }

    const expiresAt = new Date(tokenRow.token_expires_at);
    const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000);

    if (expiresAt <= fiveMinFromNow) {
      const refreshed = await this.refreshToken(shopId);
      return refreshed.access_token;
    }

    return tokenRow.access_token;
  }

  // Generic API request with signing
  async request(method, path, shopId, params = {}, body = null) {
    const apiPath = `/api/v2${path}`;
    const accessToken = await this.getAccessToken(shopId);
    const timestamp = getTimestamp();
    const signature = sign(this.partnerId, this.partnerKey, apiPath, timestamp, accessToken, shopId);

    const queryParams = new URLSearchParams({
      partner_id: this.partnerId,
      timestamp,
      sign: signature,
      access_token: accessToken,
      shop_id: shopId,
      ...params,
    });

    const url = `${BASE_URL}${path}?${queryParams.toString()}`;
    const options = {
      method: method.toUpperCase(),
      headers: { 'Content-Type': 'application/json' },
    };
    if (body && method.toUpperCase() !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (data.error) {
      throw new Error(`Shopee API ${path}: ${data.error} - ${data.message || ''}`);
    }
    return data;
  }

  // Convenience: get shop info
  async getShopInfo(shopId) {
    return this.request('GET', '/shop/get_shop_info', shopId);
  }
}
