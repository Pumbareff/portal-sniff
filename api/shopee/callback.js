// Shopee OAuth Callback - Exchange code for tokens
// GET /api/shopee/callback?code=XXX&shop_id=YYY

import { createClient } from '@supabase/supabase-js';
import { ShopeeClient } from './lib/client.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PORTAL_URL = 'https://portal-sniff.vercel.app';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, shop_id } = req.query;

  if (!code || !shop_id) {
    return res.redirect(`${PORTAL_URL}/?shopee=error&reason=missing_params`);
  }

  try {
    const client = new ShopeeClient();

    // 1. Exchange code for tokens
    const tokenData = await client.exchangeCode(code, shop_id);

    const now = new Date();
    const tokenExpires = new Date(now.getTime() + tokenData.expire_in * 1000);
    const refreshExpires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 2. Try to get shop info (best-effort, don't fail if it errors)
    let shopName = null;
    try {
      // Save tokens first so getShopInfo can use them
      await supabase.from('shopee_tokens').upsert({
        shop_id: parseInt(shop_id),
        shop_name: null,
        region: 'BR',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: tokenExpires.toISOString(),
        refresh_expires_at: refreshExpires.toISOString(),
        partner_id: client.partnerId,
        connected_at: now.toISOString(),
        updated_at: now.toISOString(),
        is_active: true,
      }, { onConflict: 'shop_id' });

      const shopInfo = await client.getShopInfo(parseInt(shop_id));
      shopName = shopInfo.response?.shop_name || shopInfo.shop_name || null;
    } catch (e) {
      console.warn('Could not fetch shop info:', e.message);
    }

    // 3. Upsert tokens + shop name into Supabase
    const { error: dbError } = await supabase.from('shopee_tokens').upsert({
      shop_id: parseInt(shop_id),
      shop_name: shopName,
      region: 'BR',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: tokenExpires.toISOString(),
      refresh_expires_at: refreshExpires.toISOString(),
      partner_id: client.partnerId,
      connected_at: now.toISOString(),
      updated_at: now.toISOString(),
      is_active: true,
    }, { onConflict: 'shop_id' });

    if (dbError) {
      console.error('Supabase upsert error:', dbError);
      return res.redirect(`${PORTAL_URL}/?shopee=error&reason=db_error`);
    }

    // 4. Redirect back to portal
    return res.redirect(`${PORTAL_URL}/?shopee=connected&shop_id=${shop_id}`);

  } catch (error) {
    console.error('Shopee Callback Error:', error);
    return res.redirect(`${PORTAL_URL}/?shopee=error&reason=${encodeURIComponent(error.message)}`);
  }
}
