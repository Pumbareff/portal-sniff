// BaseLinker Products API - Vercel Serverless Function
// GET /api/baselinker/products
// Returns ALL products (handles pagination internally)

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

  const inventoryId = req.query.inventory_id || '39104';

  try {
    let allProducts = [];
    let page = 1;
    let hasMore = true;

    // Fetch all pages from BaseLinker
    while (hasMore) {
      const listResponse = await fetch('https://api.baselinker.com/connector.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token,
          method: 'getInventoryProductsList',
          parameters: JSON.stringify({
            inventory_id: parseInt(inventoryId),
            page
          })
        })
      });

      const listData = await listResponse.json();

      if (listData.status === 'ERROR') {
        return res.status(400).json({ error: listData.error_message || 'Erro BaseLinker', page });
      }

      const pageProducts = Object.entries(listData.products || {}).map(([id, p]) => ({
        id,
        sku: p.sku || '',
        ean: p.ean || '',
        name: p.name || p.text_fields?.name || '',
        price1: p.prices?.['38915'] || 0,
        stock: p.stock ? Object.entries(p.stock).filter(([k]) => k !== 'reservations').reduce((s, [, v]) => s + (Number(v) || 0), 0) : 0,
        category: p.category_id || '',
        weight: p.weight || 0,
      }));

      allProducts = [...allProducts, ...pageProducts];
      hasMore = pageProducts.length >= 100;
      page++;

      // Safety: max 10 pages
      if (page > 10) break;
    }

    return res.status(200).json({
      success: true,
      products: allProducts,
      total: allProducts.length,
      pages_fetched: page - 1,
      inventory_id: inventoryId
    });

  } catch (error) {
    console.error('BaseLinker API Error:', error);
    return res.status(500).json({ error: 'Erro ao conectar com BaseLinker: ' + error.message });
  }
}
