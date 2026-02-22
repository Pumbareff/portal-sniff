import React from 'react';
import { TrendingUp, Calendar, AlertTriangle, Package } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { PESQUISA_COLORS } from './pesquisaTheme';

const C = PESQUISA_COLORS;

const statusColors = {
  critico: { bg: '#7F1D1D', text: '#FCA5A5', dot: C.red },
  atencao: { bg: '#422006', text: '#FDE047', dot: C.yellow },
  ok: { bg: '#052E16', text: '#86EFAC', dot: C.green },
};

export default function PesquisaDemanda({ data }) {
  const { mock } = data;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: C.text }}>Previsao de Demanda</h2>
        <p className="text-sm mt-1" style={{ color: C.textMuted }}>Forecast de vendas, sazonalidade e alertas de estoque baseados em dados historicos.</p>
      </div>

      {/* Forecast Chart */}
      <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} style={{ color: C.accent }} />
          <span className="text-sm font-bold" style={{ color: C.text }}>Forecast: Realizado vs Projecao (60 dias)</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={mock.forecast}>
            <defs>
              <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.accent} stopOpacity={0.3} />
                <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradProj" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.purple} stopOpacity={0.2} />
                <stop offset="100%" stopColor={C.purple} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="data" tick={{ fill: C.textDim, fontSize: 9 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: C.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
            <Area type="monotone" dataKey="realizado" stroke={C.accent} fill="url(#gradReal)" strokeWidth={2} name="Realizado" connectNulls={false} />
            <Area type="monotone" dataKey="projecao" stroke={C.purple} fill="url(#gradProj)" strokeWidth={2} strokeDasharray="5 5" name="Projecao" connectNulls={false} />
            <Area type="monotone" dataKey="max" stroke="transparent" fill={C.purple} fillOpacity={0.05} name="Maximo" connectNulls={false} />
            <Area type="monotone" dataKey="min" stroke="transparent" fill={C.purple} fillOpacity={0.05} name="Minimo" connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-2 text-xs" style={{ color: C.textMuted }}>
            <div className="w-4 h-0.5 rounded" style={{ background: C.accent }} /> Realizado
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: C.textMuted }}>
            <div className="w-4 h-0.5 rounded" style={{ background: C.purple, borderTop: '1px dashed' }} /> Projecao
          </div>
        </div>
      </div>

      {/* Sazonalidade Heatmap */}
      <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} style={{ color: C.yellow }} />
          <span className="text-sm font-bold" style={{ color: C.text }}>Sazonalidade por Categoria</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-2 px-2 font-bold uppercase" style={{ color: C.textMuted }}>Categoria</th>
                {mock.sazonalidade.map(m => (
                  <th key={m.mes} className="py-2 px-2 text-center font-bold" style={{ color: C.textMuted }}>{m.mes}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['Tacas', 'Jarras', 'Potes', 'Pet', 'Sousplats'].map(cat => (
                <tr key={cat} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="py-2 px-2 font-medium" style={{ color: C.text }}>{cat}</td>
                  {mock.sazonalidade.map((m, i) => {
                    const val = m[cat] || 0;
                    const intensity = Math.min(1, val / 95);
                    return (
                      <td key={i} className="py-2 px-2 text-center">
                        <div
                          className="w-8 h-8 rounded flex items-center justify-center mx-auto text-[10px] font-bold"
                          style={{
                            background: `rgba(0, 212, 170, ${intensity * 0.6})`,
                            color: intensity > 0.5 ? '#fff' : C.textMuted
                          }}
                        >
                          {val}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alertas Estoque */}
      <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} style={{ color: C.red }} />
          <span className="text-sm font-bold" style={{ color: C.text }}>Alertas de Estoque</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Produto', 'Estoque Atual', 'Previsao 30d', 'Status', 'Acao'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-bold uppercase" style={{ color: C.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mock.alertasEstoque.map((a, i) => {
                const sc = statusColors[a.status];
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td className="py-3 px-3 font-medium" style={{ color: C.text }}>{a.produto}</td>
                    <td className="py-3 px-3" style={{ color: a.estoqueAtual < a.previsao30d ? C.red : C.text }}>{a.estoqueAtual}</td>
                    <td className="py-3 px-3" style={{ color: C.textMuted }}>{a.previsao30d}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: sc.bg, color: sc.text }}>{a.status.toUpperCase()}</span>
                    </td>
                    <td className="py-3 px-3 text-xs" style={{ color: C.textMuted }}>{a.acao}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
