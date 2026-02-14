import React, { useState, useMemo } from 'react';
import { ClipboardList, Plus, X, Grid3X3, List, ChevronRight, Calendar, User } from 'lucide-react';
import { DEFESA_COLORS, STATUS_COLORS } from './defesaTheme';

const C = DEFESA_COLORS;
const COLUMNS = ['pendente', 'em_andamento', 'aguardando', 'concluida'];

export default function DefesaAcoes({ data }) {
  const { acoes, produtos, addAcao, updateAcaoStatus } = data;
  const [viewMode, setViewMode] = useState('kanban');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ titulo: '', descricao: '', produto_nome: '', tipo: '', responsavel: '', prazo: '' });

  const grouped = useMemo(() => {
    const g = { pendente: [], em_andamento: [], aguardando: [], concluida: [] };
    acoes.forEach(a => { if (g[a.status]) g[a.status].push(a); });
    return g;
  }, [acoes]);

  const openCount = acoes.filter(a => a.status !== 'concluida').length;

  const handleAdd = async () => {
    if (!form.titulo) return;
    await addAcao({ ...form, status: 'pendente', prazo: form.prazo || null });
    setShowModal(false);
    setForm({ titulo: '', descricao: '', produto_nome: '', tipo: '', responsavel: '', prazo: '' });
  };

  const moveForward = async (acao) => {
    const next = { pendente: 'em_andamento', em_andamento: 'aguardando', aguardando: 'concluida' };
    if (next[acao.status]) await updateAcaoStatus(acao.id, next[acao.status]);
  };

  const moveBack = async (acao) => {
    const prev = { em_andamento: 'pendente', aguardando: 'em_andamento', concluida: 'aguardando' };
    if (prev[acao.status]) await updateAcaoStatus(acao.id, prev[acao.status]);
  };

  const inputStyle = { background: '#1E293B', border: `1px solid ${C.border}`, color: C.text, outline: 'none' };

  const KanbanCard = ({ acao }) => {
    const tipo = acao.tipo || '';
    return (
      <div className="rounded-lg p-3 mb-2" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
        <div className="flex items-start gap-2 mb-2">
          <ClipboardList size={12} className="shrink-0 mt-0.5" style={{ color: C.textDim }} />
          <span className="text-xs font-bold leading-tight" style={{ color: C.text }}>{acao.titulo}</span>
        </div>
        {acao.produto_nome && (
          <p className="text-[10px] mb-2 truncate" style={{ color: C.textDim }}>{acao.produto_nome}</p>
        )}
        {tipo && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded border" style={{ color: '#EF4444', borderColor: '#EF4444' }}>{tipo}</span>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {acao.responsavel && (
              <span className="flex items-center gap-1 text-[10px]" style={{ color: C.textMuted }}>
                <User size={10} /> {acao.responsavel}
              </span>
            )}
          </div>
          {acao.prazo && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: C.textDim }}>
              <Calendar size={10} /> {new Date(acao.prazo).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
        <div className="flex gap-1 mt-2">
          {acao.status !== 'pendente' && (
            <button onClick={() => moveBack(acao)} className="text-[9px] px-2 py-0.5 rounded" style={{ background: C.border, color: C.textMuted }}>← Voltar</button>
          )}
          {acao.status !== 'concluida' && (
            <button onClick={() => moveForward(acao)} className="text-[9px] px-2 py-0.5 rounded" style={{ background: 'rgba(244,185,66,0.15)', color: C.gold }}>Avancar →</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList size={20} style={{ color: C.gold }} />
            <h2 className="text-xl font-extrabold" style={{ color: C.text }}>Acoes de Defesa</h2>
          </div>
          <p className="text-xs mt-1" style={{ color: C.textMuted }}>{openCount} acoes em aberto</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
            <button onClick={() => setViewMode('kanban')} className="p-2" style={{ background: viewMode === 'kanban' ? C.border : 'transparent', color: viewMode === 'kanban' ? C.text : C.textDim }}><Grid3X3 size={16} /></button>
            <button onClick={() => setViewMode('list')} className="p-2" style={{ background: viewMode === 'list' ? C.border : 'transparent', color: viewMode === 'list' ? C.text : C.textDim }}><List size={16} /></button>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold" style={{ background: C.gold, color: '#000' }}>
            <Plus size={14} /> Nova Acao
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {COLUMNS.map(col => {
            const sc = STATUS_COLORS[col];
            const items = grouped[col];
            return (
              <div key={col} className="rounded-xl p-3 min-h-[200px]" style={{ background: `${sc.bg}33`, border: `1px solid ${sc.dot}22` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: sc.dot }} />
                    <span className="text-xs font-extrabold tracking-wider" style={{ color: sc.text }}>{sc.label}</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: C.border, color: C.textMuted }}>{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <div className="text-xs text-center py-8" style={{ color: C.textDim }}>Sem acoes</div>
                ) : (
                  items.map(a => <KanbanCard key={a.id} acao={a} />)
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl overflow-hidden" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Titulo', 'Produto', 'Tipo', 'Responsavel', 'Status', 'Prazo', ''].map(h => (
                  <th key={h} className="text-left p-3 text-[10px] font-bold tracking-wider uppercase" style={{ color: C.textDim }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {acoes.map(a => {
                const sc = STATUS_COLORS[a.status] || STATUS_COLORS.pendente;
                return (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td className="p-3 text-xs font-semibold" style={{ color: C.text }}>{a.titulo}</td>
                    <td className="p-3 text-xs" style={{ color: C.textMuted }}>{a.produto_nome || '-'}</td>
                    <td className="p-3 text-xs" style={{ color: C.textMuted }}>{a.tipo || '-'}</td>
                    <td className="p-3 text-xs" style={{ color: C.textMuted }}>{a.responsavel || '-'}</td>
                    <td className="p-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.text }}>{sc.label}</span></td>
                    <td className="p-3 text-xs" style={{ color: C.textDim }}>{a.prazo ? new Date(a.prazo).toLocaleDateString('pt-BR') : '-'}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {a.status !== 'concluida' && (
                          <button onClick={() => moveForward(a)} className="text-[9px] px-2 py-0.5 rounded" style={{ background: 'rgba(244,185,66,0.15)', color: C.gold }}>Avancar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {acoes.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-sm" style={{ color: C.textDim }}>Nenhuma acao registrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* New Action Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: C.bgCard, border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: C.text }}>Nova Acao</h3>
              <button onClick={() => setShowModal(false)} style={{ color: C.textDim }}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Titulo da acao *" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              <textarea placeholder="Descricao" rows={2} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              <select value={form.produto_nome} onChange={e => setForm({ ...form, produto_nome: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
                <option value="">Selecione o produto</option>
                {produtos.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
              </select>
              <input placeholder="Tipo (ex: Denuncia no BPP)" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Responsavel" value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                <input type="date" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm font-bold" style={{ border: `1px solid ${C.border}`, color: C.textMuted }}>Cancelar</button>
              <button onClick={handleAdd} className="flex-1 py-2 rounded-lg text-sm font-bold" style={{ background: C.gold, color: '#000' }}>Criar Acao</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
