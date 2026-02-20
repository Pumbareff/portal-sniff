// Shopee OAuth - Generate Authorization URL
// GET /api/shopee/auth -> { url: "https://partner.shopeemobile.com/..." }

import { ShopeeClient } from './lib/client.js';

const REDIRECT_URI = 'https://portal-sniff.vercel.app/api/shopee/callback';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = new ShopeeClient();
    const url = client.getAuthUrl(REDIRECT_URI);
    return res.status(200).json({ url });
  } catch (error) {
    console.error('Shopee Auth Error:', error);
    return res.status(500).json({ error: 'Erro ao gerar URL de autorizacao: ' + error.message });
  }
}
