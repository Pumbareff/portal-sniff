// BaseLinker Products API - Vercel Serverless Function
// GET /api/baselinker/products

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

  const inventoryId = req.query.inventory_id || '39104'; // Default inventory
  const page = parseInt(req.query.page) || 1;

  try {
    // Step 1: Get product list (basic data: sku, prices, stock)
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
      return res.status(400).json({ error: listData.error_message || 'Erro BaseLinker' });
    }

    const productIds = Object.keys(listData.products || {});

    // Step 2: Get product details (images, descriptions) in batches of 100
    let imageMap = {};
    if (productIds.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize);
        const detailResponse = await fetch('https://api.baselinker.com/connector.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            token,
            method: 'getInventoryProductsData',
            parameters: JSON.stringify({
              inventory_id: parseInt(inventoryId),
              products: batch.map(Number)
            })
          })
        });

        const detailData = await detailResponse.json();
        if (detailData.status !== 'ERROR' && detailData.products) {
          for (const [pid, pdata] of Object.entries(detailData.products)) {
            if (pdata.images) {
              const imgs = Object.values(pdata.images);
              if (imgs.length > 0) {
                imageMap[pid] = imgs;
              }
            }
          }
        }
      }
    }

    // Step 3: Merge list data with images
    const products = Object.entries(listData.products || {}).map(([id, p]) => ({
      id,
      sku: p.sku || '',
      ean: p.ean || '',
      name: p.name || p.text_fields?.name || '',
      price1: p.prices?.['38915'] || 0,
      price2: p.prices?.['38915'] || 0,
      price3: 0,
      stock: p.stock ? Object.entries(p.stock).filter(([k]) => k !== 'reservations').reduce((s, [, v]) => s + (Number(v) || 0), 0) : 0,
      category: p.category_id || '',
      weight: p.weight || 0,
      images: imageMap[id] || []
    }));

    return res.status(200).json({
      success: true,
      products,
      total: Object.keys(listData.products || {}).length,
      page,
      inventory_id: inventoryId
    });

  } catch (error) {
    console.error('BaseLinker API Error:', error);
    return res.status(500).json({ error: 'Erro ao conectar com BaseLinker: ' + error.message });
  }
}
