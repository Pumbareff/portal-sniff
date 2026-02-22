import React, { useState } from 'react';
import { DollarSign, TrendingUp, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { PESQUISA_COLORS } from './pesquisaTheme';

const C = PESQUISA_COLORS;

export default function PesquisaElasticidade({ data }) {
  const { mock } = data;
  const [simPreco, setSimPreco] = useState(65);
  const simDemanda = Math.max(5, Math.floor(200 * Math.exp(-0.015 * simPreco)));
  const simReceita = simPreco * simDemanda;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: C.text }}>Elasticidade de Precos</h2>
        <p className="text-sm mt-1" style={{ color: C.textMuted }}>Analise como variacoes de preco impactam demanda e receita.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Curva Elasticidade */}
        <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: C.accent }} />
            <span className="text-sm font-bold" style={{ color: C.text }}>Curva Preco vs Demanda</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={mock.elasticidade}>
              <XAxis dataKey="preco" tick={{ fill: C.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
              <Line type="monotone" dataKey="demanda" stroke={C.accent} strokeWidth={2} dot={{ r: 3, fill: C.accent }} name="Demanda (un)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Receita Otima */}
        <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={16} style={{ color: C.yellow }} />
            <span className="text-sm font-bold" style={{ color: C.text }}>Receita por Faixa de Preco</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={mock.receitaOtima}>
              <defs>
                <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.yellow} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={C.yellow} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="preco" tick={{ fill: C.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
              <Area type="monotone" dataKey="receita" stroke={C.yellow} fill="url(#gradReceita)" strokeWidth={2} name="Receita (R$)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Simulador Interativo */}
      <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} style={{ color: C.accent }} />
          <span className="text-sm font-bold" style={{ color: C.text }}>Simulador de Preco</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase" style={{ color: C.textMuted }}>Preco (R$)</label>
            <input
              type="range"
              min={20}
              max={150}
              value={simPreco}
              onChange={e => setSimPreco(Number(e.target.value))}
              className="w-full mt-2 accent-teal-400"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: C.textDim }}>
              <span>R$ 20</span>
              <span className="text-lg font-bold" style={{ color: C.accent }}>R$ {simPreco}</span>
              <span>R$ 150</span>
            </div>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ background: C.bg }}>
            <div className="text-xs font-bold uppercase" style={{ color: C.textMuted }}>Demanda Estimada</div>
            <div className="text-2xl font-extrabold mt-1" style={{ color: C.accent }}>{simDemanda} un</div>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ background: C.bg }}>
            <div className="text-xs font-bold uppercase" style={{ color: C.textMuted }}>Receita Projetada</div>
            <div className="text-2xl font-extrabold mt-1" style={{ color: C.yellow }}>R$ {simReceita.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Sugestoes de Preco */}
      <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
        <span className="text-sm font-bold" style={{ color: C.text }}>Sugestoes de Ajuste de Preco</span>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Produto', 'Preco Atual', 'Preco Sugerido', 'Impacto Estimado', 'Confianca'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-bold uppercase" style={{ color: C.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mock.sugestoesPreco.map((s, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="py-3 px-3 font-medium" style={{ color: C.text }}>{s.produto}</td>
                  <td className="py-3 px-3" style={{ color: C.textMuted }}>{s.precoAtual}</td>
                  <td className="py-3 px-3 font-bold" style={{ color: C.accent }}>{s.precoSugerido}</td>
                  <td className="py-3 px-3" style={{ color: C.green }}>{s.impacto}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full" style={{ background: C.bg }}>
                        <div className="h-full rounded-full" style={{ width: `${s.confianca}%`, background: s.confianca >= 90 ? C.green : s.confianca >= 80 ? C.yellow : C.orange }} />
                      </div>
                      <span className="text-xs" style={{ color: C.textMuted }}>{s.confianca}%</span>
                    </div>
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
