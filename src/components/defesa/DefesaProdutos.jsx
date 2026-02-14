import React, { useState, useMemo } from 'react';
import { Settings, Search, Plus, Eye, Edit2, ExternalLink, Trash2, X, Shield } from 'lucide-react';
import { DEFESA_COLORS } from './defesaTheme';

const C = DEFESA_COLORS;
const PER_PAGE = 6;

export default function DefesaProdutos({ data, supabase }) {
  const { produtos, addProduto, updateProduto, deleteProduto } = data;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [form, setForm] = useState({ nome: '', preco: '', sku: '', ean: '', imagem_url: '', ml_link: '', status: 'ativo' });

  const filtered = useMemo(() => {
    let list = produtos;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => (p.nome || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p.ean || '').toLowerCase().includes(q));
    }
    if (statusFilter !== 'todos') list = list.filter(p => p.status === statusFilter);
    return list;
  }, [produtos, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const viewProd = viewId ? produtos.find(p => p.id === viewId) : null;

  const openAdd = () => {
    setEditId(null);
    setForm({ nome: '', preco: '', sku: '', ean: '', imagem_url: '', ml_link: '', status: 'ativo' });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setForm({ nome: p.nome || '', preco: p.preco || '', sku: p.sku || '', ean: p.ean || '', imagem_url: p.imagem_url || '', ml_link: p.ml_link || '', status: p.status || 'ativo' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nome) return;
    const payload = { ...form, preco: form.preco ? parseFloat(form.preco) : null };
    if (editId) {
      await updateProduto(editId, payload);
    } else {
      await addProduto(payload);
    }
    setShowModal(false);
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover este produto?')) return;
    await deleteProduto(id);
  };

  const inputStyle = { background: '#1E293B', border: `1px solid ${C.border}`, color: C.text, outline: 'none' };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Settings size={20} style={{ color: C.gold }} />
            <h2 className="text-xl font-extrabold" style={{ color: C.text }}>Gestao de Produtos</h2>
          </div>
          <p className="text-xs mt-1" style={{ color: C.textMuted }}>{produtos.length} produtos monitorados</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors" style={{ background: C.gold, color: '#000' }}>
          <Plus size={14} /> Adicionar Produto
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 rounded-xl p-4" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#1E293B', border: `1px solid ${C.border}` }}>
          <Search size={16} style={{ color: C.textDim }} />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nome, SKU ou EAN..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: C.text }}
          />
        </div>
        <select
          value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg text-sm"
          style={inputStyle}
        >
          <option value="todos">Todos os Status</option>
          <option value="ativo">Ativo</option>
          <option value="pausado">Pausado</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['PRODUTO', 'Preco', 'SKU / EAN', 'Invasores', 'Status', 'ACOES'].map(h => (
                <th key={h} className="text-left p-3 text-[10px] font-bold tracking-wider uppercase" style={{ color: C.textDim }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map(p => (
              <tr key={p.id} className="transition-colors" style={{ borderBottom: `1px solid ${C.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {p.imagem_url ? (
                      <img src={p.imagem_url} alt="" className="w-9 h-9 rounded-lg object-cover" style={{ border: `1px solid ${C.border}` }} />
                    ) : (
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: C.border }}>
                        <Shield size={14} style={{ color: C.textDim }} />
                      </div>
                    )}
                    <span className="text-xs font-semibold" style={{ color: C.text }}>{(p.nome || '').length > 30 ? p.nome.slice(0, 30) + '...' : p.nome}</span>
                  </div>
                </td>
                <td className="p-3 text-xs" style={{ color: C.textMuted }}>
                  {p.preco ? `R$ ${Number(p.preco).toFixed(2)}` : '-'}
                </td>
                <td className="p-3">
                  <div className="text-xs font-mono" style={{ color: C.textMuted }}>{p.sku || '-'}</div>
                  <div className="text-[10px] font-mono" style={{ color: C.textDim }}>{p.ean || ''}</div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    <Shield size={12} style={{ color: '#22C55E' }} />
                    <span className="text-xs font-bold" style={{ color: C.text }}>{p.invasores_count || 0}</span>
                  </div>
                </td>
                <td className="p-3">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: p.status === 'ativo' ? '#052E16' : p.status === 'pausado' ? '#422006' : '#1E1E1E', color: p.status === 'ativo' ? '#22C55E' : p.status === 'pausado' ? '#EAB308' : '#94A3B8' }}>
                    {(p.status || 'ativo').charAt(0).toUpperCase() + (p.status || 'ativo').slice(1)}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setViewId(p.id)} title="Ver" style={{ color: C.textDim }}><Eye size={15} /></button>
                    <button onClick={() => openEdit(p)} title="Editar" style={{ color: C.textDim }}><Edit2 size={15} /></button>
                    {p.ml_link && <a href={p.ml_link} target="_blank" rel="noreferrer" title="Ver no ML" style={{ color: C.textDim }}><ExternalLink size={15} /></a>}
                    <button onClick={() => handleDelete(p.id)} title="Remover" style={{ color: C.textDim }}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-sm" style={{ color: C.textDim }}>Nenhum produto encontrado.</td></tr>
            )}
          </tbody>
        </table>
        {/* Pagination */}
        {filtered.length > PER_PAGE && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${C.border}` }}>
            <span className="text-xs" style={{ color: C.textDim }}>Mostrando {(page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, filtered.length)} de {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 text-xs rounded" style={{ color: page === 1 ? C.textDim : C.textMuted }}>Anterior</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} className="w-7 h-7 rounded text-xs font-bold" style={{ background: n === page ? C.gold : 'transparent', color: n === page ? '#000' : C.textMuted }}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1 text-xs rounded" style={{ color: page === totalPages ? C.textDim : C.textMuted }}>Proximo</button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewProd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setViewId(null)}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: C.bgCard, border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: C.text }}>Detalhes do Produto</h3>
              <button onClick={() => setViewId(null)} style={{ color: C.textDim }}><X size={18} /></button>
            </div>
            {viewProd.imagem_url && <img src={viewProd.imagem_url} alt="" className="w-full h-40 object-cover rounded-lg mb-4" />}
            <div className="space-y-2 text-sm" style={{ color: C.textMuted }}>
              <p><strong style={{ color: C.text }}>Nome:</strong> {viewProd.nome}</p>
              <p><strong style={{ color: C.text }}>Preco:</strong> {viewProd.preco ? `R$ ${Number(viewProd.preco).toFixed(2)}` : '-'}</p>
              <p><strong style={{ color: C.text }}>SKU:</strong> {viewProd.sku || '-'}</p>
              <p><strong style={{ color: C.text }}>EAN:</strong> {viewProd.ean || '-'}</p>
              <p><strong style={{ color: C.text }}>Invasores:</strong> {viewProd.invasores_count || 0}</p>
              <p><strong style={{ color: C.text }}>Status:</strong> {viewProd.status}</p>
              {viewProd.ml_link && <p><strong style={{ color: C.text }}>ML:</strong> <a href={viewProd.ml_link} target="_blank" rel="noreferrer" style={{ color: C.gold }}>{viewProd.ml_link}</a></p>}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: C.bgCard, border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: C.text }}>{editId ? 'Editar Produto' : 'Adicionar Produto'}</h3>
              <button onClick={() => setShowModal(false)} style={{ color: C.textDim }}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input placeholder="Nome do produto *" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Preco (R$)" type="number" step="0.01" value={form.preco} onChange={e => setForm({ ...form, preco: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
                  <option value="ativo">Ativo</option>
                  <option value="pausado">Pausado</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                <input placeholder="EAN" value={form.ean} onChange={e => setForm({ ...form, ean: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              </div>
              <input placeholder="URL da imagem" value={form.imagem_url} onChange={e => setForm({ ...form, imagem_url: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              <input placeholder="Link Mercado Livre" value={form.ml_link} onChange={e => setForm({ ...form, ml_link: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm font-bold" style={{ border: `1px solid ${C.border}`, color: C.textMuted }}>Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2 rounded-lg text-sm font-bold" style={{ background: C.gold, color: '#000' }}>{editId ? 'Salvar' : 'Adicionar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
