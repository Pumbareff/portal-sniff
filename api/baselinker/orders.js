// BaseLinker Orders API - Vercel Serverless Function
// GET /api/baselinker/orders
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

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.BASELINKER_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'BASELINKER_TOKEN nao configurado' });
  }

  const dateFrom = req.query.date_from || Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
  const getUnconfirmedOrders = req.query.unconfirmed === 'true';
  const statusId = req.query.status_id || null;

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

    const params = {
      date_from: parseInt(dateFrom),
      get_unconfirmed_orders: getUnconfirmedOrders
    };
    if (statusId) params.status_id = parseInt(statusId);

    const response = await fetch('https://api.baselinker.com/connector.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token,
        method: 'getOrders',
        parameters: JSON.stringify(params)
      })
    });

    const data = await response.json();

    if (data.status === 'ERROR') {
      if (data.error_message && data.error_message.includes('limit')) {
        return res.status(429).json({ error: 'Rate limit BaseLinker. Aguarde e tente novamente.', details: data.error_message });
      }
      return res.status(400).json({ error: data.error_message || 'Erro BaseLinker' });
    }

    // Transform orders with marketplace/company detection + Valor Original
    const orders = (data.orders || []).map(o => {
      const marketplace = detectMarketplace(o.order_source);
      const company = SOURCE_ID_TO_COMPANY[String(o.order_source_id || '0')] || 'outros';
      const needsOriginal = ['shopee', 'temu', 'tiktok', 'shein'].includes(marketplace);

      const products = (o.products || []).map(p => {
        const qty = parseInt(p.quantity) || 1;
        const priceBrutto = parseFloat(p.price_brutto) || 0;
        const catalogPrice = (needsOriginal && catalogPrices.has(p.sku)) ? catalogPrices.get(p.sku) : 0;
        const unitPrice = Math.max(catalogPrice, priceBrutto);
        return {
          id: p.product_id,
          name: p.name,
          sku: p.sku,
          quantity: qty,
          price: priceBrutto,
          realPrice: unitPrice,
          totalValue: unitPrice * qty,
          warehouse: p.warehouse_id
        };
      });

      const displayedTotal = parseFloat(o.payment_done) || 0;
      const realTotal = products.reduce((sum, p) => sum + p.totalValue, 0) || displayedTotal;

      return {
        id: o.order_id,
        source: o.order_source,
        sourceId: o.order_source_id,
        marketplace,
        company,
        status: o.order_status_id,
        date: new Date(o.date_add * 1000).toISOString(),
        dateConfirmed: o.date_confirmed ? new Date(o.date_confirmed * 1000).toISOString() : null,
        customer: {
          name: o.delivery_fullname,
          email: o.email,
          phone: o.phone,
          city: o.delivery_city,
          state: o.delivery_state
        },
        payment: {
          method: o.payment_method,
          paid: parseFloat(o.payment_done) > 0,
          displayedTotal,
          realTotal
        },
        products,
        totals: {
          products: products.reduce((sum, p) => sum + p.totalValue, 0),
          shipping: parseFloat(o.delivery_price) || 0,
          total: realTotal
        },
        delivery: {
          method: o.delivery_method,
          trackingNumber: o.delivery_tracking_number,
          packageNumber: o.delivery_package_number,
          isFull: (o.delivery_method || '').toLowerCase().includes('full')
        }
      };
    });

    // Summary stats
    const stats = {
      total: orders.length,
      totalValue: orders.reduce((sum, o) => sum + o.totals.total, 0),
      avgTicket: orders.length > 0 ? orders.reduce((sum, o) => sum + o.totals.total, 0) / orders.length : 0,
      byMarketplace: orders.reduce((acc, o) => {
        if (!acc[o.marketplace]) acc[o.marketplace] = { orders: 0, revenue: 0 };
        acc[o.marketplace].orders++;
        acc[o.marketplace].revenue += o.totals.total;
        return acc;
      }, {}),
      byCompany: orders.reduce((acc, o) => {
        if (!acc[o.company]) acc[o.company] = { orders: 0, revenue: 0 };
        acc[o.company].orders++;
        acc[o.company].revenue += o.totals.total;
        return acc;
      }, {}),
      catalogPricesLoaded: catalogPrices.size
    };

    return res.status(200).json({
      success: true,
      orders,
      stats
    });

  } catch (error) {
    console.error('BaseLinker Orders Error:', error);
    return res.status(500).json({ error: 'Erro ao conectar com BaseLinker: ' + error.message });
  }
}
