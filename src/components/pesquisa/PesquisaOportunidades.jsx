import React from 'react';
import { Lightbulb, TrendingUp, Target } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { PESQUISA_COLORS, SCORE_COLORS } from './pesquisaTheme';

const C = PESQUISA_COLORS;

export default function PesquisaOportunidades({ data }) {
  const { mock } = data;

  const scoreColor = (score) => score >= 90 ? C.accent : score >= 80 ? C.green : score >= 70 ? C.yellow : C.orange;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: C.text }}>Oportunidades de Mercado</h2>
        <p className="text-sm mt-1" style={{ color: C.textMuted }}>Detecte gaps no mercado, categorias em alta e oportunidades de entrada.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scatter - Gaps */}
        <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} style={{ color: C.accent }} />
            <span className="text-sm font-bold" style={{ color: C.text }}>Gaps de Mercado (Demanda vs Oferta)</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <XAxis type="number" dataKey="demanda" name="Demanda" tick={{ fill: C.textDim, fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Demanda', position: 'bottom', fill: C.textDim, fontSize: 10 }} />
              <YAxis type="number" dataKey="oferta" name="Oferta" tick={{ fill: C.textDim, fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Oferta', angle: -90, position: 'left', fill: C.textDim, fontSize: 10 }} />
              <ZAxis type="number" dataKey="oportunidade" range={[100, 600]} />
              <Tooltip
                contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }}
                formatter={(value, name) => [value, name]}
                labelFormatter={() => ''}
                content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="p-2 rounded-lg text-xs" style={{ background: C.bgCard, border: `1px solid ${C.border}`, color: C.text }}>
                      <div className="font-bold">{d.nome}</div>
                      <div>Demanda: {d.demanda} | Oferta: {d.oferta}</div>
                      <div style={{ color: C.accent }}>Oportunidade: {d.oportunidade}%</div>
                    </div>
                  );
                }}
              />
              <Scatter data={mock.gapsMercado} fill={C.accent} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Bar - Trending */}
        <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: C.green }} />
            <span className="text-sm font-bold" style={{ color: C.text }}>Categorias em Alta</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mock.categoriasTrending} layout="vertical">
              <XAxis type="number" tick={{ fill: C.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="categoria" tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
              <Bar dataKey="crescimento" name="Crescimento (%)" radius={[0, 4, 4, 0]}>
                {mock.categoriasTrending.map((_, i) => (
                  <Cell key={i} fill={[C.accent, C.green, C.blue, C.purple, C.yellow][i % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela Oportunidades */}
      <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={16} style={{ color: C.yellow }} />
          <span className="text-sm font-bold" style={{ color: C.text }}>Oportunidades Detectadas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Score', 'Produto', 'Demanda/Mes', 'Concorrentes', 'Preco Medio', 'Margem Est.', 'Marketplace'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-bold uppercase" style={{ color: C.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mock.oportunidadesTabela.map(op => (
                <tr key={op.id} className="hover:opacity-80" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="py-3 px-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: `${scoreColor(op.score)}20`, color: scoreColor(op.score) }}>{op.score}</div>
                  </td>
                  <td className="py-3 px-3 font-medium" style={{ color: C.text }}>{op.produto}</td>
                  <td className="py-3 px-3" style={{ color: C.textMuted }}>{op.demandaMensal}</td>
                  <td className="py-3 px-3" style={{ color: op.concorrentes <= 5 ? C.green : op.concorrentes <= 12 ? C.yellow : C.red }}>{op.concorrentes}</td>
                  <td className="py-3 px-3" style={{ color: C.textMuted }}>{op.precoMedio}</td>
                  <td className="py-3 px-3 font-bold" style={{ color: C.accent }}>{op.margemEst}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-1 rounded text-xs" style={{ background: `${C.accent}15`, color: C.textMuted }}>{op.marketplace}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
