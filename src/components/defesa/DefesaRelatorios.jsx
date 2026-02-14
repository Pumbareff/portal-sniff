import React, { useState, useMemo } from 'react';
import { BarChart3, Download, AlertTriangle, CheckCircle, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Papa from 'papaparse';
import { DEFESA_COLORS, STATUS_COLORS } from './defesaTheme';

const C = DEFESA_COLORS;

export default function DefesaRelatorios({ data }) {
  const { invasoes, acoes, produtos, kpis } = data;
  const [tab, setTab] = useState('invasoes');
  const [periodo, setPeriodo] = useState('mensal');

  // Top 5 most invaded products
  const topInvadidos = useMemo(() => {
    const map = {};
    invasoes.forEach(inv => {
      const name = inv.produto_nome || 'Desconhecido';
      if (!map[name]) map[name] = { name, count: 0, img: null };
      map[name].count++;
    });
    // Try to match product images
    Object.values(map).forEach(item => {
      const prod = produtos.find(p => p.nome === item.name);
      if (prod) item.img = prod.imagem_url;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [invasoes, produtos]);

  // Frequent invaders for bar chart
  const invasoresFrequentes = useMemo(() => {
    const map = {};
    invasoes.forEach(inv => {
      const name = inv.nome_invasor || 'Desconhecido';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
  }, [invasoes]);

  // Status distribution for donut
  const statusDist = useMemo(() => {
    const map = { pendente: 0, denunciado: 0, resolvido: 0 };
    invasoes.forEach(inv => { if (map[inv.status] !== undefined) map[inv.status]++; });
    return [
      { name: 'Pendente', value: map.pendente, fill: '#EAB308' },
      { name: 'Denunciado', value: map.denunciado, fill: '#3B82F6' },
      { name: 'Resolvido', value: map.resolvido, fill: '#22C55E' },
    ];
  }, [invasoes]);

  // Action status for pie
  const acaoStatusDist = useMemo(() => {
    return Object.entries(STATUS_COLORS).map(([key, sc]) => ({
      name: sc.label,
      value: acoes.filter(a => a.status === key).length,
      fill: sc.dot,
    }));
  }, [acoes]);

  const exportCSV = () => {
    const rows = invasoes.map(i => ({
      Data: i.created_at ? new Date(i.created_at).toLocaleDateString('pt-BR') : '',
      Produto: i.produto_nome,
      Tipo: i.tipo,
      Invasor: i.nome_invasor,
      Status: i.status,
      Preco_Invasor: i.preco_invasor || '',
      Reincidente: i.reincidente ? 'Sim' : 'Nao',
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `defesa_relatorio_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => window.print();

  const metricCards = [
    { label: 'INVASORES ATIVOS', value: kpis.invasoresAtivos, icon: AlertTriangle, color: '#EF4444' },
    { label: 'RESOLVIDOS', value: kpis.invasoresResolvidos, icon: CheckCircle, color: '#22C55E' },
    { label: 'NOVOS', value: kpis.invasoresNovos, icon: TrendingUp, color: '#3B82F6' },
    { label: 'RECORRENTES', value: kpis.invasoresRecorrentes, icon: Users, color: '#A855F7' },
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={20} style={{ color: C.gold }} />
            <h2 className="text-xl font-extrabold" style={{ color: C.text }}>Relatorios e Analises</h2>
          </div>
          <p className="text-xs mt-1" style={{ color: C.textMuted }}>Metricas de desempenho e analise de invasoes</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={periodo} onChange={e => setPeriodo(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={{ background: C.bgCard, border: `1px solid ${C.border}`, color: C.text, outline: 'none' }}>
            <option value="mensal">Mensal</option>
            <option value="semanal">Semanal</option>
          </select>
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold" style={{ background: C.bgCard, border: `1px solid ${C.border}`, color: C.textMuted }}>
            <Download size={14} /> PDF
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold" style={{ background: C.bgCard, border: `1px solid ${C.border}`, color: C.textMuted }}>
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg p-1" style={{ background: C.bgCard, border: `1px solid ${C.border}`, width: 'fit-content' }}>
        <button onClick={() => setTab('invasoes')} className="px-4 py-1.5 rounded text-xs font-bold transition-colors" style={{ background: tab === 'invasoes' ? C.border : 'transparent', color: tab === 'invasoes' ? C.text : C.textDim }}>Relatorio de Invasoes</button>
        <button onClick={() => setTab('acoes')} className="px-4 py-1.5 rounded text-xs font-bold transition-colors" style={{ background: tab === 'acoes' ? C.border : 'transparent', color: tab === 'acoes' ? C.text : C.textDim }}>Desempenho de Acoes</button>
      </div>

      {tab === 'invasoes' ? (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricCards.map((m, i) => (
              <div key={i} className="rounded-xl p-5 flex items-start gap-3" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
                <m.icon size={20} style={{ color: m.color }} />
                <div>
                  <div className="text-2xl font-extrabold" style={{ color: C.text }}>{m.value}</div>
                  <div className="text-[10px] font-bold tracking-wider uppercase" style={{ color: C.textDim }}>{m.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Products */}
            <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>Produtos Mais Invadidos</h3>
              <div className="space-y-3">
                {topInvadidos.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-6" style={{ color: C.gold }}>#{i + 1}</span>
                    {p.img ? (
                      <img src={p.img} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg" style={{ background: C.border }} />
                    )}
                    <span className="flex-1 text-xs truncate" style={{ color: C.textMuted }}>{p.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#7F1D1D', color: '#FCA5A5' }}>{p.count} inv.</span>
                  </div>
                ))}
                {topInvadidos.length === 0 && <p className="text-xs text-center py-4" style={{ color: C.textDim }}>Sem dados</p>}
              </div>
            </div>

            {/* Frequent Invaders Bar Chart */}
            <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>Invasores Mais Frequentes</h3>
              {invasoresFrequentes.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={invasoresFrequentes}>
                    <XAxis dataKey="name" tick={{ fill: C.textDim, fontSize: 10 }} angle={-30} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }} />
                    <Bar dataKey="count" fill={C.gold} radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-sm" style={{ color: C.textDim }}>Sem dados</div>
              )}
            </div>
          </div>

          {/* Status Distribution Donut */}
          <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>Distribuicao por Status de Invasao</h3>
            <div className="flex items-center justify-center gap-8">
              {statusDist.some(d => d.value > 0) ? (
                <>
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie data={statusDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {statusDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {statusDist.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs" style={{ color: C.textMuted }}>
                        <span className="w-3 h-3 rounded-full" style={{ background: d.fill }} /> {d.name}: {d.value}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-sm py-8" style={{ color: C.textDim }}>Sem dados de invasoes</div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Acoes Tab */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(STATUS_COLORS).map(([key, sc]) => (
              <div key={key} className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
                <div className="text-2xl font-extrabold" style={{ color: sc.dot }}>{acoes.filter(a => a.status === key).length}</div>
                <div className="text-[10px] font-bold tracking-wider uppercase mt-1" style={{ color: C.textDim }}>{sc.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>Distribuicao de Acoes por Status</h3>
            {acaoStatusDist.some(d => d.value > 0) ? (
              <div className="flex items-center justify-center gap-8">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={acaoStatusDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {acaoStatusDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {acaoStatusDist.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs" style={{ color: C.textMuted }}>
                      <span className="w-3 h-3 rounded-full" style={{ background: d.fill }} /> {d.name}: {d.value}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-center py-8" style={{ color: C.textDim }}>Sem acoes registradas</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
