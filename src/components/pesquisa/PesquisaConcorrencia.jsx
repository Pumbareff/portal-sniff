import React, { useState } from 'react';
import { Eye, TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { PESQUISA_COLORS } from './pesquisaTheme';

const C = PESQUISA_COLORS;

const tendenciaIcon = { up: TrendingUp, down: TrendingDown, stable: Minus };
const tendenciaColor = { up: C.green, down: C.red, stable: C.textMuted };

export default function PesquisaConcorrencia({ data }) {
  const { mock } = data;
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: C.text }}>Analise de Concorrencia</h2>
          <p className="text-sm mt-1" style={{ color: C.textMuted }}>Rastreie concorrentes, compare precos e identifique posicionamento.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: C.accent, color: '#000' }}
        >
          <Plus size={16} /> Adicionar Concorrente
        </button>
      </div>

      {/* Concorrentes Table */}
      <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
        <span className="text-sm font-bold" style={{ color: C.text }}>Concorrentes Monitorados</span>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Loja', 'Marketplace', 'Produtos', 'Preco Medio', 'Reputacao', 'Vendas 30d', 'Tendencia'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-bold uppercase" style={{ color: C.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mock.concorrentes.map(c => {
                const TIcon = tendenciaIcon[c.tendencia];
                return (
                  <tr key={c.id} className="hover:opacity-80 cursor-pointer" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td className="py-3 px-3 font-medium" style={{ color: C.text }}>{c.nome}</td>
                    <td className="py-3 px-3" style={{ color: C.textMuted }}>{c.marketplace}</td>
                    <td className="py-3 px-3" style={{ color: C.textMuted }}>{c.produtos}</td>
                    <td className="py-3 px-3" style={{ color: C.textMuted }}>{c.precoMedio}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-1 rounded text-xs" style={{ background: `${C.accent}20`, color: C.accent }}>{c.reputacao}</span>
                    </td>
                    <td className="py-3 px-3 font-bold" style={{ color: C.text }}>{c.vendas30d.toLocaleString()}</td>
                    <td className="py-3 px-3"><TIcon size={16} style={{ color: tendenciaColor[c.tendencia] }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Posicionamento Bar */}
        <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
          <span className="text-sm font-bold" style={{ color: C.text }}>Posicionamento Preco vs Qualidade</span>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mock.posicionamento} className="mt-4">
              <XAxis dataKey="nome" tick={{ fill: C.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
              <Legend wrapperStyle={{ color: C.textMuted, fontSize: 11 }} />
              <Bar dataKey="preco" name="Preco (R$)" fill={C.accent} radius={[4, 4, 0, 0]} />
              <Bar dataKey="qualidade" name="Qualidade (%)" fill={C.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Historico Precos */}
        <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
          <span className="text-sm font-bold" style={{ color: C.text }}>Historico de Precos (30 dias)</span>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={mock.historicoPrecos} className="mt-4">
              <XAxis dataKey="data" tick={{ fill: C.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textDim, fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
              <Legend wrapperStyle={{ color: C.textMuted, fontSize: 11 }} />
              <Line type="monotone" dataKey="sniff" name="SNIFF" stroke={C.accent} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="concorrente1" name="Concorrente 1" stroke={C.orange} strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="concorrente2" name="Concorrente 2" stroke={C.purple} strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="mercado" name="Media Mercado" stroke={C.textDim} strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modal Add Concorrente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: C.bgCard, border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ color: C.text }}>Adicionar Concorrente</h3>
            <div className="space-y-4">
              {['Nome da Loja', 'URL do Marketplace', 'Marketplace'].map(label => (
                <div key={label}>
                  <label className="text-xs font-bold uppercase" style={{ color: C.textMuted }}>{label}</label>
                  <input className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }} placeholder={label} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm" style={{ border: `1px solid ${C.border}`, color: C.textMuted }}>Cancelar</button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm font-bold" style={{ background: C.accent, color: '#000' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
