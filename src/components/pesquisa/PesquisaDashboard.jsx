import React from 'react';
import { Search, Users, Lightbulb, Bell, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { PESQUISA_COLORS } from './pesquisaTheme';

const C = PESQUISA_COLORS;

export default function PesquisaDashboard({ data }) {
  const { mock } = data;

  const kpiCards = [
    { label: 'PRODUTOS MONITORADOS', value: mock.kpis.produtosMonitorados, icon: Search, color: C.accent },
    { label: 'CONCORRENTES RASTREADOS', value: mock.kpis.concorrentesRastreados, icon: Users, color: C.blue },
    { label: 'OPORTUNIDADES ATIVAS', value: mock.kpis.oportunidadesAtivas, icon: Lightbulb, color: C.yellow },
    { label: 'ALERTAS HOJE', value: mock.kpis.alertasHoje, icon: Bell, color: C.red },
  ];

  const urgenciaColor = { alta: C.red, media: C.yellow, baixa: C.accent };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Banner */}
      <div className="relative rounded-xl overflow-hidden p-8" style={{ background: 'linear-gradient(135deg, #071523 0%, #0D2137 50%, #071523 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 70% 50%, ${C.accent}, transparent 60%)` }} />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold" style={{ color: C.text }}>Inteligencia de Mercado</h1>
          <p className="mt-2 text-sm" style={{ color: C.textMuted }}>Monitore concorrentes, identifique oportunidades e otimize precos com dados em tempo real.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="rounded-xl p-5 flex items-start justify-between" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
            <div>
              <div className="text-[10px] font-bold tracking-wider uppercase" style={{ color: C.textMuted }}>{kpi.label}</div>
              <div className="text-3xl font-extrabold mt-1" style={{ color: C.text }}>{kpi.value}</div>
            </div>
            <kpi.icon size={28} style={{ color: kpi.color, opacity: 0.7 }} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart - Tendencia */}
        <div className="lg:col-span-2 rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: C.accent }} />
            <span className="text-sm font-bold" style={{ color: C.text }}>Tendencia de Mercado (30 dias)</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mock.tendencia}>
              <defs>
                <linearGradient id="gradVendas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.accent} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradMercado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.blue} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="data" tick={{ fill: C.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
              <Area type="monotone" dataKey="vendas" stroke={C.accent} fill="url(#gradVendas)" strokeWidth={2} name="Suas Vendas" />
              <Area type="monotone" dataKey="mercado" stroke={C.blue} fill="url(#gradMercado)" strokeWidth={2} name="Media Mercado" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Marketplaces */}
        <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
          <span className="text-sm font-bold" style={{ color: C.text }}>Share por Marketplace</span>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={mock.marketplaceShare} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {mock.marketplaceShare.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {mock.marketplaceShare.map((m, i) => (
              <div key={i} className="flex items-center gap-1 text-xs" style={{ color: C.textMuted }}>
                <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                {m.name} ({m.value}%)
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Oportunidades */}
        <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
          <span className="text-sm font-bold" style={{ color: C.text }}>Top Oportunidades</span>
          <div className="mt-4 space-y-3">
            {mock.oportunidadesTop.map((op, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: C.bg }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: `${C.accent}20`, color: C.accent }}>{i + 1}</div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: C.text }}>{op.categoria}</div>
                    <div className="text-xs" style={{ color: C.textMuted }}>{op.potencial}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-bold px-2 py-1 rounded" style={{ background: `${C.accent}20`, color: C.accent }}>{op.score}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feed Alertas */}
        <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
          <span className="text-sm font-bold" style={{ color: C.text }}>Alertas Recentes</span>
          <div className="mt-4 space-y-3">
            {mock.alertas.map(alerta => (
              <div key={alerta.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: C.bg }}>
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: urgenciaColor[alerta.urgencia] }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm" style={{ color: C.text }}>{alerta.msg}</div>
                  <div className="text-xs mt-1" style={{ color: C.textDim }}>{alerta.tempo}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
