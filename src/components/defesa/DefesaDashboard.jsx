import React, { useMemo } from 'react';
import { Shield, AlertTriangle, ClipboardList, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { DEFESA_COLORS, STATUS_COLORS } from './defesaTheme';

const C = DEFESA_COLORS;

export default function DefesaDashboard({ data }) {
  const { kpis, invasoes, acoes, activityLog, produtos } = data;

  // Line chart: invasions over 14 days
  const lineData = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      const count = invasoes.filter(inv => inv.created_at?.slice(0, 10) === key).length;
      days.push({ label, count });
    }
    return days;
  }, [invasoes]);

  // Pie chart: action statuses
  const pieData = useMemo(() => {
    const counts = { pendente: 0, em_andamento: 0, aguardando: 0, concluida: 0 };
    acoes.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });
    return Object.entries(counts).map(([k, v]) => ({ name: STATUS_COLORS[k].label, value: v, fill: STATUS_COLORS[k].dot }));
  }, [acoes]);

  // Bar chart: top 5 most invaded products
  const topProdutos = useMemo(() => {
    const map = {};
    invasoes.forEach(inv => {
      const name = inv.produto_nome || 'Desconhecido';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name: name.length > 25 ? name.slice(0, 25) + '...' : name, count }));
  }, [invasoes]);

  const kpiCards = [
    { label: 'PRODUTOS MONITORADOS', value: kpis.totalProdutos, icon: Shield, iconColor: '#22C55E' },
    { label: 'COM INVASORES ATIVOS', value: kpis.comInvasores, icon: Shield, iconColor: '#EAB308' },
    { label: 'NOVAS INVASOES (24H)', value: kpis.novasInvasoes24h, icon: AlertTriangle, iconColor: '#EF4444' },
    { label: 'ACOES PENDENTES', value: kpis.acoesPendentes, icon: ClipboardList, iconColor: C.textMuted },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Banner */}
      <div className="relative rounded-xl overflow-hidden p-8" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 70% 50%, ${C.gold}, transparent 60%)` }} />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold" style={{ color: C.text }}>Centro de Comando</h1>
          <p className="mt-2 text-sm" style={{ color: C.textMuted }}>Monitorize seus produtos, identifique invasores e defenda seu catalogo no Mercado Livre.</p>
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
            <kpi.icon size={28} style={{ color: kpi.iconColor, opacity: 0.7 }} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Line Chart */}
        <div className="lg:col-span-2 rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: C.gold }} />
            <span className="text-sm font-bold" style={{ color: C.text }}>Evolucao de Invasoes</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData}>
              <XAxis dataKey="label" tick={{ fill: C.textDim, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke={C.gold} strokeWidth={2} dot={{ fill: C.gold, r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: C.gold }} />
            <span className="text-sm font-bold" style={{ color: C.text }}>Status das Acoes</span>
          </div>
          {pieData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[180px] text-sm" style={{ color: C.textDim }}>Sem acoes registradas</div>
          )}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px]" style={{ color: C.textMuted }}>
                <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} /> {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top 5 Products */}
        <div className="lg:col-span-2 rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} style={{ color: C.gold }} />
            <span className="text-sm font-bold" style={{ color: C.text }}>Top 5 Produtos Mais Invadidos</span>
          </div>
          {topProdutos.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topProdutos} layout="vertical">
                <XAxis type="number" tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={140} />
                <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }} />
                <Bar dataKey="count" fill={C.gold} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[180px] text-sm" style={{ color: C.textDim }}>Sem invasoes registradas</div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} style={{ color: C.gold }} />
            <span className="text-sm font-bold" style={{ color: C.text }}>Atividade Recente</span>
          </div>
          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
            {activityLog.slice(0, 10).map((log, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle size={14} className="shrink-0 mt-0.5" style={{ color: '#22C55E' }} />
                <div>
                  <div className="text-xs" style={{ color: C.text }}>{log.action}</div>
                  <div className="text-[10px]" style={{ color: C.textDim }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                  </div>
                </div>
              </div>
            ))}
            {activityLog.length === 0 && (
              <div className="text-xs text-center py-4" style={{ color: C.textDim }}>Nenhuma atividade recente</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
