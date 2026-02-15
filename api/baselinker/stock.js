// BaseLinker Stock API - Vercel Serverless Function
// GET /api/baselinker/stock

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
    // Get products with stock info
    const response = await fetch('https://api.baselinker.com/connector.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token,
        method: 'getInventoryProductsStock',
        parameters: JSON.stringify({
          inventory_id: parseInt(inventoryId)
        })
      })
    });

    const data = await response.json();

    if (data.status === 'ERROR') {
      return res.status(400).json({ error: data.error_message || 'Erro BaseLinker' });
    }

    // Transform stock data
    const stockItems = Object.entries(data.products || {}).map(([id, stockData]) => ({
      productId: id,
      stock: stockData ? Object.entries(stockData).filter(([k]) => k !== 'reservations').reduce((s, [, v]) => s + (Number(v) || 0), 0) : 0,
      reservations: stockData.reservations || 0
    }));

    // Summary
    const totalUnits = stockItems.reduce((sum, item) => sum + item.stock, 0);
    const totalSkus = stockItems.length;
    const outOfStock = stockItems.filter(item => item.stock <= 0).length;
    const lowStock = stockItems.filter(item => item.stock > 0 && item.stock <= 10).length;

    return res.status(200).json({
      success: true,
      stock: stockItems,
      summary: {
        totalUnits,
        totalSkus,
        outOfStock,
        lowStock,
        healthyStock: totalSkus - outOfStock - lowStock
      },
      inventory_id: inventoryId
    });

  } catch (error) {
    console.error('BaseLinker API Error:', error);
    return res.status(500).json({ error: 'Erro ao conectar com BaseLinker: ' + error.message });
  }
}
