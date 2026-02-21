import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import {
  AlertCircle, Search, ShieldCheck, AlertTriangle, Send, Eye, BarChart3, Award,
  Plus, X, Edit2, Trash2, UserCheck, CheckCircle2, Clock, DollarSign, ArrowRight
} from 'lucide-react';

const COLUMNS = [
  { id: 'parado', label: 'Produtos Parados', headerBg: 'bg-red-500', bgColor: 'bg-red-50', borderColor: 'border-red-400', textColor: 'text-red-700', icon: AlertCircle, desc: 'Sem vendas 30-90 dias | < 50 un' },
  { id: 'analise_mercado', label: 'Analise Mercado', headerBg: 'bg-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-400', textColor: 'text-blue-700', icon: Search, desc: 'Performance nos marketplaces' },
  { id: 'padrao_sniff', label: 'Padrao Sniff', headerBg: 'bg-purple-500', bgColor: 'bg-purple-50', borderColor: 'border-purple-400', textColor: 'text-purple-700', icon: ShieldCheck, desc: 'Re-analise e reformulacao' },
  { id: 'queima_reintroducao', label: 'Queima / Reintro', headerBg: 'bg-orange-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-400', textColor: 'text-orange-700', icon: AlertTriangle, desc: 'Decidir destino do produto' },
  { id: 'acao', label: 'Acao', headerBg: 'bg-indigo-500', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-400', textColor: 'text-indigo-700', icon: Send, desc: 'Executando estrategia' },
  { id: 'acompanhamento', label: 'Acompanhamento', headerBg: 'bg-cyan-500', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-400', textColor: 'text-cyan-700', icon: Eye, desc: 'Monitorando acoes' },
  { id: 'performance', label: 'Performance', headerBg: 'bg-teal-500', bgColor: 'bg-teal-50', borderColor: 'border-teal-400', textColor: 'text-teal-700', icon: BarChart3, desc: 'Semanas 1, 2, 3, 4' },
  { id: 'resultado', label: 'Resultado', headerBg: 'bg-emerald-500', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-400', textColor: 'text-emerald-700', icon: Award, desc: 'Vendas e retorno financeiro' },
];

const MARKETPLACES = [
  { id: 'ml', label: 'ML' }, { id: 'shopee', label: 'Shopee' }, { id: 'amazon', label: 'Amazon' },
  { id: 'tiktok', label: 'TikTok' }, { id: 'temu', label: 'Temu' }, { id: 'magalu', label: 'Magalu' },
];

const TIPOS_ACAO = [
  { id: 'full', label: 'Enviar ao FULL' }, { id: 'catalogo', label: 'Criar Catalogo' },
  { id: 'ads', label: 'Campanha ADS' }, { id: 'clips', label: 'Criar Clips/Video' },
  { id: 'preco', label: 'Baixar Preco' }, { id: 'marketplace_novo', label: 'Novo Marketplace' },
  { id: 'kit', label: 'Combo/Kit' },
];

const getKanbanCol = (status) => {
  if (status === 'em_analise') return 'parado';
  if (status === 'em_acao') return 'acao';
  if (status === 'resolvido') return 'resultado';
  return COLUMNS.find(c => c.id === status) ? status : 'parado';
};

const daysAgo = (d) => d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : null;

const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#6B1B8E]/20 focus:border-[#6B1B8E]';

export default function GestaoKanbanView() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [showSync, setShowSync] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncCandidates, setSyncCandidates] = useState([]);
  const [selectedSkus, setSelectedSkus] = useState(new Set());
  const [syncDays, setSyncDays] = useState(90);
  const [syncMeta, setSyncMeta] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  const empty = () => ({
    sku: '', produto: '', giro_mensal: '', estoque_atual: '', data_compra: '',
    estrategia: '', acao: '', semana_1: '', semana_2: '', semana_3: '', semana_4: '',
    responsavel: '', status: 'parado', observacoes: '',
    skus_relacionados: '', data_inicio_analise: new Date().toISOString().split('T')[0],
    mp_ml: false, mp_shopee: false, mp_amazon: false, mp_tiktok: false, mp_temu: false, mp_magalu: false,
    tem_boa_performance: null,
    ref_titulo: false, ref_fotos: false, ref_descricao: false, ref_categorias: false,
    est_catalogo: false, est_ads: false, est_clips: false,
    tipos_acao: [], acoes_realizadas: {},
    receita: '', custo: '', unidades_vendidas: '',
  });
  const [formData, setFormData] = useState(empty());

  // --- Helpers ---
  const F = (field) => (val) => setFormData(prev => ({ ...prev, [field]: val }));
  const toggleF = (field) => () => setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  const toggleTipoAcao = (id) => setFormData(prev => {
    const arr = prev.tipos_acao.includes(id) ? prev.tipos_acao.filter(x => x !== id) : [...prev.tipos_acao, id];
    return { ...prev, tipos_acao: arr };
  });

  // --- Metadata ---
  const buildMeta = (fd, prev = {}) => ({
    skus_relacionados: fd.skus_relacionados || null,
    data_inicio_analise: fd.data_inicio_analise || null,
    marketplace: { ml: fd.mp_ml, shopee: fd.mp_shopee, amazon: fd.mp_amazon, tiktok: fd.mp_tiktok, temu: fd.mp_temu, magalu: fd.mp_magalu },
    tem_boa_performance: fd.tem_boa_performance,
    reformulacao: { titulo: fd.ref_titulo, fotos: fd.ref_fotos, descricao: fd.ref_descricao, categorias: fd.ref_categorias },
    estrategias_reform: { catalogo: fd.est_catalogo, ads: fd.est_ads, clips: fd.est_clips },
    tipos_acao: fd.tipos_acao || [],
    acoes_realizadas: fd.acoes_realizadas || {},
    financeiro: { receita: Number(fd.receita) || 0, custo: Number(fd.custo) || 0, unidades: Number(fd.unidades_vendidas) || 0 },
    timestamps: { ...(prev.timestamps || {}), [fd.status]: new Date().toISOString() },
  });

  const unpackMeta = (p) => {
    const m = p.metadata || {};
    return {
      skus_relacionados: m.skus_relacionados || '',
      data_inicio_analise: m.data_inicio_analise || '',
      mp_ml: m.marketplace?.ml || false, mp_shopee: m.marketplace?.shopee || false,
      mp_amazon: m.marketplace?.amazon || false, mp_tiktok: m.marketplace?.tiktok || false,
      mp_temu: m.marketplace?.temu || false, mp_magalu: m.marketplace?.magalu || false,
      tem_boa_performance: m.tem_boa_performance ?? null,
      ref_titulo: m.reformulacao?.titulo || false, ref_fotos: m.reformulacao?.fotos || false,
      ref_descricao: m.reformulacao?.descricao || false, ref_categorias: m.reformulacao?.categorias || false,
      est_catalogo: m.estrategias_reform?.catalogo || false, est_ads: m.estrategias_reform?.ads || false,
      est_clips: m.estrategias_reform?.clips || false,
      tipos_acao: m.tipos_acao || [], acoes_realizadas: m.acoes_realizadas || {},
      receita: m.financeiro?.receita || '', custo: m.financeiro?.custo || '',
      unidades_vendidas: m.financeiro?.unidades || '',
    };
  };

  // --- Data ---
  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('gestao_produtos_parados').select('*').order('created_at', { ascending: false });
      if (data) setProducts(data);
    } catch (e) { console.error('Kanban fetch:', e); }
    setLoading(false);
  };

  const grouped = useMemo(() => {
    const g = {};
    COLUMNS.forEach(c => { g[c.id] = []; });
    products.forEach(p => { const c = getKanbanCol(p.status); if (g[c]) g[c].push(p); });
    return g;
  }, [products]);

  const stats = {
    total: products.length,
    em_analise: products.filter(p => ['parado', 'analise_mercado', 'padrao_sniff', 'em_analise'].includes(p.status)).length,
    em_acao: products.filter(p => ['queima_reintroducao', 'acao', 'acompanhamento', 'performance', 'em_acao'].includes(p.status)).length,
    resolvido: products.filter(p => ['resultado', 'resolvido'].includes(p.status)).length,
  };

  // --- CRUD ---
  const save = async () => {
    const meta = buildMeta(formData, editingProduct?.metadata || {});
    const payload = {
      sku: formData.sku, produto: formData.produto,
      giro_mensal: Number(formData.giro_mensal) || 0, estoque_atual: Number(formData.estoque_atual) || 0,
      data_compra: formData.data_compra || null,
      estrategia: formData.estrategia || null, acao: formData.acao || null,
      semana_1: formData.semana_1 || null, semana_2: formData.semana_2 || null,
      semana_3: formData.semana_3 || null, semana_4: formData.semana_4 || null,
      responsavel: formData.responsavel || null, status: formData.status,
      observacoes: formData.observacoes || null, metadata: meta,
      updated_at: new Date().toISOString(),
    };
    try {
      if (editingProduct) {
        const { data } = await supabase.from('gestao_produtos_parados').update(payload).eq('id', editingProduct.id).select();
        if (data) setProducts(prev => prev.map(p => p.id === editingProduct.id ? data[0] : p));
      } else {
        const { data } = await supabase.from('gestao_produtos_parados').insert(payload).select();
        if (data) setProducts(prev => [data[0], ...prev]);
      }
    } catch (e) { console.error('Save error:', e); }
    setShowForm(false); setEditingProduct(null); setFormData(empty());
  };

  const editProduct = (p) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku || '', produto: p.produto || '', giro_mensal: p.giro_mensal || '',
      estoque_atual: p.estoque_atual || '', data_compra: p.data_compra || '',
      estrategia: p.estrategia || '', acao: p.acao || '',
      semana_1: p.semana_1 || '', semana_2: p.semana_2 || '',
      semana_3: p.semana_3 || '', semana_4: p.semana_4 || '',
      responsavel: p.responsavel || '', status: getKanbanCol(p.status),
      observacoes: p.observacoes || '', ...unpackMeta(p),
    });
    setShowForm(true);
  };

  const del = async (id) => {
    if (!confirm('Remover este produto do kanban?')) return;
    await supabase.from('gestao_produtos_parados').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // --- Move / Drag ---
  const moveTo = async (product, colId) => {
    const prev = product.metadata || {};
    const ts = { ...(prev.timestamps || {}), [colId]: new Date().toISOString() };
    const meta = { ...prev, timestamps: ts };
    try {
      const { data } = await supabase.from('gestao_produtos_parados')
        .update({ status: colId, metadata: meta, updated_at: new Date().toISOString() })
        .eq('id', product.id).select();
      if (data) setProducts(ps => ps.map(p => p.id === product.id ? data[0] : p));
    } catch (e) { console.error('Move error:', e); }
  };

  const dragStart = (e, p) => { setDraggedItem(p); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', p.id); };
  const dragOver = (e, c) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverCol(c); };
  const dragLeave = () => setDragOverCol(null);
  const drop = async (e, colId) => {
    e.preventDefault(); setDragOverCol(null);
    if (!draggedItem || getKanbanCol(draggedItem.status) === colId) { setDraggedItem(null); return; }
    await moveTo(draggedItem, colId);
    setDraggedItem(null);
  };

  // --- Toggle action done ---
  const toggleAcao = async (product, acaoId) => {
    const prev = product.metadata || {};
    const acoes = { ...(prev.acoes_realizadas || {}) };
    acoes[acaoId] = !acoes[acaoId];
    const meta = { ...prev, acoes_realizadas: acoes };
    try {
      const { data } = await supabase.from('gestao_produtos_parados')
        .update({ metadata: meta, updated_at: new Date().toISOString() })
        .eq('id', product.id).select();
      if (data) setProducts(ps => ps.map(p => p.id === product.id ? data[0] : p));
    } catch (e) { console.error('Toggle error:', e); }
  };

  // --- BaseLinker Sync ---
  const existingSkus = useMemo(() => new Set(products.map(p => (p.sku || '').trim().toUpperCase())), [products]);

  const runSync = async () => {
    setSyncLoading(true);
    setSyncCandidates([]);
    setSelectedSkus(new Set());
    setSyncMeta(null);
    try {
      const resp = await fetch(`/api/baselinker/stagnant-products?days=${syncDays}&max_stock=9999`);
      const data = await resp.json();
      if (data.success) {
        setSyncCandidates(data.candidates || []);
        setSyncMeta(data.meta || null);
        // Auto-select candidates NOT already in kanban
        const autoSelect = new Set();
        (data.candidates || []).forEach(c => {
          if (!existingSkus.has((c.sku || '').toUpperCase())) autoSelect.add(c.sku);
        });
        setSelectedSkus(autoSelect);
      } else {
        alert('Erro: ' + (data.error || 'Falha ao buscar dados'));
      }
    } catch (e) {
      alert('Erro de conexao: ' + e.message);
    }
    setSyncLoading(false);
  };

  const toggleSku = (sku) => setSelectedSkus(prev => {
    const next = new Set(prev);
    next.has(sku) ? next.delete(sku) : next.add(sku);
    return next;
  });

  const toggleAllNew = () => {
    const newSkus = syncCandidates.filter(c => !existingSkus.has((c.sku || '').toUpperCase())).map(c => c.sku);
    const allSelected = newSkus.every(s => selectedSkus.has(s));
    setSelectedSkus(allSelected ? new Set() : new Set(newSkus));
  };

  const importSelected = async () => {
    const toImport = syncCandidates.filter(c => selectedSkus.has(c.sku) && !existingSkus.has((c.sku || '').toUpperCase()));
    if (toImport.length === 0) return;
    setImportLoading(true);
    try {
      const rows = toImport.map(c => ({
        sku: c.sku,
        produto: c.name,
        estoque_atual: c.stock,
        giro_mensal: c.giroMensal,
        status: 'parado',
        metadata: {
          skus_relacionados: c.relatedSkus.length > 0 ? c.relatedSkus.join(', ') : null,
          data_inicio_analise: new Date().toISOString().split('T')[0],
          timestamps: { parado: new Date().toISOString() },
          source: 'baselinker_sync',
          projecao_meses: c.projecaoMeses,
          preco: c.price,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      const { data, error } = await supabase.from('gestao_produtos_parados').insert(rows).select();
      if (error) throw error;
      if (data) setProducts(prev => [...data, ...prev]);
      setShowSync(false);
      setSyncCandidates([]);
    } catch (e) {
      alert('Erro ao importar: ' + e.message);
    }
    setImportLoading(false);
  };

  // --- Card Renderer ---
  const renderCard = (item, colId) => {
    const m = item.metadata || {};
    const estoque = Number(item.estoque_atual) || 0;
    const giro = Number(item.giro_mensal) || 0;
    const projecao = giro > 0 ? Math.round(estoque / giro * 10) / 10 : 0;
    const vendas = [item.semana_1, item.semana_2, item.semana_3, item.semana_4].map(s => Number(s) || 0);
    const totalVendido = vendas.reduce((a, b) => a + b, 0);
    const semanasOk = vendas.filter(v => v > 0).length;
    const colTs = m.timestamps?.[colId];
    const dias = daysAgo(colTs);
    const diasInicio = daysAgo(m.data_inicio_analise);
    const mp = m.marketplace || {};
    const mpAtivos = MARKETPLACES.filter(x => mp[x.id]);
    const tiposAtivos = (m.tipos_acao || []).map(id => TIPOS_ACAO.find(t => t.id === id)).filter(Boolean);
    const acoesStatus = m.acoes_realizadas || {};
    const fin = m.financeiro || {};
    const roi = fin.custo > 0 ? Math.round((fin.receita - fin.custo) / fin.custo * 100) : 0;

    return (
      <div key={item.id} draggable onDragStart={(e) => dragStart(e, item)}
        className={`bg-white rounded-lg border border-gray-100 p-2.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${draggedItem?.id === item.id ? 'opacity-40 scale-95' : ''}`}>

        {/* Header */}
        <div className="flex items-start justify-between mb-1.5">
          <span className="font-mono text-[11px] font-bold text-[#6B1B8E] bg-purple-50 px-2 py-0.5 rounded">{item.sku}</span>
          <div className="flex gap-0.5">
            <button onClick={() => editProduct(item)} className="p-1 text-blue-400 hover:bg-blue-50 rounded"><Edit2 size={11} /></button>
            <button onClick={() => del(item.id)} className="p-1 text-red-300 hover:bg-red-50 rounded"><Trash2 size={11} /></button>
          </div>
        </div>

        {item.produto && <p className="text-[11px] font-medium text-gray-700 mb-1.5 leading-tight line-clamp-2">{item.produto}</p>}
        {m.skus_relacionados && <p className="text-[9px] text-purple-500 mb-1">SKUs: {m.skus_relacionados}</p>}

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-1 text-[10px] mb-1.5">
          <div className="bg-gray-50 rounded px-1.5 py-1">
            <span className="text-gray-400 block">Estoque</span>
            <span className={`font-bold ${estoque < 50 ? 'text-red-600' : 'text-gray-700'}`}>{estoque} un</span>
          </div>
          <div className="bg-gray-50 rounded px-1.5 py-1">
            <span className="text-gray-400 block">Giro</span>
            <span className="font-bold text-gray-700">{giro} /mes</span>
          </div>
        </div>

        {/* Projecao */}
        {projecao > 0 && ['parado', 'analise_mercado', 'padrao_sniff'].includes(colId) && (
          <div className={`text-[10px] font-bold px-2 py-1 rounded text-center mb-1.5 ${projecao > 12 ? 'bg-red-50 text-red-600' : projecao > 6 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
            {projecao} meses para zerar
          </div>
        )}

        {/* === COLUMN-SPECIFIC CONTENT === */}

        {/* analise_mercado: marketplace pills + routing buttons */}
        {colId === 'analise_mercado' && (
          <>
            {mpAtivos.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                {mpAtivos.map(x => <span key={x.id} className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">{x.label}</span>)}
              </div>
            )}
            {m.tem_boa_performance !== null && (
              <div className={`text-[10px] font-bold px-2 py-0.5 rounded text-center mb-1.5 ${m.tem_boa_performance ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {m.tem_boa_performance ? 'Boa Performance' : 'Sem Performance'}
              </div>
            )}
            <div className="flex gap-1 mt-1">
              <button onClick={() => moveTo(item, 'padrao_sniff')}
                className="flex-1 text-[9px] py-1.5 rounded bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 flex items-center justify-center gap-0.5">
                <CheckCircle2 size={10} /> Padrao <ArrowRight size={8} />
              </button>
              <button onClick={() => moveTo(item, 'queima_reintroducao')}
                className="flex-1 text-[9px] py-1.5 rounded bg-red-100 text-red-700 font-bold hover:bg-red-200 flex items-center justify-center gap-0.5">
                Queima <ArrowRight size={8} />
              </button>
            </div>
          </>
        )}

        {/* padrao_sniff: reformulacao checklist + strategy tags */}
        {colId === 'padrao_sniff' && (
          <div className="space-y-1 mb-1.5">
            {[{ k: 'titulo', l: 'Titulo' }, { k: 'fotos', l: 'Fotos' }, { k: 'descricao', l: 'Descricao' }, { k: 'categorias', l: 'Categorias' }]
              .filter(x => m.reformulacao?.[x.k])
              .map(x => <div key={x.k} className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-medium">Reformular: {x.l}</div>)}
            <div className="flex flex-wrap gap-1">
              {m.estrategias_reform?.catalogo && <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">Catalogo</span>}
              {m.estrategias_reform?.ads && <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">ADS</span>}
              {m.estrategias_reform?.clips && <span className="text-[9px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full">Clips</span>}
            </div>
          </div>
        )}

        {/* queima_reintroducao: estrategia badge */}
        {colId === 'queima_reintroducao' && item.estrategia && (
          <div className={`text-[10px] font-medium px-2 py-1 rounded-full text-center mb-1.5 ${item.estrategia === 'queima' ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700'}`}>
            {item.estrategia === 'queima' ? 'Queima' : 'Reintroducao'}
          </div>
        )}

        {/* acao: tipo acao pills + text */}
        {colId === 'acao' && (
          <>
            {tiposAtivos.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                {tiposAtivos.map(t => <span key={t.id} className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">{t.label}</span>)}
              </div>
            )}
            {item.acao && <div className="text-[10px] text-blue-600 bg-blue-50 rounded px-2 py-1 mb-1.5 line-clamp-2">{item.acao}</div>}
          </>
        )}

        {/* acompanhamento: action status checkboxes */}
        {colId === 'acompanhamento' && tiposAtivos.length > 0 && (
          <div className="space-y-1 mb-1.5">
            {tiposAtivos.map(t => {
              const done = acoesStatus[t.id];
              return (
                <button key={t.id} onClick={() => toggleAcao(item, t.id)}
                  className={`w-full flex items-center gap-1.5 text-[10px] px-2 py-1 rounded transition-all ${done ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                  {done ? <CheckCircle2 size={11} className="text-green-500" /> : <div className="w-[11px] h-[11px] rounded-full border-2 border-gray-300" />}
                  <span className={done ? 'line-through' : ''}>{t.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* performance/resultado: weekly bars */}
        {['performance', 'resultado'].includes(colId) && totalVendido > 0 && (
          <div className="mb-1.5">
            <div className="grid grid-cols-4 gap-0.5">
              {vendas.map((v, i) => (
                <div key={i} className={`text-center rounded py-0.5 text-[9px] ${v > 0 ? 'bg-green-100 text-green-700 font-bold' : 'bg-gray-50 text-gray-300'}`}>
                  S{i + 1}: {v}
                </div>
              ))}
            </div>
            <p className="text-[9px] text-green-600 font-semibold mt-0.5 text-center">{totalVendido} vendidos em {semanasOk}sem</p>
          </div>
        )}

        {/* resultado: financial summary */}
        {colId === 'resultado' && (fin.receita > 0 || fin.custo > 0) && (
          <div className="bg-emerald-50 rounded p-1.5 mb-1.5 text-[10px]">
            <div className="flex justify-between"><span className="text-gray-500">Receita</span><span className="font-bold text-emerald-700">R$ {Number(fin.receita || 0).toLocaleString('pt-BR')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Custo</span><span className="font-bold text-red-500">R$ {Number(fin.custo || 0).toLocaleString('pt-BR')}</span></div>
            {fin.unidades > 0 && <div className="flex justify-between"><span className="text-gray-500">Vendidos</span><span className="font-bold">{fin.unidades} un</span></div>}
            {fin.custo > 0 && <div className="flex justify-between border-t border-emerald-200 mt-1 pt-1"><span className="text-gray-500">ROI</span><span className={`font-bold ${roi > 0 ? 'text-emerald-700' : 'text-red-600'}`}>{roi}%</span></div>}
          </div>
        )}

        {/* Estrategia badge (later columns) */}
        {!['parado', 'analise_mercado', 'padrao_sniff', 'queima_reintroducao'].includes(colId) && item.estrategia && (
          <div className={`text-[9px] font-medium px-2 py-0.5 rounded-full text-center mb-1 ${item.estrategia === 'queima' ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700'}`}>
            {item.estrategia === 'queima' ? 'Queima' : 'Reintroducao'}
          </div>
        )}

        {item.responsavel && (
          <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1"><UserCheck size={10} /> {item.responsavel}</div>
        )}

        {/* Timestamps */}
        <div className="flex items-center gap-1 text-[9px] text-gray-300 mt-1 pt-1 border-t border-gray-50">
          <Clock size={9} />
          {diasInicio !== null && <span>Inicio: {diasInicio}d</span>}
          {dias !== null && <span className="ml-auto">Nesta etapa: {dias}d</span>}
        </div>
      </div>
    );
  };

  // ====================== RENDER ======================
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kanban - Produtos Parados</h2>
          <p className="text-sm text-gray-500 mt-1">Gestao visual do fluxo de produtos com baixo giro ou parados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowSync(true); setSyncCandidates([]); setSyncMeta(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            <ArrowRight size={14} /> Sync BaseLinker
          </button>
          <button onClick={() => { setEditingProduct(null); setFormData(empty()); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#6B1B8E] text-white rounded-lg hover:bg-[#5a1678]">
            <Plus size={16} /> Adicionar Produto
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-gray-200 bg-white shadow-sm">
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Parados / Baixo Giro</p>
        </div>
        <div className="p-3 rounded-xl border border-yellow-200 bg-yellow-50 shadow-sm">
          <p className="text-2xl font-bold text-yellow-600">{stats.em_analise}</p>
          <p className="text-xs text-gray-500">Em Analise</p>
        </div>
        <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{stats.em_acao}</p>
          <p className="text-xs text-gray-500">Em Acao</p>
        </div>
        <div className="p-3 rounded-xl border border-green-200 bg-green-50 shadow-sm">
          <p className="text-2xl font-bold text-green-600">{stats.resolvido}</p>
          <p className="text-xs text-gray-500">Resolvidos</p>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#6B1B8E] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto pb-4 -mx-2 px-2">
          <div className="flex gap-3" style={{ minWidth: COLUMNS.length * 250 }}>
            {COLUMNS.map(col => {
              const items = grouped[col.id] || [];
              const ColIcon = col.icon;
              const isDropTarget = dragOverCol === col.id;
              return (
                <div key={col.id}
                  className={`flex-1 min-w-[230px] max-w-[280px] rounded-xl border-2 transition-all duration-200 ${isDropTarget ? `${col.borderColor} shadow-lg scale-[1.02]` : 'border-gray-200'} bg-gray-50/50`}
                  onDragOver={(e) => dragOver(e, col.id)}
                  onDragLeave={dragLeave}
                  onDrop={(e) => drop(e, col.id)}>
                  {/* Column Header */}
                  <div className={`${col.headerBg} text-white p-3 rounded-t-[10px]`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ColIcon size={15} />
                        <span className="text-xs font-bold leading-tight">{col.label}</span>
                      </div>
                      <span className="bg-white/25 text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center">{items.length}</span>
                    </div>
                    <p className="text-[10px] mt-1 opacity-80 leading-tight">{col.desc}</p>
                  </div>
                  {/* Column Body */}
                  <div className="p-2 space-y-2 min-h-[200px] max-h-[60vh] overflow-y-auto">
                    {items.length === 0 ? (
                      <div className="text-center py-10 text-gray-300">
                        <ColIcon size={28} className="mx-auto mb-2 opacity-40" />
                        <p className="text-[10px]">Arraste cards aqui</p>
                      </div>
                    ) : items.map(item => renderCard(item, col.id))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================== FORM MODAL ====================== */}
      {/* ====================== SYNC MODAL ====================== */}
      {showSync && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Sincronizar BaseLinker</h3>
                <p className="text-xs text-gray-500 mt-0.5">Busca produtos com baixo giro no inventario e cruza com pedidos</p>
              </div>
              <button onClick={() => setShowSync(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>

            <div className="p-5 border-b border-gray-100 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600">Periodo:</label>
                <select value={syncDays} onChange={e => setSyncDays(Number(e.target.value))}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
                  <option value={30}>30 dias</option>
                  <option value={60}>60 dias</option>
                  <option value={90}>90 dias</option>
                </select>
              </div>
              <button onClick={runSync} disabled={syncLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50">
                {syncLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search size={14} />}
                {syncLoading ? 'Buscando...' : 'Buscar Produtos'}
              </button>
              {syncMeta && (
                <div className="flex gap-3 text-[11px] text-gray-500 ml-auto">
                  <span>{syncMeta.totalProducts} produtos</span>
                  <span>{syncMeta.totalOrders} pedidos</span>
                  <span className="font-bold text-blue-600">{syncMeta.totalCandidates} candidatos</span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {syncCandidates.length === 0 && !syncLoading && (
                <div className="text-center py-16 text-gray-400">
                  <Search size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Clique "Buscar Produtos" para analisar o inventario</p>
                </div>
              )}
              {syncCandidates.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button onClick={toggleAllNew} className="px-3 py-1 border border-gray-200 rounded text-xs hover:bg-gray-50">
                        {syncCandidates.filter(c => !existingSkus.has((c.sku||'').toUpperCase())).every(c => selectedSkus.has(c.sku)) ? 'Desmarcar Todos' : 'Selecionar Todos Novos'}
                      </button>
                      <span className="text-xs text-gray-500">
                        {selectedSkus.size} selecionados | {syncCandidates.filter(c => existingSkus.has((c.sku||'').toUpperCase())).length} ja no kanban
                      </span>
                    </div>
                    <button onClick={importSelected}
                      disabled={importLoading || selectedSkus.size === 0}
                      className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50">
                      {importLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={14} />}
                      Importar {selectedSkus.size} Produtos
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="p-2 w-10"></th>
                          <th className="p-2 text-left">SKU</th>
                          <th className="p-2 text-left">Produto</th>
                          <th className="p-2 text-right">Estoque</th>
                          <th className="p-2 text-right">Vendidos ({syncDays}d)</th>
                          <th className="p-2 text-right">Giro/mes</th>
                          <th className="p-2 text-right">Projecao</th>
                          <th className="p-2 text-left">SKUs Relacionados</th>
                          <th className="p-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {syncCandidates.map(c => {
                          const inKanban = existingSkus.has((c.sku || '').toUpperCase());
                          const selected = selectedSkus.has(c.sku);
                          return (
                            <tr key={c.sku} className={`border-t border-gray-100 ${inKanban ? 'bg-gray-50 opacity-60' : selected ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                              <td className="p-2 text-center">
                                {inKanban ? (
                                  <CheckCircle2 size={14} className="text-green-400 mx-auto" />
                                ) : (
                                  <input type="checkbox" checked={selected} onChange={() => toggleSku(c.sku)}
                                    className="w-4 h-4 text-blue-600 rounded" />
                                )}
                              </td>
                              <td className="p-2 font-mono text-xs font-bold text-[#6B1B8E]">{c.sku}</td>
                              <td className="p-2 text-xs text-gray-700 max-w-[200px] truncate">{c.name}</td>
                              <td className={`p-2 text-right font-bold text-xs ${c.stock < 50 ? 'text-red-600' : 'text-gray-700'}`}>{c.stock}</td>
                              <td className={`p-2 text-right text-xs font-medium ${c.unitsSold === 0 ? 'text-red-500' : 'text-green-600'}`}>{c.unitsSold}</td>
                              <td className="p-2 text-right text-xs text-gray-600">{c.giroMensal}</td>
                              <td className={`p-2 text-right text-xs font-bold ${c.projecaoMeses > 12 ? 'text-red-600' : c.projecaoMeses > 6 ? 'text-yellow-600' : 'text-green-600'}`}>
                                {c.projecaoMeses >= 999 ? 'Nunca' : `${c.projecaoMeses}m`}
                              </td>
                              <td className="p-2 text-[10px] text-purple-500 max-w-[120px] truncate">{c.relatedSkus.join(', ')}</td>
                              <td className="p-2 text-center">
                                {inKanban ? (
                                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">No Kanban</span>
                                ) : (
                                  <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Novo</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">{editingProduct ? 'Editar Produto' : 'Adicionar Produto ao Kanban'}</h3>
              <button onClick={() => { setShowForm(false); setEditingProduct(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-5">

              {/* 1. Kanban Stage */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Etapa no Kanban</label>
                <div className="grid grid-cols-4 gap-2">
                  {COLUMNS.map(col => {
                    const I = col.icon; const sel = formData.status === col.id;
                    return (
                      <button key={col.id} type="button" onClick={() => F('status')(col.id)}
                        className={`p-2 rounded-lg border-2 text-center transition-all text-[11px] ${sel ? `${col.borderColor} ${col.bgColor} ${col.textColor} font-bold` : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                        <I size={14} className="mx-auto mb-0.5" />
                        <p className="leading-tight">{col.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Produto */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">SKU *</label>
                  <input type="text" value={formData.sku} onChange={e => F('sku')(e.target.value)} placeholder="Ex: GL7309" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Produto</label>
                  <input type="text" value={formData.produto} onChange={e => F('produto')(e.target.value)} placeholder="Nome do produto" className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">SKUs Relacionados</label>
                  <input type="text" value={formData.skus_relacionados} onChange={e => F('skus_relacionados')(e.target.value)} placeholder="GL7309A, GL7309B" className={inp} />
                  <p className="text-[10px] text-gray-400 mt-0.5">Outros SKUs do mesmo produto (evita duplicatas)</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Data Inicio Analise</label>
                  <input type="date" value={formData.data_inicio_analise} onChange={e => F('data_inicio_analise')(e.target.value)} className={inp} />
                </div>
              </div>

              {/* 3. Metricas */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estoque Atual (un)</label>
                  <input type="number" value={formData.estoque_atual} onChange={e => F('estoque_atual')(e.target.value)} placeholder="180" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Giro Mensal (un)</label>
                  <input type="number" value={formData.giro_mensal} onChange={e => F('giro_mensal')(e.target.value)} placeholder="6" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Data Compra</label>
                  <input type="date" value={formData.data_compra} onChange={e => F('data_compra')(e.target.value)} className={inp} />
                </div>
              </div>

              {/* 4. Marketplace Checklist */}
              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                <label className="block text-xs font-semibold text-blue-700 mb-2">Marketplaces onde vende</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {MARKETPLACES.map(mp => (
                    <button key={mp.id} type="button" onClick={toggleF(`mp_${mp.id}`)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${formData[`mp_${mp.id}`] ? 'border-blue-400 bg-blue-100 text-blue-700' : 'border-gray-200 bg-white text-gray-400'}`}>
                      {mp.label}
                    </button>
                  ))}
                </div>
                <label className="block text-xs font-semibold text-blue-700 mb-2">Tem boa performance?</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => F('tem_boa_performance')(true)}
                    className={`flex-1 py-2 rounded-lg border-2 text-xs font-bold transition-all ${formData.tem_boa_performance === true ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 text-gray-400'}`}>
                    Sim - Boa Performance
                  </button>
                  <button type="button" onClick={() => F('tem_boa_performance')(false)}
                    className={`flex-1 py-2 rounded-lg border-2 text-xs font-bold transition-all ${formData.tem_boa_performance === false ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 text-gray-400'}`}>
                    Nao - Sem Performance
                  </button>
                </div>
              </div>

              {/* 5. Reformulacao */}
              <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100">
                <label className="block text-xs font-semibold text-purple-700 mb-2">Reformulacao Necessaria</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[{ k: 'ref_titulo', l: 'Titulo' }, { k: 'ref_fotos', l: 'Fotos' }, { k: 'ref_descricao', l: 'Descricao' }, { k: 'ref_categorias', l: 'Categorias' }].map(x => (
                    <button key={x.k} type="button" onClick={toggleF(x.k)}
                      className={`py-2 rounded-lg border-2 text-xs font-medium transition-all ${formData[x.k] ? 'border-purple-400 bg-purple-100 text-purple-700' : 'border-gray-200 text-gray-400'}`}>
                      {x.l}
                    </button>
                  ))}
                </div>
                <label className="block text-xs font-semibold text-purple-700 mb-2">Estrategias de Reformulacao</label>
                <div className="flex gap-2">
                  {[{ k: 'est_catalogo', l: 'Catalogo' }, { k: 'est_ads', l: 'ADS' }, { k: 'est_clips', l: 'Clips' }].map(x => (
                    <button key={x.k} type="button" onClick={toggleF(x.k)}
                      className={`flex-1 py-2 rounded-lg border-2 text-xs font-bold transition-all ${formData[x.k] ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-400'}`}>
                      {x.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Estrategia */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Estrategia</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => F('estrategia')(formData.estrategia === 'queima' ? '' : 'queima')}
                    className={`flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${formData.estrategia === 'queima' ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 text-gray-400'}`}>
                    Queima
                  </button>
                  <button type="button" onClick={() => F('estrategia')(formData.estrategia === 'reintroducao' ? '' : 'reintroducao')}
                    className={`flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${formData.estrategia === 'reintroducao' ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-400'}`}>
                    Reintroducao
                  </button>
                </div>
              </div>

              {/* 7. Acao */}
              <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                <label className="block text-xs font-semibold text-indigo-700 mb-2">Tipos de Acao</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {TIPOS_ACAO.map(t => (
                    <button key={t.id} type="button" onClick={() => toggleTipoAcao(t.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${formData.tipos_acao.includes(t.id) ? 'border-indigo-400 bg-indigo-100 text-indigo-700' : 'border-gray-200 bg-white text-gray-400'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <label className="block text-xs font-semibold text-indigo-700 mb-1">Descricao da Acao</label>
                <textarea value={formData.acao} onChange={e => F('acao')(e.target.value)} rows={2} placeholder="Ex: Enviado ao FULL, catalogo ML, campanha ads..." className={inp} />
              </div>

              {/* 8. Acompanhamento Semanal */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Acompanhamento Semanal (qtd vendida)</label>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n}>
                      <label className="block text-[10px] text-gray-500 mb-1">Semana {n}</label>
                      <input type="number" min="0" value={formData[`semana_${n}`]} onChange={e => F(`semana_${n}`)(e.target.value)} placeholder="0" className={`${inp} text-center`} />
                    </div>
                  ))}
                </div>
                {(() => {
                  const sv = [1, 2, 3, 4].map(n => Number(formData[`semana_${n}`]) || 0);
                  const tot = sv.reduce((a, b) => a + b, 0);
                  const w = sv.filter(v => v > 0).length;
                  const est = (Number(formData.estoque_atual) || 0) - tot;
                  const gM = w > 0 ? Math.round((tot / w) * 4 * 10) / 10 : Number(formData.giro_mensal) || 0;
                  const proj = gM > 0 ? Math.round(est / gM * 10) / 10 : 0;
                  return tot > 0 ? (
                    <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700 font-semibold">Vendido: {tot} un em {w} semana{w > 1 ? 's' : ''}</span>
                        <span className="text-green-600">Estoque: {est} un</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-600">Giro: {gM} un/mes</span>
                        <span className={`font-bold ${proj > 12 ? 'text-red-600' : proj > 6 ? 'text-yellow-600' : 'text-green-600'}`}>Projecao: {proj > 0 ? `${proj} meses` : '-'}</span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* 9. Resultado Financeiro */}
              <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                <label className="block text-xs font-semibold text-emerald-700 mb-2">Resultado Financeiro</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Receita (R$)</label>
                    <input type="number" value={formData.receita} onChange={e => F('receita')(e.target.value)} placeholder="0" className={inp} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Custo Acao (R$)</label>
                    <input type="number" value={formData.custo} onChange={e => F('custo')(e.target.value)} placeholder="0" className={inp} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Un. Vendidas</label>
                    <input type="number" value={formData.unidades_vendidas} onChange={e => F('unidades_vendidas')(e.target.value)} placeholder="0" className={inp} />
                  </div>
                </div>
              </div>

              {/* 10. Outros */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Responsavel</label>
                  <input type="text" value={formData.responsavel} onChange={e => F('responsavel')(e.target.value)} placeholder="Nome" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Observacoes</label>
                  <input type="text" value={formData.observacoes} onChange={e => F('observacoes')(e.target.value)} placeholder="Notas" className={inp} />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => { setShowForm(false); setEditingProduct(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={save} disabled={!formData.sku} className="px-6 py-2 bg-[#6B1B8E] text-white rounded-lg hover:bg-[#5a1678] font-medium disabled:opacity-50 disabled:cursor-not-allowed">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
