// BaseLinker Top Sellers API - Vercel Serverless Function
// GET /api/baselinker/top-sellers
// Returns top 30 best-selling SKUs for current month and last month

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.BASELINKER_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'BASELINKER_TOKEN nao configurado' });
  }

  try {
    const now = new Date();
    // Current month start (day 1, 00:00)
    const thisMonthStart = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000);
    // Last month start
    const lastMonthStart = Math.floor(new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime() / 1000);

    // Fetch all orders since last month start
    const allOrders = [];
    let dateFrom = lastMonthStart;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch('https://api.baselinker.com/connector.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token,
          method: 'getOrders',
          parameters: JSON.stringify({
            date_from: dateFrom,
            get_unconfirmed_orders: false
          })
        })
      });

      const data = await response.json();
      if (data.status === 'ERROR') {
        // Rate limit - return what we have
        if (data.error_message && data.error_message.includes('limit')) break;
        return res.status(400).json({ error: data.error_message || 'Erro BaseLinker' });
      }

      const orders = data.orders || [];
      allOrders.push(...orders);

      if (orders.length < 100) {
        hasMore = false;
      } else {
        // Paginate: use last order's date
        const lastOrder = orders[orders.length - 1];
        const newDateFrom = lastOrder.date_add;
        if (newDateFrom <= dateFrom) {
          hasMore = false; // safety: no progress
        } else {
          dateFrom = newDateFrom;
        }
      }
    }

    // Count quantities per SKU, split by period
    const thisMonthSales = {};
    const lastMonthSales = {};

    for (const order of allOrders) {
      const orderTs = order.date_add;
      const isThisMonth = orderTs >= thisMonthStart;

      for (const product of (order.products || [])) {
        const sku = (product.sku || '').trim();
        if (!sku) continue;
        const qty = parseInt(product.quantity) || 1;

        // Extract base SKU (remove KIT suffix for aggregation)
        const baseSku = sku.replace(/KIT\d*/i, '').trim() || sku;
        const kitMatch = sku.match(/KIT(\d+)/i);
        const kitMult = kitMatch ? parseInt(kitMatch[1]) || 1 : 1;
        const realQty = qty * kitMult;

        if (isThisMonth) {
          thisMonthSales[sku] = (thisMonthSales[sku] || 0) + qty;
          // Also count base SKU units
          if (baseSku !== sku) {
            thisMonthSales[baseSku] = (thisMonthSales[baseSku] || 0) + realQty;
          }
        } else {
          lastMonthSales[sku] = (lastMonthSales[sku] || 0) + qty;
          if (baseSku !== sku) {
            lastMonthSales[baseSku] = (lastMonthSales[baseSku] || 0) + realQty;
          }
        }
      }
    }

    // Sort and get top 30 for each
    const sortTop = (salesMap, limit = 30) =>
      Object.entries(salesMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([sku, qty]) => ({ sku, qty }));

    const topThisMonth = sortTop(thisMonthSales);
    const topLastMonth = sortTop(lastMonthSales);

    // Create lookup sets for quick check
    const thisMonthSkus = topThisMonth.map(t => t.sku);
    const lastMonthSkus = topLastMonth.map(t => t.sku);

    return res.status(200).json({
      success: true,
      thisMonth: topThisMonth,
      lastMonth: topLastMonth,
      thisMonthSkus,
      lastMonthSkus,
      totalOrders: allOrders.length,
      period: {
        thisMonthStart: new Date(thisMonthStart * 1000).toISOString(),
        lastMonthStart: new Date(lastMonthStart * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('Top Sellers Error:', error);
    return res.status(500).json({ error: 'Erro: ' + error.message });
  }
}
