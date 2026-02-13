// BaseLinker Dashboard Summary API
// GET /api/baselinker/dashboard-summary
//
// Uses the pre-computed bl_dashboard_summary view in Supabase
// Returns instant 30-day stats by marketplace x company - ZERO BaseLinker API calls
// Perfect for initial dashboard load before user runs a manual search

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { data: rows, error } = await supabase
      .from('bl_dashboard_summary')
      .select('*');

    if (error) {
      return res.status(500).json({ error: 'Erro ao buscar summary: ' + error.message });
    }

    if (!rows || rows.length === 0) {
      return res.status(200).json({
        success: true,
        empty: true,
        message: 'Cache vazio. Execute /api/baselinker/sync para popular.',
        summary: { totalOrders: 0, totalRevenue: '0.00', totalUnits: 0, avgTicket: '0.00', fullOrders: 0, fullPercentage: '0.0' },
        byMarketplace: {},
        byCompany: {},
        matrix: [],
        lastSync: null
      });
    }

    // Aggregate from the view rows
    const byMarketplace = {};
    const byCompany = {};
    let totalOrders = 0;
    let totalRevenue = 0;
    let totalUnits = 0;
    let fullOrders = 0;
    let lastSync = null;

    const matrix = rows.map(r => {
      const revenue = parseFloat(r.total_revenue) || 0;
      const orders = parseInt(r.total_orders) || 0;
      const units = parseInt(r.total_units) || 0;
      const full = parseInt(r.full_orders) || 0;

      totalOrders += orders;
      totalRevenue += revenue;
      totalUnits += units;
      fullOrders += full;

      if (r.last_sync && (!lastSync || r.last_sync > lastSync)) {
        lastSync = r.last_sync;
      }

      // By marketplace
      if (!byMarketplace[r.marketplace]) {
        byMarketplace[r.marketplace] = { orders: 0, revenue: 0, units: 0 };
      }
      byMarketplace[r.marketplace].orders += orders;
      byMarketplace[r.marketplace].revenue += revenue;
      byMarketplace[r.marketplace].units += units;

      // By company
      if (!byCompany[r.company]) {
        byCompany[r.company] = { orders: 0, revenue: 0, units: 0 };
      }
      byCompany[r.company].orders += orders;
      byCompany[r.company].revenue += revenue;
      byCompany[r.company].units += units;

      return {
        marketplace: r.marketplace,
        company: r.company,
        orders,
        revenue,
        units,
        avgTicket: parseFloat(r.avg_ticket) || 0,
        fullOrders: full
      };
    });

    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const fullPercentage = totalOrders > 0 ? (fullOrders / totalOrders) * 100 : 0;

    // Cache age
    let cacheAgeMinutes = null;
    if (lastSync) {
      cacheAgeMinutes = Math.floor((Date.now() - new Date(lastSync).getTime()) / 1000 / 60);
    }

    return res.status(200).json({
      success: true,
      fromView: true,
      period: 'last_30_days',
      cacheAgeMinutes,
      lastSync,
      summary: {
        totalOrders,
        totalRevenue: totalRevenue.toFixed(2),
        totalUnits,
        avgTicket: avgTicket.toFixed(2),
        fullOrders,
        fullPercentage: fullPercentage.toFixed(1)
      },
      byMarketplace,
      byCompany,
      matrix
    });

  } catch (error) {
    console.error('Dashboard Summary Error:', error);
    return res.status(500).json({ error: 'Erro: ' + error.message });
  }
}
