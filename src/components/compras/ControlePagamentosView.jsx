import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import {
  DollarSign, Clock, CheckCircle2, AlertTriangle, Plus, Search, Filter,
  X, Edit2, Trash2, Calendar, TrendingUp, AlertCircle, ChevronDown,
  FileText, CreditCard, Eye, Download
} from 'lucide-react';

const PURPLE = '#6B1B8E';
const GOLD = '#F4B942';

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', icon: Clock },
  pago: { label: 'Pago', color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', icon: CheckCircle2 },
  vencido: { label: 'Vencido', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', icon: AlertTriangle },
  parcial: { label: 'Parcial', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', icon: DollarSign },
};

const METODO_CONFIG = {
  pix: { label: 'PIX', color: '#00BDAE' },
  boleto: { label: 'Boleto', color: '#3B82F6' },
  transferencia: { label: 'Transferencia', color: '#6366F1' },
  cartao: { label: 'Cartao', color: '#EC4899' },
  dinheiro: { label: 'Dinheiro', color: '#10B981' },
};

const EMPTY_FORM = {
  fornecedor: '',
  descricao: '',
  valor: '',
  vencimento: '',
  data_pagamento: '',
  status: 'pendente',
  metodo_pagamento: 'pix',
  nota_fiscal: '',
  pedido_ref: '',
  observacoes: '',
};

const formatCurrency = (val) => {
  const num = parseFloat(val);
  if (isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const ControlePagamentosView = () => {
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFornecedor, setFilterFornecedor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('vencimento');
  const [sortDir, setSortDir] = useState('asc');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Load data
  const loadPagamentos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pagamentos_fornecedor')
        .select('*')
        .order('vencimento', { ascending: true });

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          setTableExists(false);
        }
        console.error('Erro ao carregar pagamentos:', error);
        setPagamentos([]);
      } else {
        // Auto-detect overdue
        const updated = (data || []).map(p => {
          if (p.status === 'pendente' && p.vencimento < today) {
            return { ...p, status: 'vencido', _autoVencido: true };
          }
          return p;
        });
        setPagamentos(updated);

        // Auto-update overdue in DB
        const overdue = updated.filter(p => p._autoVencido);
        for (const p of overdue) {
          await supabase.from('pagamentos_fornecedor').update({ status: 'vencido' }).eq('id', p.id);
        }
      }
    } catch (err) {
      console.error('Erro:', err);
    }
    setLoading(false);
  }, [today]);

  useEffect(() => { loadPagamentos(); }, [loadPagamentos]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalPendente = pagamentos
      .filter(p => p.status === 'pendente')
      .reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);

    const totalVencido = pagamentos
      .filter(p => p.status === 'vencido')
      .reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);

    const pagoMes = pagamentos
      .filter(p => {
        if (p.status !== 'pago' || !p.data_pagamento) return false;
        const d = new Date(p.data_pagamento);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);

    const prox7dias = pagamentos.filter(p => {
      if (p.status !== 'pendente') return false;
      const diff = (new Date(p.vencimento).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    }).length;

    return { totalPendente, totalVencido, pagoMes, prox7dias };
  }, [pagamentos]);

  // Unique suppliers for filter
  const fornecedores = useMemo(() => {
    const set = new Set(pagamentos.map(p => p.fornecedor).filter(Boolean));
    return [...set].sort();
  }, [pagamentos]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let result = [...pagamentos];
    if (filterStatus !== 'all') result = result.filter(p => p.status === filterStatus);
    if (filterFornecedor) result = result.filter(p => p.fornecedor === filterFornecedor);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.fornecedor?.toLowerCase().includes(term) ||
        p.descricao?.toLowerCase().includes(term) ||
        p.nota_fiscal?.toLowerCase().includes(term) ||
        p.pedido_ref?.toLowerCase().includes(term)
      );
    }
    result.sort((a, b) => {
      let va = a[sortField] || '';
      let vb = b[sortField] || '';
      if (sortField === 'valor') { va = parseFloat(va) || 0; vb = parseFloat(vb) || 0; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [pagamentos, filterStatus, filterFornecedor, searchTerm, sortField, sortDir]);

  // CRUD
  const handleSubmit = async () => {
    if (!formData.fornecedor || !formData.valor || !formData.vencimento) return;
    setSaving(true);

    const payload = {
      fornecedor: formData.fornecedor,
      descricao: formData.descricao,
      valor: parseFloat(formData.valor),
      vencimento: formData.vencimento,
      data_pagamento: formData.data_pagamento || null,
      status: formData.status,
      metodo_pagamento: formData.metodo_pagamento,
      nota_fiscal: formData.nota_fiscal,
      pedido_ref: formData.pedido_ref,
      observacoes: formData.observacoes,
    };

    if (editingId) {
      await supabase.from('pagamentos_fornecedor').update(payload).eq('id', editingId);
    } else {
      await supabase.from('pagamentos_fornecedor').insert(payload);
    }

    setShowForm(false);
    setEditingId(null);
    setFormData({ ...EMPTY_FORM });
    setSaving(false);
    loadPagamentos();
  };

  const handleEdit = (p) => {
    setFormData({
      fornecedor: p.fornecedor || '',
      descricao: p.descricao || '',
      valor: p.valor?.toString() || '',
      vencimento: p.vencimento || '',
      data_pagamento: p.data_pagamento || '',
      status: p.status || 'pendente',
      metodo_pagamento: p.metodo_pagamento || 'pix',
      nota_fiscal: p.nota_fiscal || '',
      pedido_ref: p.pedido_ref || '',
      observacoes: p.observacoes || '',
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await supabase.from('pagamentos_fornecedor').delete().eq('id', id);
    setConfirmDelete(null);
    loadPagamentos();
  };

  const handleMarkPago = async (p) => {
    await supabase.from('pagamentos_fornecedor').update({
      status: 'pago',
      data_pagamento: today,
    }).eq('id', p.id);
    loadPagamentos();
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ['Fornecedor', 'Descricao', 'Valor', 'Vencimento', 'Pagamento', 'Status', 'Metodo', 'NF', 'Pedido Ref', 'Observacoes'];
    const rows = filtered.map(p => [
      p.fornecedor, p.descricao, p.valor, p.vencimento, p.data_pagamento || '',
      p.status, p.metodo_pagamento, p.nota_fiscal, p.pedido_ref, p.observacoes
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagamentos_fornecedor_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Table doesn't exist yet
  if (!tableExists) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-amber-500" />
          <h3 className="text-lg font-bold text-amber-800 mb-2">Tabela nao encontrada</h3>
          <p className="text-sm text-amber-600 mb-4">
            A tabela <code className="bg-amber-100 px-2 py-0.5 rounded">pagamentos_fornecedor</code> ainda nao existe no Supabase.
          </p>
          <p className="text-xs text-amber-500">Execute o SQL de migracao no Supabase Dashboard para habilitar esta funcionalidade.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 bg-[#6B1B8E] rounded-xl mx-auto mb-3 flex items-center justify-center animate-pulse">
            <DollarSign className="text-[#F4B942] w-6 h-6" />
          </div>
          <p className="text-gray-500 text-sm">Carregando pagamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Controle de Pagamentos</h2>
          <p className="text-sm text-gray-500 mt-1">Gerencie pagamentos a fornecedores</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">
            <Download size={16} /> Exportar CSV
          </button>
          <button
            onClick={() => { setFormData({ ...EMPTY_FORM }); setEditingId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#6B1B8E] text-white rounded-xl hover:bg-[#5a1578] transition-colors text-sm font-medium shadow-md"
          >
            <Plus size={16} /> Novo Pagamento
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock size={20} className="text-amber-600" />
            </div>
            {stats.totalPendente > 0 && <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">PENDENTE</span>}
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalPendente)}</p>
          <p className="text-xs text-gray-500 mt-1">Total Pendente</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            {stats.totalVencido > 0 && <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full animate-pulse">VENCIDO</span>}
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalVencido)}</p>
          <p className="text-xs text-gray-500 mt-1">Total Vencido</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.pagoMes)}</p>
          <p className="text-xs text-gray-500 mt-1">Pago este Mes</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Calendar size={20} className="text-[#6B1B8E]" />
            </div>
            {stats.prox7dias > 0 && <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">ATENCAO</span>}
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.prox7dias}</p>
          <p className="text-xs text-gray-500 mt-1">Vencem em 7 dias</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar fornecedor, NF, descricao..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none text-sm w-full"
            />
            {searchTerm && <button onClick={() => setSearchTerm('')}><X size={14} className="text-gray-400" /></button>}
          </div>

          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-gray-400" />
            {['all', ...Object.keys(STATUS_CONFIG)].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === s
                    ? s === 'all' ? 'bg-[#6B1B8E] text-white' : `text-white`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={filterStatus === s && s !== 'all' ? { backgroundColor: STATUS_CONFIG[s].color } : undefined}
              >
                {s === 'all' ? 'Todos' : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>

          {fornecedores.length > 0 && (
            <select
              value={filterFornecedor}
              onChange={e => setFilterFornecedor(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-gray-100 border-0 outline-none text-gray-700"
            >
              <option value="">Todos fornecedores</option>
              {fornecedores.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500 font-medium">Nenhum pagamento encontrado</p>
            <p className="text-xs text-gray-400 mt-1">
              {pagamentos.length === 0 ? 'Clique em "Novo Pagamento" para comecar' : 'Tente ajustar os filtros'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  {[
                    { key: 'status', label: 'Status', w: 'w-24' },
                    { key: 'fornecedor', label: 'Fornecedor' },
                    { key: 'descricao', label: 'Descricao' },
                    { key: 'valor', label: 'Valor', w: 'w-32' },
                    { key: 'vencimento', label: 'Vencimento', w: 'w-28' },
                    { key: 'metodo_pagamento', label: 'Metodo', w: 'w-28' },
                    { key: 'nota_fiscal', label: 'NF', w: 'w-28' },
                    { key: '_actions', label: '', w: 'w-32' },
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => col.key !== '_actions' && handleSort(col.key)}
                      className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.w || ''} ${col.key !== '_actions' ? 'cursor-pointer hover:text-gray-700' : ''}`}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {sortField === col.key && (
                          <ChevronDown size={12} className={`transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => {
                  const st = STATUS_CONFIG[p.status] || STATUS_CONFIG.pendente;
                  const mt = METODO_CONFIG[p.metodo_pagamento];
                  const StIcon = st.icon;
                  const isOverdue = p.status === 'vencido';

                  return (
                    <tr key={p.id} className={`hover:bg-gray-50/50 transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                        >
                          <StIcon size={12} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-gray-800">{p.fornecedor}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 line-clamp-1">{p.descricao || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                          {formatCurrency(p.valor)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                          {formatDate(p.vencimento)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {mt && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: mt.color + '15', color: mt.color }}>
                            {mt.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{p.nota_fiscal || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {p.status !== 'pago' && (
                            <button
                              onClick={() => handleMarkPago(p)}
                              className="w-7 h-7 rounded-lg bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors"
                              title="Marcar como Pago"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(p)}
                            className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-purple-100 hover:text-purple-600 transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(p.id)}
                            className="w-7 h-7 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer */}
        {filtered.length > 0 && (
          <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">{filtered.length} pagamento{filtered.length !== 1 ? 's' : ''}</span>
            <span className="text-sm font-bold text-gray-700">
              Total: {formatCurrency(filtered.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0))}
            </span>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <AlertTriangle size={40} className="text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 text-center mb-2">Excluir Pagamento?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">Esta acao nao pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? 'Editar Pagamento' : 'Novo Pagamento'}
              </h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Fornecedor */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fornecedor *</label>
                <input
                  type="text"
                  value={formData.fornecedor}
                  onChange={e => setFormData(prev => ({ ...prev, fornecedor: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                  placeholder="Nome do fornecedor"
                  list="fornecedores-list"
                />
                <datalist id="fornecedores-list">
                  {fornecedores.map(f => <option key={f} value={f} />)}
                </datalist>
              </div>

              {/* Descricao */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Descricao</label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={e => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                  placeholder="Ex: Pedido de 500 potes vidro"
                />
              </div>

              {/* Valor + Vencimento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={e => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Vencimento *</label>
                  <input
                    type="date"
                    value={formData.vencimento}
                    onChange={e => setFormData(prev => ({ ...prev, vencimento: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                  />
                </div>
              </div>

              {/* Status + Metodo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Metodo de Pagamento</label>
                  <select
                    value={formData.metodo_pagamento}
                    onChange={e => setFormData(prev => ({ ...prev, metodo_pagamento: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                  >
                    {Object.entries(METODO_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data Pagamento (se pago) */}
              {(formData.status === 'pago' || formData.status === 'parcial') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Data do Pagamento</label>
                  <input
                    type="date"
                    value={formData.data_pagamento}
                    onChange={e => setFormData(prev => ({ ...prev, data_pagamento: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                  />
                </div>
              )}

              {/* NF + Pedido Ref */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nota Fiscal</label>
                  <input
                    type="text"
                    value={formData.nota_fiscal}
                    onChange={e => setFormData(prev => ({ ...prev, nota_fiscal: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                    placeholder="NF-00000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pedido Ref</label>
                  <input
                    type="text"
                    value={formData.pedido_ref}
                    onChange={e => setFormData(prev => ({ ...prev, pedido_ref: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                    placeholder="PO-00000"
                  />
                </div>
              </div>

              {/* Observacoes */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Observacoes</label>
                <textarea
                  value={formData.observacoes}
                  onChange={e => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 resize-none"
                  rows={3}
                  placeholder="Notas adicionais..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.fornecedor || !formData.valor || !formData.vencimento || saving}
                className="flex-1 px-4 py-2.5 bg-[#6B1B8E] text-white rounded-xl hover:bg-[#5a1578] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlePagamentosView;
