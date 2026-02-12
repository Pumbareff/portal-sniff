// BaseLinker Stats API - Vercel Serverless Function
// GET /api/baselinker/stats - Dashboard statistics
//
// CORRIGIDO: payment_method_cod -> payment_done + Valor Original

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SOURCE_ID_TO_COMPANY = {
  '0': 'outros',
  '3248': 'casa_ipiranga',
  '3249': 'inovate',
  '23317': 'sniffhome',
  '23319': 'casa_ipiranga',
  '23322': 'sniffhome',
  '23323': 'casa_ipiranga',
  '23326': 'casa_ipiranga',
  '23327': 'romobr',
  '23328': 'romobr',
  '23331': 'sniffhome',
  '23352': 'romobr',
  '25937': 'inovate',
  '30312': 'casa_ipiranga',
  '32235': 'agua_marinha',
};

function detectMarketplace(orderSource) {
  const source = (orderSource || '').toLowerCase();
  if (source.includes('shopee')) return 'shopee';
  if (source.includes('mercado') || source.includes('meli') || source.includes('ml')) return 'mercadolivre';
  if (source.includes('amazon')) return 'amazon';
  if (source.includes('tiktok')) return 'tiktok';
  if (source.includes('temu')) return 'temu';
  if (source.includes('shein')) return 'shein';
  if (source.includes('magalu') || source.includes('magazine')) return 'magalu';
  return 'outros';
}

function calcRealTotal(order, marketplace, catalogPrices) {
  let realTotal = parseFloat(order.payment_done) || 0;
  const needsOriginal = ['shopee', 'temu', 'tiktok', 'shein'].includes(marketplace);

  if (needsOriginal && order.products && catalogPrices.size > 0) {
    let corrected = 0;
    for (const p of order.products) {
      const qty = parseInt(p.quantity) || 1;
      const priceBrutto = parseFloat(p.price_brutto) || 0;
      const catalogPrice = catalogPrices.get(p.sku || '') || 0;
      corrected += Math.max(catalogPrice, priceBrutto) * qty;
    }
    if (corrected > 0) realTotal = corrected;
  }

  return realTotal;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.BASELINKER_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'BASELINKER_TOKEN nao configurado' });
  }

  const period = req.query.period || 'today';

  let dateFrom;
  const now = Math.floor(Date.now() / 1000);
  switch (period) {
    case 'today':
      dateFrom = now - (24 * 60 * 60);
      break;
    case 'week':
      dateFrom = now - (7 * 24 * 60 * 60);
      break;
    case 'month':
      dateFrom = now - (30 * 24 * 60 * 60);
      break;
    default:
      dateFrom = now - (24 * 60 * 60);
  }

  try {
    // Carregar precos do catalogo para Valor Original
    const { data: catalogProducts } = await supabase
      .from('vendedor_produtos')
      .select('sku, preco_1');

    const catalogPrices = new Map();
    (catalogProducts || []).forEach(p => {
      if (p.sku && p.preco_1 > 0) {
        catalogPrices.set(p.sku, Number(p.preco_1));
      }
    });

    const response = await fetch('https://api.baselinker.com/connector.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token,
        method: 'getOrders',
        parameters: JSON.stringify({ date_from: dateFrom, get_unconfirmed_orders: false })
      })
    });

    const data = await response.json();

    if (data.status === 'ERROR') {
      if (data.error_message && data.error_message.includes('limit')) {
        return res.status(429).json({ error: 'Rate limit BaseLinker. Aguarde e tente novamente.', details: data.error_message });
      }
      return res.status(400).json({ error: data.error_message });
    }

    const orders = data.orders || [];

    // Processar pedidos com marketplace/company e Valor Original
    const processed = orders.map(o => {
      const marketplace = detectMarketplace(o.order_source);
      const company = SOURCE_ID_TO_COMPANY[String(o.order_source_id || '0')] || 'outros';
      const realTotal = calcRealTotal(o, marketplace, catalogPrices);
      return { ...o, marketplace, company, realTotal };
    });

    const totalOrders = processed.length;
    const totalRevenue = processed.reduce((sum, o) => sum + o.realTotal, 0);
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // By marketplace
    const byMarketplace = {};
    processed.forEach(o => {
      if (!byMarketplace[o.marketplace]) {
        byMarketplace[o.marketplace] = { orders: 0, revenue: 0 };
      }
      byMarketplace[o.marketplace].orders++;
      byMarketplace[o.marketplace].revenue += o.realTotal;
    });

    // By company
    const byCompany = {};
    processed.forEach(o => {
      if (!byCompany[o.company]) {
        byCompany[o.company] = { orders: 0, revenue: 0 };
      }
      byCompany[o.company].orders++;
      byCompany[o.company].revenue += o.realTotal;
    });

    // By status
    const byStatus = processed.reduce((acc, o) => {
      const status = o.order_status_id || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // By hour (today only)
    const byHour = {};
    if (period === 'today') {
      processed.forEach(o => {
        const hour = new Date(o.date_add * 1000).getHours();
        byHour[hour] = (byHour[hour] || 0) + 1;
      });
    }

    // Top products with Valor Original correction
    const productSales = {};
    processed.forEach(o => {
      const needsOriginal = ['shopee', 'temu', 'tiktok', 'shein'].includes(o.marketplace);
      (o.products || []).forEach(p => {
        const key = p.sku || p.product_id;
        if (!productSales[key]) {
          productSales[key] = { sku: p.sku, name: p.name, quantity: 0, revenue: 0 };
        }
        const qty = parseInt(p.quantity) || 1;
        const priceBrutto = parseFloat(p.price_brutto) || 0;
        const catalogPrice = (needsOriginal && catalogPrices.has(p.sku)) ? catalogPrices.get(p.sku) : 0;
        const unitPrice = Math.max(catalogPrice, priceBrutto);
        productSales[key].quantity += qty;
        productSales[key].revenue += unitPrice * qty;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      period,
      catalogPricesLoaded: catalogPrices.size,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue.toFixed(2),
        avgTicket: avgTicket.toFixed(2),
        byMarketplace,
        byCompany,
        byStatus,
        byHour,
        topProducts
      }
    });

  } catch (error) {
    console.error('BaseLinker Stats Error:', error);
    return res.status(500).json({ error: 'Erro ao conectar com BaseLinker: ' + error.message });
  }
}
