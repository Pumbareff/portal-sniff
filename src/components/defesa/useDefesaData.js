import { useState, useEffect, useMemo, useCallback } from 'react';

export default function useDefesaData(supabase, user) {
  const [produtos, setProdutos] = useState([]);
  const [invasoes, setInvasoes] = useState([]);
  const [acoes, setAcoes] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [shareLinks, setShareLinks] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, iRes, aRes, nRes, sRes, lRes] = await Promise.all([
        supabase.from('defesa_produtos').select('*').order('created_at', { ascending: false }),
        supabase.from('am_defesa_catalogo').select('*').order('created_at', { ascending: false }),
        supabase.from('defesa_acoes').select('*').order('created_at', { ascending: false }),
        supabase.from('defesa_notificacoes').select('*').order('created_at', { ascending: false }),
        supabase.from('defesa_share_links').select('*').order('created_at', { ascending: false }),
        supabase.from('defesa_activity_log').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      setProdutos(pRes.data || []);
      setInvasoes(iRes.data || []);
      setAcoes(aRes.data || []);
      setNotificacoes(nRes.data || []);
      setShareLinks(sRes.data || []);
      setActivityLog(lRes.data || []);
    } catch (e) {
      console.error('useDefesaData load error:', e);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  // KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    const h24 = new Date(now - 24 * 60 * 60 * 1000);
    return {
      totalProdutos: produtos.length,
      comInvasores: produtos.filter(p => (p.invasores_count || 0) > 0).length,
      novasInvasoes24h: invasoes.filter(i => new Date(i.created_at) > h24).length,
      acoesPendentes: acoes.filter(a => a.status === 'pendente').length,
      invasoresAtivos: invasoes.filter(i => i.status === 'pendente' || i.status === 'denunciado').length,
      invasoresResolvidos: invasoes.filter(i => i.status === 'resolvido').length,
      invasoresNovos: invasoes.filter(i => new Date(i.created_at) > h24).length,
      invasoresRecorrentes: invasoes.filter(i => i.reincidente).length,
      notifNaoLidas: notificacoes.filter(n => !n.lida).length,
    };
  }, [produtos, invasoes, acoes, notificacoes]);

  // Mutations
  const addProduto = async (prod) => {
    const { data } = await supabase.from('defesa_produtos').insert([{ ...prod, user_id: user?.id }]).select();
    if (data) { setProdutos(prev => [data[0], ...prev]); await logActivity(user?.email || 'Sistema', `Adicionou produto '${prod.nome}'`); }
    return data;
  };

  const updateProduto = async (id, updates) => {
    const { data } = await supabase.from('defesa_produtos').update(updates).eq('id', id).select();
    if (data) setProdutos(prev => prev.map(p => p.id === id ? data[0] : p));
    return data;
  };

  const deleteProduto = async (id) => {
    const prod = produtos.find(p => p.id === id);
    await supabase.from('defesa_produtos').delete().eq('id', id);
    setProdutos(prev => prev.filter(p => p.id !== id));
    if (prod) await logActivity(user?.email || 'Sistema', `Removeu produto '${prod.nome}'`);
  };

  const addInvasao = async (inv) => {
    const { data } = await supabase.from('am_defesa_catalogo').insert([{ ...inv, user_id: user?.id }]).select();
    if (data) { setInvasoes(prev => [data[0], ...prev]); await logActivity(user?.email || 'Sistema', `Registrou invasao para '${inv.produto_nome}'`); }
    return data;
  };

  const updateInvasaoStatus = async (id, newStatus) => {
    await supabase.from('am_defesa_catalogo').update({ status: newStatus }).eq('id', id);
    setInvasoes(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
  };

  const addAcao = async (acao) => {
    const { data } = await supabase.from('defesa_acoes').insert([{ ...acao, user_id: user?.id }]).select();
    if (data) { setAcoes(prev => [data[0], ...prev]); await logActivity(user?.email || 'Sistema', `Criou acao '${acao.titulo}'`); }
    return data;
  };

  const updateAcaoStatus = async (id, newStatus) => {
    const { data } = await supabase.from('defesa_acoes').update({ status: newStatus }).eq('id', id).select();
    if (data) {
      setAcoes(prev => prev.map(a => a.id === id ? data[0] : a));
      await logActivity(user?.email || 'Sistema', `Atualizou status da acao para '${newStatus}'`);
    }
  };

  const markNotifRead = async (id) => {
    await supabase.from('defesa_notificacoes').update({ lida: true }).eq('id', id);
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  const addShareLink = async () => {
    const code = 'gc-view-' + Math.random().toString(36).substring(2, 8);
    const expires = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase.from('defesa_share_links').insert([{ code, status: 'ativo', expires_at: expires, user_id: user?.id }]).select();
    if (data) { setShareLinks(prev => [data[0], ...prev]); await logActivity(user?.email || 'Sistema', 'Gerou link de compartilhamento para visualizador'); }
    return data;
  };

  const revokeShareLink = async (id) => {
    await supabase.from('defesa_share_links').update({ status: 'revogado' }).eq('id', id);
    setShareLinks(prev => prev.map(l => l.id === id ? { ...l, status: 'revogado' } : l));
  };

  const logActivity = async (userName, action, detail) => {
    const { data } = await supabase.from('defesa_activity_log').insert([{ user_name: userName, action, detail }]).select();
    if (data) setActivityLog(prev => [data[0], ...prev]);
  };

  return {
    produtos, invasoes, acoes, notificacoes, shareLinks, activityLog, loading, kpis,
    addProduto, updateProduto, deleteProduto,
    addInvasao, updateInvasaoStatus,
    addAcao, updateAcaoStatus,
    markNotifRead, addShareLink, revokeShareLink, logActivity,
    reload: load,
  };
}
