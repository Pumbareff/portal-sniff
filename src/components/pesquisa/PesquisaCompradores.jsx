import React from 'react';
import { Users, ShoppingCart, Crown, UserPlus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PESQUISA_COLORS } from './pesquisaTheme';

const C = PESQUISA_COLORS;

const segmentoIcons = {
  recorrente: Users,
  caca_ofertas: ShoppingCart,
  premium: Crown,
  novo: UserPlus,
};

const rfmColors = {
  Champion: C.accent,
  Loyal: C.blue,
  Potential: C.purple,
  'At Risk': C.yellow,
  New: C.green,
  Hibernating: C.orange,
  Lost: C.red,
};

export default function PesquisaCompradores({ data }) {
  const { mock } = data;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: C.text }}>Segmentacao de Compradores</h2>
        <p className="text-sm mt-1" style={{ color: C.textMuted }}>Entenda o perfil dos seus clientes e otimize estrategias por segmento.</p>
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mock.segmentos.map(seg => {
          const Icon = segmentoIcons[seg.id] || Users;
          return (
            <div key={seg.id} className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${seg.cor}20` }}>
                  <Icon size={20} style={{ color: seg.cor }} />
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: C.text }}>{seg.nome}</div>
                  <div className="text-xs" style={{ color: C.textMuted }}>{seg.percentual}% da base</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span style={{ color: C.textMuted }}>Total</span>
                  <span style={{ color: C.text }}>{seg.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: C.textMuted }}>Ticket Medio</span>
                  <span style={{ color: C.text }}>{seg.ticket}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: C.textMuted }}>Frequencia</span>
                  <span style={{ color: C.text }}>{seg.freq}</span>
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full" style={{ background: C.bg }}>
                <div className="h-full rounded-full" style={{ width: `${seg.percentual}%`, background: seg.cor }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Comportamento Chart */}
      <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
        <span className="text-sm font-bold" style={{ color: C.text }}>Comportamento Mensal por Segmento</span>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={mock.comportamento} className="mt-4">
            <XAxis dataKey="mes" tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
            <Legend wrapperStyle={{ color: C.textMuted, fontSize: 11 }} />
            <Bar dataKey="recorrente" name="Recorrente" fill={C.accent} radius={[2, 2, 0, 0]} />
            <Bar dataKey="caca_ofertas" name="Caca-Ofertas" fill={C.yellow} radius={[2, 2, 0, 0]} />
            <Bar dataKey="premium" name="Premium" fill={C.purple} radius={[2, 2, 0, 0]} />
            <Bar dataKey="novo" name="Novo" fill={C.blue} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* RFM Table */}
      <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
        <span className="text-sm font-bold" style={{ color: C.text }}>Analise RFM (Recencia, Frequencia, Monetario)</span>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Cliente', 'Recencia (dias)', 'Frequencia', 'Monetario', 'Segmento'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-bold uppercase" style={{ color: C.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mock.rfm.map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="py-3 px-3 font-medium" style={{ color: C.text }}>{row.cliente}</td>
                  <td className="py-3 px-3" style={{ color: C.textMuted }}>{row.recencia}</td>
                  <td className="py-3 px-3" style={{ color: C.textMuted }}>{row.frequencia}</td>
                  <td className="py-3 px-3" style={{ color: C.textMuted }}>{row.monetario}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: `${rfmColors[row.segmento] || C.textDim}20`, color: rfmColors[row.segmento] || C.textDim }}>{row.segmento}</span>
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
