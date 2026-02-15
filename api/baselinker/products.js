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
    // Get products from inventory
    const response = await fetch('https://api.baselinker.com/connector.php', {
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

    const data = await response.json();

    if (data.status === 'ERROR') {
      return res.status(400).json({ error: data.error_message || 'Erro BaseLinker' });
    }

    // Transform products for frontend
    const products = Object.entries(data.products || {}).map(([id, p]) => ({
      id,
      sku: p.sku || '',
      ean: p.ean || '',
      name: p.name || p.text_fields?.name || '',
      price1: p.prices?.['38915'] || 0, // Preco Padrao (unico price group)
      price2: p.prices?.['38915'] || 0, // Mesmo (inventario so tem 1 price group)
      price3: 0, // Nao existe no inventario
      stock: p.stock ? Object.values(p.stock).reduce((s, v) => s + (Number(v) || 0), 0) : 0,
      category: p.category_id || '',
      weight: p.weight || 0,
      images: p.images ? Object.values(p.images) : []
    }));

    return res.status(200).json({
      success: true,
      products,
      total: Object.keys(data.products || {}).length,
      page,
      inventory_id: inventoryId
    });

  } catch (error) {
    console.error('BaseLinker API Error:', error);
    return res.status(500).json({ error: 'Erro ao conectar com BaseLinker: ' + error.message });
  }
}
