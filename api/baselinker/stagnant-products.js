// BaseLinker Stagnant Products API - Vercel Serverless Function
// GET /api/baselinker/stagnant-products?days=90&max_stock=9999
// Cross-references products x orders to find low-giro items

function extractBaseSku(sku) {
  const match = (sku || '').match(/^(.+?)KIT\d+$/i);
  return match ? match[1] : (sku || '');
}

function isKit(sku) {
  return /KIT\d+$/i.test(sku || '');
}

function getKitMult(sku) {
  const match = (sku || '').match(/KIT(\d+)$/i);
  return match ? parseInt(match[1]) : 1;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.BASELINKER_TOKEN;
  if (!token) return res.status(500).json({ error: 'BASELINKER_TOKEN nao configurado' });

  const days = parseInt(req.query.days) || 90;
  const maxStock = parseInt(req.query.max_stock) || 9999;
  const inventoryId = req.query.inventory_id || '39104';

  const blFetch = async (method, parameters) => {
    const resp = await fetch('https://api.baselinker.com/connector.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token, method, parameters: JSON.stringify(parameters) })
    });
    return resp.json();
  };

  try {
    // === STEP 1: Fetch all products ===
    let allProducts = [];
    let page = 1;
    while (page <= 10) {
      const data = await blFetch('getInventoryProductsList', { inventory_id: parseInt(inventoryId), page });
      if (data.status === 'ERROR') break;
      const items = Object.entries(data.products || {}).map(([id, p]) => ({
        id, sku: (p.sku || '').trim(), name: p.name || '',
        stock: p.stock ? Object.entries(p.stock).filter(([k]) => k !== 'reservations').reduce((s, [, v]) => s + (Number(v) || 0), 0) : 0,
        price: p.prices?.['38915'] || 0,
      }));
      allProducts.push(...items);
      if (items.length < 100) break;
      page++;
    }

    // === STEP 2: Fetch orders, build sold-SKU map ===
    const dateFrom = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    const soldMap = {}; // baseSku -> { units, skus: [] }
    let cursor = dateFrom;
    let orderPages = 0;
    let totalOrders = 0;
    const seenOrderIds = new Set();

    while (orderPages < 25) {
      const data = await blFetch('getOrders', { date_from: cursor });
      if (data.status === 'ERROR') break;
      const orders = data.orders || [];
      if (orders.length === 0) break;

      for (const o of orders) {
        if (seenOrderIds.has(o.order_id)) continue;
        seenOrderIds.add(o.order_id);
        totalOrders++;
        for (const p of (o.products || [])) {
          const sku = (p.sku || '').trim();
          if (!sku) continue;
          const baseSku = extractBaseSku(sku);
          const qty = (parseInt(p.quantity) || 1) * getKitMult(sku);
          if (!soldMap[baseSku]) soldMap[baseSku] = { units: 0, skus: [] };
          soldMap[baseSku].units += qty;
          if (!soldMap[baseSku].skus.includes(sku)) soldMap[baseSku].skus.push(sku);
        }
      }

      const lastDate = orders[orders.length - 1].date_add;
      if (lastDate <= cursor) break;
      cursor = lastDate;
      orderPages++;
      if (orders.length < 100) break;
    }

    // === STEP 3: Cross-reference -> stagnant candidates ===
    const candidates = [];
    const seenBase = new Set();

    for (const product of allProducts) {
      if (!product.sku || product.stock < 1 || product.stock > maxStock) continue;
      if (isKit(product.sku)) continue; // skip KIT variants, show parent only

      const baseSku = extractBaseSku(product.sku);
      if (seenBase.has(baseSku)) continue; // dedup same base
      seenBase.add(baseSku);

      const sold = soldMap[baseSku];
      const unitsSold = sold ? sold.units : 0;
      const giroMensal = Math.round(unitsSold / (days / 30) * 10) / 10;
      const relatedSkus = sold ? sold.skus.filter(s => s !== product.sku) : [];
      const projecao = giroMensal > 0 ? Math.round(product.stock / giroMensal * 10) / 10 : 999;

      candidates.push({
        sku: product.sku,
        name: product.name,
        stock: product.stock,
        price: product.price,
        unitsSold,
        giroMensal,
        relatedSkus,
        projecaoMeses: projecao,
      });
    }

    // Sort: zero sales first, then by stock descending
    candidates.sort((a, b) => {
      if (a.unitsSold === 0 && b.unitsSold > 0) return -1;
      if (a.unitsSold > 0 && b.unitsSold === 0) return 1;
      return b.stock - a.stock;
    });

    return res.status(200).json({
      success: true,
      candidates,
      meta: {
        totalProducts: allProducts.length,
        totalCandidates: candidates.length,
        totalOrders,
        orderPages,
        productPages: page,
        daysAnalyzed: days,
      }
    });

  } catch (error) {
    console.error('Stagnant products error:', error);
    return res.status(500).json({ error: 'Erro: ' + error.message });
  }
}
