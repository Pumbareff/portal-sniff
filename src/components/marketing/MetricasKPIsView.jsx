import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, BarChart3,
  ArrowUpRight, ArrowDownRight, Eye, MousePointerClick, Target, Percent
} from 'lucide-react';

const PURPLE = '#6B1B8E';

const CHANNELS = [
  { id: 'ml', name: 'Mercado Livre', color: '#FFE600', bg: '#FFFDE7' },
  { id: 'shopee', name: 'Shopee', color: '#EE4D2D', bg: '#FFF5F2' },
  { id: 'amazon', name: 'Amazon', color: '#FF9900', bg: '#FFF8E7' },
  { id: 'magalu', name: 'Magalu', color: '#0086FF', bg: '#EFF6FF' },
  { id: 'tiktok', name: 'TikTok Shop', color: '#010101', bg: '#F5F5F5' },
  { id: 'site', name: 'Site Proprio', color: '#6B1B8E', bg: '#F5F0FF' },
];

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const DEFAULT_KPI_DATA = {
  faturamento: 187450,
  pedidos: 3842,
  ticket_medio: 48.8,
  conversao: 3.2,
  visitas: 120150,
  faturamento_anterior: 162300,
  pedidos_anterior: 3420,
  ticket_anterior: 47.5,
  conversao_anterior: 2.9,
  visitas_anterior: 115200,
  channels: {
    ml: { faturamento: 82000, pedidos: 1580, conversao: 4.1 },
    shopee: { faturamento: 45200, pedidos: 1120, conversao: 3.5 },
    amazon: { faturamento: 28500, pedidos: 480, conversao: 2.8 },
    magalu: { faturamento: 15800, pedidos: 340, conversao: 2.2 },
    tiktok: { faturamento: 9450, pedidos: 220, conversao: 2.0 },
    site: { faturamento: 6500, pedidos: 102, conversao: 1.8 },
  },
  monthly_revenue: [98000, 112000, 135000, 128000, 142000, 155000, 148000, 162000, 170000, 175000, 180000, 187450],
};

const formatCurrency = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
const formatNumber = (v) => (v || 0).toLocaleString('pt-BR');
const calcVariation = (curr, prev) => prev ? (((curr - prev) / prev) * 100).toFixed(1) : 0;

const MetricasKPIsView = () => {
  const [period, setPeriod] = useState('mes');
  const data = DEFAULT_KPI_DATA;

  const maxRevenue = useMemo(() => Math.max(...data.monthly_revenue), [data]);

  const kpiCards = [
    {
      label: 'Faturamento',
      value: formatCurrency(data.faturamento),
      variation: calcVariation(data.faturamento, data.faturamento_anterior),
      icon: DollarSign,
      color: '#10B981',
    },
    {
      label: 'Pedidos',
      value: formatNumber(data.pedidos),
      variation: calcVariation(data.pedidos, data.pedidos_anterior),
      icon: ShoppingCart,
      color: '#6B1B8E',
    },
    {
      label: 'Ticket Medio',
      value: `R$ ${data.ticket_medio.toFixed(2)}`,
      variation: calcVariation(data.ticket_medio, data.ticket_anterior),
      icon: Target,
      color: '#F59E0B',
    },
    {
      label: 'Conversao',
      value: `${data.conversao}%`,
      variation: calcVariation(data.conversao, data.conversao_anterior),
      icon: Percent,
      color: '#3B82F6',
    },
    {
      label: 'Visitas',
      value: formatNumber(data.visitas),
      variation: calcVariation(data.visitas, data.visitas_anterior),
      icon: Eye,
      color: '#8B5CF6',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Metricas & KPIs</h2>
          <p className="text-sm text-gray-500 mt-1">Performance de vendas por canal e periodo</p>
        </div>
        <div className="flex items-center gap-2">
          {['semana', 'mes', 'trimestre', 'ano'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                period === p ? 'bg-[#6B1B8E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpiCards.map((kpi) => {
          const isPositive = parseFloat(kpi.variation) >= 0;
          return (
            <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: kpi.color + '15' }}>
                  <kpi.icon size={18} style={{ color: kpi.color }} />
                </div>
                <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                  isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(kpi.variation)}%
                </span>
              </div>
              <p className="text-xl font-bold text-gray-800">{kpi.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart + Channel Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700">Faturamento Mensal 2026</h3>
            <span className="text-xs text-gray-400">vs. meta</span>
          </div>
          <div className="flex items-end gap-2 h-48">
            {data.monthly_revenue.map((rev, i) => {
              const pct = (rev / maxRevenue) * 100;
              const isCurrent = i === new Date().getMonth();
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-gray-400 font-medium">
                    {(rev / 1000).toFixed(0)}k
                  </span>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isCurrent ? 'bg-[#6B1B8E]' : 'bg-purple-200 hover:bg-purple-300'
                    }`}
                    style={{ height: `${pct}%`, minHeight: '8px' }}
                    title={`${MONTHS[i]}: ${formatCurrency(rev)}`}
                  />
                  <span className={`text-[10px] ${isCurrent ? 'font-bold text-[#6B1B8E]' : 'text-gray-400'}`}>
                    {MONTHS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Channel Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Por Canal</h3>
          <div className="space-y-3">
            {CHANNELS.map(ch => {
              const chData = data.channels[ch.id];
              if (!chData) return null;
              const pct = ((chData.faturamento / data.faturamento) * 100).toFixed(1);
              return (
                <div key={ch.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ch.color }} />
                      <span className="text-xs font-medium text-gray-700">{ch.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-800">{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: ch.color }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-gray-400">{formatCurrency(chData.faturamento)}</span>
                    <span className="text-[10px] text-gray-400">{chData.pedidos} pedidos</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Channel Performance Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <h3 className="text-sm font-bold text-gray-700">Detalhamento por Canal</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Canal</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Faturamento</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Pedidos</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Ticket Medio</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Conversao</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">% Total</th>
              </tr>
            </thead>
            <tbody>
              {CHANNELS.map(ch => {
                const chData = data.channels[ch.id];
                if (!chData) return null;
                const ticket = chData.pedidos ? (chData.faturamento / chData.pedidos).toFixed(2) : 0;
                const pct = ((chData.faturamento / data.faturamento) * 100).toFixed(1);
                return (
                  <tr key={ch.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ch.color }} />
                        <span className="font-medium text-gray-800">{ch.name}</span>
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 font-semibold text-gray-800">{formatCurrency(chData.faturamento)}</td>
                    <td className="text-right px-4 py-3 text-gray-600">{formatNumber(chData.pedidos)}</td>
                    <td className="text-right px-4 py-3 text-gray-600">R$ {ticket}</td>
                    <td className="text-right px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        chData.conversao >= 3 ? 'bg-green-50 text-green-600' : chData.conversao >= 2 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {chData.conversao}%
                      </span>
                    </td>
                    <td className="text-right px-4 py-3 font-bold text-gray-800">{pct}%</td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-gray-200 bg-gray-50/80 font-bold">
                <td className="px-4 py-3 text-gray-800">Total</td>
                <td className="text-right px-4 py-3 text-[#6B1B8E]">{formatCurrency(data.faturamento)}</td>
                <td className="text-right px-4 py-3 text-gray-800">{formatNumber(data.pedidos)}</td>
                <td className="text-right px-4 py-3 text-gray-800">R$ {data.ticket_medio.toFixed(2)}</td>
                <td className="text-right px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-[#6B1B8E]">{data.conversao}%</span>
                </td>
                <td className="text-right px-4 py-3 text-gray-800">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start gap-3">
        <BarChart3 size={18} className="text-[#6B1B8E] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-[#6B1B8E]">Dados demonstrativos</p>
          <p className="text-xs text-purple-600 mt-0.5">
            Os dados acima sao de exemplo. Em breve, integraremos com BaseLinker e APIs dos marketplaces para dados em tempo real.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MetricasKPIsView;
