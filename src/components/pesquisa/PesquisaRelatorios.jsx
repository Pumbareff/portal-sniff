import React, { useState } from 'react';
import { FileText, Download, Calendar, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PESQUISA_COLORS } from './pesquisaTheme';

const C = PESQUISA_COLORS;

export default function PesquisaRelatorios({ data }) {
  const { mock } = data;
  const [periodo, setPeriodo] = useState('mensal');

  const periodos = [
    { id: 'semanal', label: 'Semanal' },
    { id: 'mensal', label: 'Mensal' },
    { id: 'trimestral', label: 'Trimestral' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: C.text }}>Relatorios</h2>
          <p className="text-sm mt-1" style={{ color: C.textMuted }}>Gere, exporte e consulte relatorios de inteligencia de mercado.</p>
        </div>
        <div className="flex gap-2">
          {periodos.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriodo(p.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: periodo === p.id ? C.accent : 'transparent',
                color: periodo === p.id ? '#000' : C.textMuted,
                border: periodo === p.id ? 'none' : `1px solid ${C.border}`,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-3">
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ background: C.accent, color: '#000' }}>
          <Download size={16} /> Exportar CSV
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ background: C.bgCard, color: C.text, border: `1px solid ${C.border}` }}>
          <FileText size={16} /> Exportar PDF
        </button>
      </div>

      {/* Comparativo Chart */}
      <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} style={{ color: C.accent }} />
          <span className="text-sm font-bold" style={{ color: C.text }}>Comparativo de Performance</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={mock.comparativo}>
            <XAxis dataKey="periodo" tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} />
            <Legend wrapperStyle={{ color: C.textMuted, fontSize: 11 }} />
            <Bar dataKey="vendas" name="Vendas" fill={C.accent} radius={[4, 4, 0, 0]} />
            <Bar dataKey="meta" name="Meta" fill={C.yellow} radius={[4, 4, 0, 0]} />
            <Bar dataKey="anterior" name="Periodo Anterior" fill={C.textDim} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Historico de Reports */}
      <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} style={{ color: C.blue }} />
          <span className="text-sm font-bold" style={{ color: C.text }}>Historico de Relatorios</span>
        </div>
        <div className="space-y-3">
          {mock.historicoReports.map(r => (
            <div key={r.id} className="flex items-center justify-between p-4 rounded-lg" style={{ background: C.bg }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${C.accent}20` }}>
                  <FileText size={18} style={{ color: C.accent }} />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: C.text }}>{r.nome}</div>
                  <div className="text-xs" style={{ color: C.textMuted }}>{r.tipo} - {r.gerado} - {r.tamanho}</div>
                </div>
              </div>
              <button className="p-2 rounded-lg hover:opacity-80" style={{ background: `${C.accent}15` }}>
                <Download size={16} style={{ color: C.accent }} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
