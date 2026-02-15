import React, { useState, useEffect, useMemo } from 'react';
import DefesaCatalogo from './components/defesa/DefesaCatalogo';
import {
  LayoutDashboard,
  GraduationCap,
  Package,
  Droplets,
  Users,
  BarChart3,
  Truck,
  Settings,
  LogOut,
  Plus,
  Search,
  TrendingUp,
  Award,
  CheckCircle2,
  ShieldCheck,
  Target,
  DollarSign,
  Info,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Eye,
  Calendar,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Send,
  ClipboardList,
  Download,
  UserPlus,
  Megaphone,
  CalendarDays,
  Video,
  Flag,
  ArrowRight,
  RefreshCw,
  Warehouse,
  Star,
  Camera,
  Upload,
  Compass
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { supabase } from './supabaseClient';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Cores Oficiais
const COLORS = {
  purple: '#6B1B8E',
  gold: '#F4B942',
  lightPurple: '#F3E8FF',
  darkPurple: '#4A1063'
};

// Extracted modal component - prevents parent re-render from destroying DOM/losing focus
const PEDIDO_EMPTY_ITEM = { sku: '', produto: '', quantidade: '', preco_unitario: '', peso_unitario: '' };

const NovaOrdemModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    fornecedor: '', items: [{ ...PEDIDO_EMPTY_ITEM }], prazo_entrega: '', observacoes: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({ fornecedor: '', items: [{ ...PEDIDO_EMPTY_ITEM }], prazo_entrega: '', observacoes: '' });
    }
  }, [isOpen]);

  const addItem = () => setFormData(prev => ({ ...prev, items: [...prev.items, { ...PEDIDO_EMPTY_ITEM }] }));
  const removeItem = (idx) => setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[idx] = { ...newItems[idx], [field]: value };
      return { ...prev, items: newItems };
    });
  };
  const calcTotals = (items) => {
    let valor = 0, peso = 0, qtd = 0;
    (items || []).forEach(item => {
      const q = Number(item.quantidade) || 0;
      valor += q * (Number(item.preco_unitario) || 0);
      peso += q * (Number(item.peso_unitario) || 0);
      qtd += q;
    });
    return { valor_total: valor, peso_total: peso, quantidade_total: qtd };
  };

  const handleSubmit = async () => {
    const success = await onSubmit(formData);
    if (success !== false) {
      setFormData({ fornecedor: '', items: [{ ...PEDIDO_EMPTY_ITEM }], prazo_entrega: '', observacoes: '' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-bold text-gray-800">Nova Ordem de Compra</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor *</label>
            <input type="text" value={formData.fornecedor} onChange={e => setFormData(prev => ({ ...prev, fornecedor: e.target.value }))} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200" placeholder="Nome do fornecedor" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Itens do Pedido *</label>
              <button onClick={addItem} className="flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-lg text-white" style={{ backgroundColor: COLORS.purple }}>
                <Plus size={12} /> Adicionar Item
              </button>
            </div>
            <div className="space-y-3">
              {formData.items.map((item, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-3 relative">
                  {formData.items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                  )}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">SKU</label>
                      <input type="text" value={item.sku} onChange={e => updateItem(idx, 'sku', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-200" placeholder="Ex: SNF-001" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">Produto *</label>
                      <input type="text" value={item.produto} onChange={e => updateItem(idx, 'produto', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-200" placeholder="Nome do produto" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">Qtd *</label>
                      <input type="number" value={item.quantidade} onChange={e => updateItem(idx, 'quantidade', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-200" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">Preco Unit. (R$)</label>
                      <input type="number" step="0.01" value={item.preco_unitario} onChange={e => updateItem(idx, 'preco_unitario', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-200" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">Peso Unit. (kg)</label>
                      <input type="number" step="0.01" value={item.peso_unitario} onChange={e => updateItem(idx, 'peso_unitario', e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-200" placeholder="0.00" />
                    </div>
                  </div>
                  {item.quantidade && item.preco_unitario && (
                    <p className="text-xs text-right mt-1 font-medium" style={{ color: COLORS.purple }}>
                      Subtotal: R$ {(Number(item.quantidade) * Number(item.preco_unitario)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          {(() => {
            const t = calcTotals(formData.items);
            return t.valor_total > 0 ? (
              <div className="bg-purple-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-sm">
                <div><span className="text-gray-500">Itens:</span> <span className="font-bold" style={{ color: COLORS.purple }}>{formData.items.length}</span></div>
                <div><span className="text-gray-500">Total:</span> <span className="font-bold" style={{ color: COLORS.purple }}>R$ {t.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                <div><span className="text-gray-500">Peso:</span> <span className="font-bold" style={{ color: COLORS.purple }}>{t.peso_total.toFixed(2)} kg</span></div>
              </div>
            ) : null;
          })()}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de Entrega</label>
            <input type="date" value={formData.prazo_entrega} onChange={e => setFormData(prev => ({ ...prev, prazo_entrega: e.target.value }))} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observacoes</label>
            <textarea value={formData.observacoes} onChange={e => setFormData(prev => ({ ...prev, observacoes: e.target.value }))} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200" rows={2} placeholder="Observacoes adicionais..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancelar</button>
          <button onClick={handleSubmit} disabled={!formData.fornecedor || !formData.items[0]?.produto || !formData.items[0]?.quantidade} className="px-4 py-2 text-white rounded-xl disabled:opacity-50" style={{ backgroundColor: COLORS.purple }}>Criar Ordem</button>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('portal-sniff-tab') || 'dashboard';
  });
  const [amSubTab, setAmSubTab] = useState('dashboard-am');

  // Persist active tab
  useEffect(() => {
    localStorage.setItem('portal-sniff-tab', activeTab);
  }, [activeTab]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // States para Academy
  const [courses, setCourses] = useState([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  // States para Admin Panel
  const [allProfiles, setAllProfiles] = useState([]);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);

  // States para Pedido Fornecedor
  const [pedidoShowForm, setPedidoShowForm] = useState(false);

  // Check auth on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(prev => (prev?.id === newUser?.id ? prev : newUser));
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load profile when user exists
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          setProfile(data);
        } else if (error) {
          console.warn('Profile fetch error:', error.message);
          // Minimal fallback - user can see portal but no admin access
          setProfile({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            role: 'pending',
            permissions: {},
          });
        }
      };
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  // Load courses from Supabase
  useEffect(() => {
    if (user) {
      supabase.from('courses').select('*').order('created_at', { ascending: false }).then(({ data }) => {
        setCourses(data || []);
      });
    }
  }, [user]);

  // Load all profiles for admin panel
  useEffect(() => {
    if (profile && profile.role === 'admin') {
      const fetchAllProfiles = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (data) {
          setAllProfiles(data);
        }
      };
      fetchAllProfiles();
    }
  }, [profile]);

  // Mock Data para Gráficos
  const salesData = [
    { name: 'Jan', vendas: 4000, meta: 3800 },
    { name: 'Fev', vendas: 3000, meta: 3200 },
    { name: 'Mar', vendas: 5000, meta: 4500 },
    { name: 'Abr', vendas: 4780, meta: 4600 },
    { name: 'Mai', vendas: 5890, meta: 5000 },
  ];

  const boxesData = [
    { month: 'Jan', caixas: 5200 },
    { month: 'Fev', caixas: 6100 },
    { month: 'Mar', caixas: 7800 },
    { month: 'Abr', caixas: 5400 },
    { month: 'Mai', caixas: 5753 },
  ];

  // === NEW STATES: Comunicados, Datas, AM Produtos, Defesa, Clips ===
  const [comunicados, setComunicados] = useState([]);
  const [showComunicadoModal, setShowComunicadoModal] = useState(false);
  const [datasImportantes, setDatasImportantes] = useState([]);
  const [showDataModal, setShowDataModal] = useState(false);
  const [amProdutos, setAmProdutos] = useState([]);
  const [amDefesa, setAmDefesa] = useState([]);
  const [showDefesaModal, setShowDefesaModal] = useState(false);
  const [amClips, setAmClips] = useState([]);
  const [showClipModal, setShowClipModal] = useState(false);
  const [showDestaqueModal, setShowDestaqueModal] = useState(false);
  const [defesaFilter, setDefesaFilter] = useState('todos');

  // Load comunicados
  useEffect(() => {
    if (user) {
      supabase.from('comunicados').select('*').order('created_at', { ascending: false }).limit(10).then(({ data }) => setComunicados(data || []));
    }
  }, [user]);

  // Load datas importantes
  useEffect(() => {
    if (user) {
      supabase.from('datas_importantes').select('*').order('date', { ascending: true }).then(({ data }) => setDatasImportantes(data || []));
    }
  }, [user]);

  // Load AM data
  useEffect(() => {
    if (user) {
      supabase.from('am_produtos').select('*').order('created_at', { ascending: true }).then(({ data }) => setAmProdutos(data || []));
      supabase.from('am_defesa_catalogo').select('*').order('created_at', { ascending: false }).then(({ data }) => setAmDefesa(data || []));
      supabase.from('am_clips').select('*').order('created_at', { ascending: false }).then(({ data }) => setAmClips(data || []));
    }
  }, [user]);

  // === VENDEDOR: BaseLinker Products ===
  const [vendedorProdutos, setVendedorProdutos] = useState([]);
  const [vendedorSearch, setVendedorSearch] = useState('');
  const [vendedorUploading, setVendedorUploading] = useState(false);
  const [vendedorSyncing, setVendedorSyncing] = useState(false);
  const [vendedorLastSync, setVendedorLastSync] = useState(localStorage.getItem('vendedor-last-sync') || null);

  // Load vendedor produtos
  useEffect(() => {
    if (user) {
      supabase.from('vendedor_produtos').select('*').order('nome', { ascending: true }).then(({ data }) => setVendedorProdutos(data || []));
    }
  }, [user]);

  // Componente de Login (somente email/senha - admin cria contas)
  const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
      e.preventDefault();
      if (!email || !password) return;
      setLoginLoading(true);
      setError('');

      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError('E-mail ou senha incorretos.');
        setLoginLoading(false);
        return;
      }

      setUser(data.session.user);
      setLoginLoading(false);
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-[#6B1B8E] p-8 text-center">
            <div className="w-20 h-20 bg-[#F4B942] rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Package className="text-[#6B1B8E] w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white">Grupo Sniff</h2>
            <p className="text-purple-200 text-sm mt-1">Portal Corporativo</p>
          </div>
          <form className="p-8 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B1B8E] focus:border-transparent outline-none transition-all"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B1B8E] focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[#6B1B8E] hover:bg-[#4A1063] text-white font-bold py-3 rounded-lg transition-colors shadow-md disabled:opacity-50"
            >
              {loginLoading ? 'Entrando...' : 'Acessar Portal'}
            </button>
            <p className="text-center text-xs text-gray-400">
              Acesso restrito. Solicite suas credenciais ao administrador.
            </p>
          </form>
        </div>
      </div>
    );
  };

  // PendingApproval e RejectedAccess removidos - admin cria contas diretamente

  // Admin Panel Component
  const AdminPanel = () => {
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [newUserData, setNewUserData] = useState({ email: '', password: '', full_name: '' });
    const [createUserMsg, setCreateUserMsg] = useState('');
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [editUserData, setEditUserData] = useState({ id: '', email: '', password: '', full_name: '' });
    const [editUserMsg, setEditUserMsg] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [deleteMsg, setDeleteMsg] = useState('');

    const handleCreateUser = async () => {
      setCreateUserMsg('');
      if (!newUserData.email || !newUserData.password) {
        setCreateUserMsg('Email e senha sao obrigatorios');
        return;
      }
      if (newUserData.password.length < 6) {
        setCreateUserMsg('Senha deve ter no minimo 6 caracteres');
        return;
      }
      try {
        const response = await fetch('/api/admin-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: newUserData.email,
            password: newUserData.password,
            full_name: newUserData.full_name,
            admin_id: user.id
          })
        });
        const result = await response.json();
        if (!response.ok) {
          setCreateUserMsg('Erro: ' + (result.error || 'Falha ao criar usuario'));
          return;
        }
        setCreateUserMsg('Funcionario criado com sucesso!');
        setNewUserData({ email: '', password: '', full_name: '' });
        // Reload profiles
        const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (profiles) setAllProfiles(profiles);
        setTimeout(() => { setShowCreateUser(false); setCreateUserMsg(''); }, 1500);
      } catch (err) {
        setCreateUserMsg('Erro inesperado: ' + err.message);
      }
    };

    const handleEditUser = async () => {
      setEditUserMsg('');
      if (!editUserData.email) {
        setEditUserMsg('Email e obrigatorio');
        return;
      }
      if (editUserData.password && editUserData.password.length < 6) {
        setEditUserMsg('Senha deve ter no minimo 6 caracteres');
        return;
      }
      try {
        const body = { user_id: editUserData.id, email: editUserData.email, full_name: editUserData.full_name };
        if (editUserData.password) body.password = editUserData.password;
        const response = await fetch('/api/admin-user', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const result = await response.json();
        if (!response.ok) {
          setEditUserMsg('Erro: ' + (result.error || 'Falha ao atualizar'));
          return;
        }
        setEditUserMsg('Usuario atualizado com sucesso!');
        const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (profiles) setAllProfiles(profiles);
        setTimeout(() => { setShowEditUserModal(false); setEditUserMsg(''); }, 1500);
      } catch (err) {
        setEditUserMsg('Erro inesperado: ' + err.message);
      }
    };

    const handleDeleteUser = async (profileId) => {
      setDeleteMsg('');
      try {
        const response = await fetch('/api/admin-user', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: profileId })
        });
        const result = await response.json();
        if (!response.ok) {
          setDeleteMsg('Erro: ' + (result.error || 'Falha ao excluir'));
          return;
        }
        setDeleteConfirmId(null);
        const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (profiles) setAllProfiles(profiles);
      } catch (err) {
        setDeleteMsg('Erro inesperado: ' + err.message);
      }
    };

    const handleApprove = async (profileId) => {
      const defaultPermissions = {
        dashboard: true,
        academy: false,
        recebimento: false,
        precificacao: false,
        agua_marinha: false,
        vendedor: false,
        times: false,
        sku: false,
        pedidos: false,
        analise_vendas: false
      };

      await supabase
        .from('profiles')
        .update({
          role: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          permissions: defaultPermissions
        })
        .eq('id', profileId);

      // Reload profiles
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) setAllProfiles(data);
    };

    const handleReject = async (profileId) => {
      await supabase
        .from('profiles')
        .update({ role: 'rejected' })
        .eq('id', profileId);

      // Reload profiles
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) setAllProfiles(data);
    };

    const handleSavePermissions = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      const permissions = {
        dashboard: formData.get('dashboard') === 'on',
        academy: formData.get('academy') === 'on',
        recebimento: formData.get('recebimento') === 'on',
        agua_marinha: formData.get('agua_marinha') === 'on',
        vendedor: formData.get('vendedor') === 'on',
        times: formData.get('times') === 'on',
        sku: formData.get('sku') === 'on',
        pedidos: formData.get('pedidos') === 'on',
        marketing: formData.get('marketing') === 'on',
        fulfillment: formData.get('fulfillment') === 'on',
        precificacao: formData.get('precificacao') === 'on',
        dashboard_am: formData.get('dashboard_am') === 'on',
        defesa: formData.get('defesa') === 'on',
        checklist: formData.get('checklist') === 'on',
        preco: formData.get('preco') === 'on',
        tracker: formData.get('tracker') === 'on',
        sobre_am: formData.get('sobre_am') === 'on',
        analise_vendas: formData.get('analise_vendas') === 'on'
      };

      await supabase
        .from('profiles')
        .update({ permissions })
        .eq('id', editingProfile.id);

      // Reload profiles
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) setAllProfiles(data);

      setShowPermissionsModal(false);
      setEditingProfile(null);
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Painel Administrativo</h2>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowCreateUser(true); setCreateUserMsg(''); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#6B1B8E] text-white rounded-lg font-bold text-sm hover:bg-[#5a1676] transition-colors"
            >
              <UserPlus size={16} /> Criar Funcionario
            </button>
            <div className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-bold text-sm">
              Acesso Admin
            </div>
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateUser(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-[#6B1B8E] mb-4">Criar Novo Funcionario</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                  <input type="text" value={newUserData.full_name} onChange={e => setNewUserData({ ...newUserData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none"
                    placeholder="Nome do funcionario" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email *</label>
                  <input type="email" value={newUserData.email} onChange={e => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none"
                    placeholder="email@empresa.com.br" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha *</label>
                  <input type="password" value={newUserData.password} onChange={e => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none"
                    placeholder="Minimo 6 caracteres" />
                </div>
                {createUserMsg && (
                  <p className={`text-sm font-bold ${createUserMsg.includes('sucesso') ? 'text-green-600' : 'text-red-600'}`}>
                    {createUserMsg}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowCreateUser(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-300">
                    Cancelar
                  </button>
                  <button onClick={handleCreateUser}
                    className="flex-1 px-4 py-2 bg-[#6B1B8E] text-white rounded-xl font-bold text-sm hover:bg-[#5a1676]">
                    Criar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
                <tr>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Criado em</th>
                  <th className="px-6 py-4">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {allProfiles.map(prof => (
                  <tr key={prof.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">{prof.email}</td>
                    <td className="px-6 py-4">{prof.full_name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        prof.role === 'admin' ? 'bg-red-100 text-red-700' :
                        prof.role === 'approved' ? 'bg-green-100 text-green-700' :
                        prof.role === 'rejected' ? 'bg-gray-100 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {prof.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(prof.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {prof.role === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(prof.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Aprovar"
                            >
                              <UserCheck size={18} />
                            </button>
                            <button
                              onClick={() => handleReject(prof.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Rejeitar"
                            >
                              <UserX size={18} />
                            </button>
                          </>
                        )}
                        {(prof.role === 'approved' || prof.role === 'admin') && (
                          <button
                            onClick={() => { setEditingProfile(prof); setShowPermissionsModal(true); }}
                            className="p-2 text-[#6B1B8E] hover:bg-purple-50 rounded-lg transition-colors"
                            title="Editar Permissoes"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                        {prof.role !== 'admin' && (
                          <>
                            <button
                              onClick={() => { setEditUserData({ id: prof.id, email: prof.email || '', password: '', full_name: prof.full_name || '' }); setEditUserMsg(''); setShowEditUserModal(true); }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar Usuario"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => { setDeleteConfirmId(prof.id); setDeleteMsg(''); }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir Usuario"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit User Modal */}
        {showEditUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditUserModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-[#6B1B8E] mb-4">Editar Usuario</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                  <input type="text" value={editUserData.full_name} onChange={e => setEditUserData({ ...editUserData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none"
                    placeholder="Nome do funcionario" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                  <input type="email" value={editUserData.email} onChange={e => setEditUserData({ ...editUserData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none"
                    placeholder="email@empresa.com.br" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nova Senha (deixe vazio para manter)</label>
                  <input type="password" value={editUserData.password} onChange={e => setEditUserData({ ...editUserData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none"
                    placeholder="Minimo 6 caracteres" />
                </div>
                {editUserMsg && (
                  <p className={`text-sm font-bold ${editUserMsg.includes('sucesso') ? 'text-green-600' : 'text-red-600'}`}>
                    {editUserMsg}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowEditUserModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-300">
                    Cancelar
                  </button>
                  <button onClick={handleEditUser}
                    className="flex-1 px-4 py-2 bg-[#6B1B8E] text-white rounded-xl font-bold text-sm hover:bg-[#5a1676]">
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirmId(null)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Excluir Usuario?</h3>
              <p className="text-sm text-gray-500 mb-1">
                {allProfiles.find(p => p.id === deleteConfirmId)?.email}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Esta acao e irreversivel. O usuario perdera todo o acesso.
              </p>
              {deleteMsg && (
                <p className="text-sm font-bold text-red-600 mb-3">{deleteMsg}</p>
              )}
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-300">
                  Cancelar
                </button>
                <button onClick={() => handleDeleteUser(deleteConfirmId)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {showPermissionsModal && editingProfile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold">Editar Permissoes</h3>
                  <p className="text-sm text-gray-500">{editingProfile.email}</p>
                </div>
                <button onClick={() => { setShowPermissionsModal(false); setEditingProfile(null); }} className="text-gray-400 hover:text-gray-600">
                  <X size={24}/>
                </button>
              </div>
              <form onSubmit={handleSavePermissions} className="space-y-6">
                <div>
                  <h4 className="font-bold text-gray-700 mb-3">Modulos Principais</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {['dashboard', 'academy', 'recebimento', 'precificacao', 'agua_marinha', 'vendedor', 'times', 'sku', 'pedidos', 'marketing', 'fulfillment', 'analise_vendas'].map(perm => (
                      <label key={perm} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          name={perm}
                          defaultChecked={editingProfile.permissions?.[perm] || false}
                          className="w-4 h-4 text-[#6B1B8E] rounded"
                        />
                        <span className="text-sm font-medium capitalize">{perm.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-700 mb-3">Sub-tabs Agua Marinha</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {['dashboard_am', 'defesa', 'checklist', 'preco', 'tracker', 'sobre_am'].map(perm => (
                      <label key={perm} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          name={perm}
                          defaultChecked={editingProfile.permissions?.[perm] || false}
                          className="w-4 h-4 text-[#6B1B8E] rounded"
                        />
                        <span className="text-sm font-medium capitalize">{perm.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full bg-[#6B1B8E] text-white py-3 rounded-xl font-bold shadow-md hover:bg-[#4A1063] transition-all">
                  Salvar Permissoes
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Componente Sidebar
  const Sidebar = () => {
    const allNavItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
      { id: 'academy', label: 'Sniff Academy', icon: GraduationCap, permission: 'academy' },
      { id: 'recebimento', label: 'Recebimento', icon: Package, permission: 'recebimento' },
      { id: 'vendedor', label: 'Area Vendedor', icon: ClipboardList, permission: 'vendedor' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, permission: 'analytics' },
      { id: 'times', label: 'Gestao de Times', icon: Users, permission: 'times' },
      { id: 'pedidos', label: 'Pedidos Fornecedor', icon: Truck, permission: 'pedidos' },
      { id: 'marketing', label: 'Marketing', icon: Megaphone, permission: 'marketing' },
      { id: 'fulfillment', label: 'Fulfillment', icon: Warehouse, permission: 'fulfillment' },
      { id: 'precificacao', label: 'Precificacao', icon: DollarSign, permission: 'precificacao' },
      { id: 'analisevendas', label: 'Analise de Vendas', icon: TrendingUp, permission: 'analise_vendas' },
    ];

    if (profile?.role === 'admin') {
      allNavItems.push({ id: 'admin', label: 'Admin', icon: ShieldCheck, permission: 'admin' });
    }

    const canSee = (item) => {
      if (profile?.role === 'admin') return true;
      if (item.id === 'admin') return false;
      return profile?.permissions?.[item.permission] === true;
    };

    // Grouped sections
    const sections = [
      { label: 'PRINCIPAL', ids: ['dashboard', 'academy'] },
      { label: 'OPERACOES', ids: ['recebimento', 'vendedor', 'pedidos', 'fulfillment', 'times'] },
      { label: 'INTELIGENCIA', ids: ['analytics', 'analisevendas', 'precificacao'] },
      { label: 'MARKETING', ids: ['marketing'] },
      { label: 'SISTEMA', ids: ['admin'] },
    ];

    const marketingChildren = ['marketing', 'gestao_anuncios', 'oportunidades', 'aguamarinha'];

    const renderNavItem = (item) => {
      const isMarketingGroup = item.id === 'marketing';
      const isMarketingExpanded = isMarketingGroup && marketingChildren.includes(activeTab);
      const isActive = activeTab === item.id || (isMarketingGroup && ['gestao_anuncios', 'oportunidades', 'aguamarinha'].includes(activeTab));

      return (
        <div key={item.id} className="relative">
          {/* Gold active indicator bar */}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-[#F4B942] rounded-r-full shadow-[0_0_8px_rgba(244,185,66,0.6)]" />
          )}
          <button
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
              isActive
              ? 'bg-white/15 text-white shadow-lg shadow-purple-900/30 backdrop-blur-sm'
              : 'text-purple-200 hover:text-white hover:bg-white/10 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10'
            }`}
          >
            <div className={`min-w-[36px] h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
              isActive
              ? 'bg-[#F4B942] text-[#1a0a2e] shadow-md shadow-yellow-500/30'
              : 'bg-white/10 text-purple-200 group-hover:bg-white/20 group-hover:text-white'
            }`}>
              <item.icon size={18} />
            </div>
            {isSidebarOpen && <span className={`text-sm flex-1 text-left ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>}
            {isMarketingGroup && isSidebarOpen && (
              <ChevronDown size={14} className={`transition-transform duration-200 ${isMarketingExpanded ? 'rotate-0' : '-rotate-90'}`} />
            )}
          </button>
          {isMarketingGroup && isMarketingExpanded && isSidebarOpen && (
            <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-purple-400/20 pl-3">
              {[
                { id: 'marketing', label: 'Produtos Comprados' },
                { id: 'gestao_anuncios', label: 'Produtos Parados' },
                { id: 'oportunidades', label: 'Oportunidades' },
                { id: 'aguamarinha', label: 'Agua Marinha' },
              ].map(sub => (
                <button key={sub.id}
                  onClick={() => setActiveTab(sub.id)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                    activeTab === sub.id
                    ? 'bg-[#F4B942]/20 text-[#F4B942] font-semibold'
                    : 'text-purple-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    };

    const userInitials = (profile?.full_name || profile?.email || 'U')
      .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
      <aside className={`fixed left-0 top-0 h-full text-white transition-all duration-300 z-50 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}
        style={{ background: 'linear-gradient(180deg, #0d0520 0%, #1a0a2e 20%, #6B1B8E 60%, #4A1063 85%, #1a0a2e 100%)' }}>

        {/* Logo Header */}
        <div className={`pt-6 pb-4 ${isSidebarOpen ? 'px-5' : 'px-3'}`}>
          {isSidebarOpen ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-[#F4B942] to-[#e09a20] rounded-2xl flex items-center justify-center font-black text-[#1a0a2e] text-lg shadow-lg shadow-yellow-500/30 mb-3">
                GS
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold tracking-[0.3em] text-purple-300 uppercase">Grupo</p>
                <p className="text-xl font-black tracking-wider bg-gradient-to-r from-[#F4B942] via-[#f5c96a] to-[#F4B942] bg-clip-text text-transparent">SNIFF</p>
              </div>
              <div className="w-full mt-4 h-px bg-gradient-to-r from-transparent via-[#F4B942]/40 to-transparent" />
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-11 h-11 bg-gradient-to-br from-[#F4B942] to-[#e09a20] rounded-2xl flex items-center justify-center font-black text-[#1a0a2e] text-sm shadow-lg shadow-yellow-500/30">
                GS
              </div>
            </div>
          )}
        </div>

        {/* Nav Sections - Scrollable */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-2 space-y-4 scrollbar-thin scrollbar-thumb-purple-400/20 scrollbar-track-transparent">
          {sections.map(section => {
            const items = section.ids.map(id => allNavItems.find(n => n.id === id)).filter(Boolean).filter(canSee);
            if (items.length === 0) return null;
            return (
              <div key={section.label}>
                {isSidebarOpen && (
                  <p className="text-[10px] font-bold tracking-[0.2em] text-purple-400/60 uppercase px-3 mb-2">{section.label}</p>
                )}
                {!isSidebarOpen && <div className="w-8 mx-auto h-px bg-purple-400/20 mb-2" />}
                <div className="space-y-0.5">
                  {items.map(renderNavItem)}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Card Footer */}
        <div className="px-3 pb-4 pt-2">
          <div className="h-px bg-gradient-to-r from-transparent via-purple-400/20 to-transparent mb-3" />
          {isSidebarOpen ? (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5">
              <div className="min-w-[36px] h-9 rounded-full bg-gradient-to-br from-[#F4B942] to-[#e09a20] flex items-center justify-center text-[#1a0a2e] font-bold text-xs shadow-md shadow-yellow-500/20">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{profile?.full_name || 'Usuario'}</p>
                <p className="text-[10px] text-purple-300 truncate">{profile?.role === 'admin' ? 'Administrador' : 'Colaborador'}</p>
              </div>
              <button
                onClick={async () => { await supabase.auth.signOut(); setUser(null); }}
                className="p-1.5 text-purple-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={async () => { await supabase.auth.signOut(); setUser(null); }}
              className="w-full flex justify-center p-2.5 text-purple-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>
    );
  };

  // 1. Dashboard Module
  const DashboardView = () => {
    const [comForm, setComForm] = useState({ title: '', message: '', priority: 'info' });
    const [editingCom, setEditingCom] = useState(null);
    const [dataForm, setDataForm] = useState({ title: '', description: '', date: '', category: 'evento' });
    const [editingData, setEditingData] = useState(null);
    const [destaques, setDestaques] = useState({ vendedores: [], funcionarios: [] });
    const [destaqueForm, setDestaqueForm] = useState({ nome: '', area: '', destaque: '', tipo: 'vendedor_do_mes' });
    const [destaqueFile, setDestaqueFile] = useState(null);
    const [destaqueUploading, setDestaqueUploading] = useState(false);

    const loadDestaques = async () => {
      const mesRef = new Date().toISOString().slice(0, 8) + '01';
      const { data } = await supabase.from('reconhecimento').select('*').eq('mes_referencia', mesRef).order('created_at', { ascending: false });
      if (data) {
        setDestaques({
          vendedores: data.filter(d => d.tipo === 'vendedor_do_mes'),
          funcionarios: data.filter(d => d.tipo === 'funcionario_do_mes')
        });
      }
    };

    useEffect(() => { loadDestaques(); }, []);

    const fileToBase64 = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const handleSaveDestaque = async () => {
      if (!destaqueForm.nome) return alert('Preencha o nome.');
      setDestaqueUploading(true);
      try {
        let foto_base64 = null;
        let foto_ext = null;
        if (destaqueFile) {
          foto_base64 = await fileToBase64(destaqueFile);
          foto_ext = destaqueFile.name.split('.').pop();
        }
        const mesRef = new Date().toISOString().slice(0, 8) + '01';
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        const resp = await fetch('/api/reconhecimento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ nome: destaqueForm.nome, area: destaqueForm.area || null, destaque: destaqueForm.destaque || null, tipo: destaqueForm.tipo, foto_base64, foto_ext, mes_referencia: mesRef })
        });
        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error || 'Erro ao salvar');
        await loadDestaques();
        setShowDestaqueModal(false);
        setDestaqueForm({ nome: '', area: '', destaque: '', tipo: 'vendedor_do_mes' });
        setDestaqueFile(null);
      } catch (err) {
        alert('Erro ao salvar destaque: ' + err.message);
      }
      setDestaqueUploading(false);
    };

    const handleDeleteDestaque = async (id) => {
      if (!confirm('Remover este destaque?')) return;
      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        const resp = await fetch('/api/reconhecimento', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ id })
        });
        if (!resp.ok) { const r = await resp.json(); throw new Error(r.error); }
      } catch (err) { alert('Erro ao remover: ' + err.message); }
      await loadDestaques();
    };

    const handleAddComunicado = async () => {
      if (!comForm.title || !comForm.message) return;
      if (editingCom) {
        const { data } = await supabase.from('comunicados').update({ title: comForm.title, message: comForm.message, priority: comForm.priority }).eq('id', editingCom.id).select();
        if (data) setComunicados(prev => prev.map(c => c.id === editingCom.id ? data[0] : c));
      } else {
        const { data } = await supabase.from('comunicados').insert([{ ...comForm, author: profile?.full_name || 'Admin', user_id: user.id }]).select();
        if (data) setComunicados(prev => [data[0], ...prev]);
      }
      setShowComunicadoModal(false); setEditingCom(null); setComForm({ title: '', message: '', priority: 'info' });
    };

    const handleDeleteComunicado = async (id) => {
      if (!confirm('Remover este comunicado?')) return;
      await supabase.from('comunicados').delete().eq('id', id);
      setComunicados(prev => prev.filter(c => c.id !== id));
    };

    const handleAddData = async () => {
      if (!dataForm.title || !dataForm.date) return;
      if (editingData) {
        const { data } = await supabase.from('datas_importantes').update({ title: dataForm.title, description: dataForm.description, date: dataForm.date, category: dataForm.category }).eq('id', editingData.id).select();
        if (data) setDatasImportantes(prev => prev.map(d => d.id === editingData.id ? data[0] : d).sort((a,b) => new Date(a.date) - new Date(b.date)));
      } else {
        const { data } = await supabase.from('datas_importantes').insert([{ ...dataForm, user_id: user.id }]).select();
        if (data) setDatasImportantes(prev => [...prev, data[0]].sort((a,b) => new Date(a.date) - new Date(b.date)));
      }
      setShowDataModal(false); setEditingData(null); setDataForm({ title: '', description: '', date: '', category: 'evento' });
    };

    const handleDeleteData = async (id) => {
      if (!confirm('Remover esta data?')) return;
      await supabase.from('datas_importantes').delete().eq('id', id);
      setDatasImportantes(prev => prev.filter(d => d.id !== id));
    };

    const daysUntil = (dateStr) => { const d = Math.ceil((new Date(dateStr) - new Date()) / 86400000); return d; };
    const priorityStyles = { urgente: 'bg-red-100 text-red-700 border-red-200', importante: 'bg-yellow-100 text-yellow-700 border-yellow-200', info: 'bg-gray-100 text-gray-600 border-gray-200' };
    const catStyles = { feriado: 'bg-red-100 text-red-700', meta: 'bg-purple-100 text-purple-700', evento: 'bg-blue-100 text-blue-700', deadline: 'bg-orange-100 text-orange-700' };

    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
    const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase());

    const DestaqueCard = ({ titulo, cor, icone, pessoas, corBorda, tipo }) => (
      <div className={`${cor} p-6 rounded-2xl shadow-lg relative overflow-hidden`}>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              {icone}
              <div>
                <h3 className="text-lg font-bold text-white">{titulo}</h3>
                <p className="text-xs text-white/60">{mesAtual} 2026</p>
              </div>
            </div>
            {profile?.role === 'admin' && (
              <button onClick={() => { setDestaqueForm({ nome: '', area: '', destaque: '', tipo }); setDestaqueFile(null); setShowDestaqueModal(true); }} className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1">
                <Plus size={12} /> Adicionar
              </button>
            )}
          </div>
          {pessoas.length > 0 ? (
            <div className="space-y-4">
              {pessoas.map((p, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className={`w-14 h-14 rounded-full ${corBorda} border-4 p-0.5 flex-shrink-0`}>
                    {p.foto_url ? (
                      <img src={p.foto_url} alt={p.nome} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#6B1B8E] font-bold text-lg">{getInitials(p.nome)}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white">{p.nome}</p>
                    <p className="text-xs text-white/70">{p.area || ''}</p>
                    {p.destaque && <p className="text-xs text-white/50 mt-0.5">{p.destaque}</p>}
                  </div>
                  {i === 0 && <span className="text-2xl">&#127942;</span>}
                  {profile?.role === 'admin' && (
                    <button onClick={() => handleDeleteDestaque(p.id)} className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-red-300 transition-all" title="Remover">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-white/50 text-sm">Nenhum destaque definido para {mesAtual}.</p>
              <p className="text-white/30 text-xs mt-1">Clique em Adicionar para cadastrar</p>
            </div>
          )}
        </div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
      </div>
    );

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#6B1B8E] via-[#8B2FC0] to-[#6B1B8E] p-8 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-black text-white">Sejam Bem-vindos, Sniffers!</h1>
            <p className="text-purple-200 mt-2 text-lg">
              {profile?.full_name ? `Ola, ${profile.full_name.split(' ')[0]}!` : 'Ola!'}{' '}
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
            </p>
          </div>
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#F4B942]/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        {/* Vendedor do Mes + Funcionario do Mes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DestaqueCard
            titulo="Vendedor do Mes"
            cor="bg-gradient-to-br from-[#6B1B8E] to-[#4A1063]"
            icone={<Award size={28} className="text-[#F4B942]" />}
            pessoas={destaques.vendedores}
            corBorda="border-[#F4B942]"
            tipo="vendedor_do_mes"
          />
          <DestaqueCard
            titulo="Funcionario do Mes"
            cor="bg-gradient-to-br from-[#1B6B3E] to-[#0D4A26]"
            icone={<Star size={28} className="text-[#F4B942]" />}
            pessoas={destaques.funcionarios}
            corBorda="border-emerald-300"
            tipo="funcionario_do_mes"
          />
        </div>

        {/* Comunicados + Datas Importantes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Comunicados */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Megaphone size={20} className="text-[#6B1B8E]" /> Comunicados</h3>
              {profile?.role === 'admin' && <button onClick={() => { setEditingCom(null); setComForm({ title: '', message: '', priority: 'info' }); setShowComunicadoModal(true); }} className="flex items-center gap-1 bg-[#6B1B8E] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#4A1063] transition-colors"><Plus size={14} /> Novo</button>}
            </div>
            {comunicados.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Nenhum comunicado ainda.</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {comunicados.slice(0, 8).map(c => (
                  <div key={c.id} className={`p-3 rounded-xl border ${priorityStyles[c.priority] || priorityStyles.info} group`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${priorityStyles[c.priority]}`}>{c.priority}</span>
                          <h4 className="font-bold text-sm">{c.title}</h4>
                        </div>
                        <p className="text-xs mt-1 opacity-80">{c.message}</p>
                      </div>
                      {profile?.role === 'admin' && (
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => { setEditingCom(c); setComForm({ title: c.title, message: c.message, priority: c.priority }); setShowComunicadoModal(true); }} className="p-1.5 hover:bg-white/50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors" title="Editar"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteComunicado(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors" title="Remover"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[10px] opacity-60">
                      <span>{c.author}</span>
                      <span>-</span>
                      <span>{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Datas Importantes */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><CalendarDays size={20} className="text-[#6B1B8E]" /> Datas Importantes</h3>
              {profile?.role === 'admin' && <button onClick={() => { setEditingData(null); setDataForm({ title: '', description: '', date: '', category: 'evento' }); setShowDataModal(true); }} className="flex items-center gap-1 bg-[#6B1B8E] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#4A1063] transition-colors"><Plus size={14} /> Adicionar</button>}
            </div>
            {datasImportantes.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Nenhuma data cadastrada.</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {datasImportantes.filter(d => daysUntil(d.date) >= 0).map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50 group">
                    <div className="text-center min-w-[48px]">
                      <p className="text-lg font-black text-[#6B1B8E]">{new Date(d.date + 'T12:00:00').getDate()}</p>
                      <p className="text-[10px] uppercase font-bold text-gray-400">{new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-gray-800">{d.title}</h4>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${catStyles[d.category] || catStyles.evento}`}>{d.category}</span>
                      </div>
                      {d.description && <p className="text-xs text-gray-500 mt-0.5">{d.description}</p>}
                    </div>
                    {profile?.role === 'admin' && (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setEditingData(d); setDataForm({ title: d.title, description: d.description || '', date: d.date, category: d.category }); setShowDataModal(true); }} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-blue-600 transition-colors" title="Editar"><Edit2 size={14} /></button>
                        <button onClick={() => handleDeleteData(d.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors" title="Remover"><Trash2 size={14} /></button>
                      </div>
                    )}
                    <div className="text-right min-w-[60px]">
                      {daysUntil(d.date) === 0 ? (
                        <span className="text-xs font-black text-green-600">HOJE!</span>
                      ) : (
                        <><p className="text-lg font-black text-[#F4B942]">{daysUntil(d.date)}</p><p className="text-[10px] text-gray-400">dias</p></>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Comunicado */}
        {showComunicadoModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowComunicadoModal(false); setEditingCom(null); setComForm({ title: '', message: '', priority: 'info' }); }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">{editingCom ? 'Editar Comunicado' : 'Novo Comunicado'}</h3>
              <div className="space-y-3">
                <input placeholder="Titulo" value={comForm.title} onChange={e => setComForm({...comForm, title: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-200" />
                <textarea placeholder="Mensagem" rows={3} value={comForm.message} onChange={e => setComForm({...comForm, message: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-200" />
                <select value={comForm.priority} onChange={e => setComForm({...comForm, priority: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                  <option value="info">Info</option>
                  <option value="importante">Importante</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setShowComunicadoModal(false); setEditingCom(null); setComForm({ title: '', message: '', priority: 'info' }); }} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50">Cancelar</button>
                <button onClick={handleAddComunicado} className="flex-1 py-2 bg-[#6B1B8E] text-white rounded-lg text-sm font-bold hover:bg-[#4A1063]">{editingCom ? 'Salvar' : 'Publicar'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Data Importante */}
        {showDataModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowDataModal(false); setEditingData(null); setDataForm({ title: '', description: '', date: '', category: 'evento' }); }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">{editingData ? 'Editar Data Importante' : 'Adicionar Data Importante'}</h3>
              <div className="space-y-3">
                <input placeholder="Titulo" value={dataForm.title} onChange={e => setDataForm({...dataForm, title: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-200" />
                <input placeholder="Descricao (opcional)" value={dataForm.description} onChange={e => setDataForm({...dataForm, description: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-200" />
                <input type="date" value={dataForm.date} onChange={e => setDataForm({...dataForm, date: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                <select value={dataForm.category} onChange={e => setDataForm({...dataForm, category: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                  <option value="evento">Evento</option>
                  <option value="meta">Meta</option>
                  <option value="feriado">Feriado</option>
                  <option value="deadline">Deadline</option>
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setShowDataModal(false); setEditingData(null); setDataForm({ title: '', description: '', date: '', category: 'evento' }); }} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50">Cancelar</button>
                <button onClick={handleAddData} className="flex-1 py-2 bg-[#6B1B8E] text-white rounded-lg text-sm font-bold hover:bg-[#4A1063]">{editingData ? 'Salvar' : 'Adicionar'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Destaque (Vendedor/Funcionario do Mes) */}
        {showDestaqueModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDestaqueModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Camera size={20} className="text-[#6B1B8E]" />
                {destaqueForm.tipo === 'vendedor_do_mes' ? 'Vendedor do Mes' : 'Funcionario do Mes'}
              </h3>
              <div className="space-y-3">
                <input placeholder="Nome completo" value={destaqueForm.nome} onChange={e => setDestaqueForm({...destaqueForm, nome: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-200" />
                <input placeholder="Setor / Area" value={destaqueForm.area} onChange={e => setDestaqueForm({...destaqueForm, area: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-200" />
                <input placeholder="Motivo do reconhecimento" value={destaqueForm.destaque} onChange={e => setDestaqueForm({...destaqueForm, destaque: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-200" />
                <select value={destaqueForm.tipo} onChange={e => setDestaqueForm({...destaqueForm, tipo: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                  <option value="vendedor_do_mes">Vendedor do Mes</option>
                  <option value="funcionario_do_mes">Funcionario do Mes</option>
                </select>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Foto do colaborador</label>
                  <label className="flex items-center gap-2 px-3 py-3 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#6B1B8E] hover:bg-purple-50 transition-colors">
                    <Upload size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-500">{destaqueFile ? destaqueFile.name : 'Clique para selecionar foto...'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => setDestaqueFile(e.target.files[0] || null)} />
                  </label>
                  {destaqueFile && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={URL.createObjectURL(destaqueFile)} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-[#6B1B8E]" />
                      <button onClick={() => setDestaqueFile(null)} className="text-xs text-red-500 hover:text-red-700">Remover</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowDestaqueModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50">Cancelar</button>
                <button onClick={handleSaveDestaque} disabled={destaqueUploading} className="flex-1 py-2 bg-[#6B1B8E] text-white rounded-lg text-sm font-bold hover:bg-[#4A1063] disabled:opacity-50 disabled:cursor-not-allowed">
                  {destaqueUploading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 2. Academy Module
  const AcademyView = () => {
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);
    const [activeLesson, setActiveLesson] = useState(null);
    const [lessonForm, setLessonForm] = useState({ title: '', description: '', video_url: '', order_num: 1 });

    const loadLessons = async (courseId) => {
      const { data } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order_num', { ascending: true });
      setLessons(data || []);
    };

    const handleSaveCourse = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = { title: fd.get('title'), area: fd.get('area'), status: 'Ativo' };

      if (editingCourse) {
        const { error } = await supabase.from('courses').update(payload).eq('id', editingCourse.id);
        if (!error) {
          setCourses(courses.map(c => c.id === editingCourse.id ? { ...c, ...payload } : c));
        }
      } else {
        const { data, error } = await supabase.from('courses').insert([payload]).select();
        if (error) {
          console.error('Erro ao criar curso:', error);
          alert('Erro ao criar curso: ' + error.message);
          return;
        }
        if (data && data[0]) {
          setCourses([...courses, data[0]]);
        }
      }
      setShowCourseModal(false);
      setEditingCourse(null);
    };

    const handleDeleteCourse = async (course) => {
      if (!confirm('Excluir curso e todas as aulas?')) return;
      await supabase.from('lessons').delete().eq('course_id', course.id);
      const { error } = await supabase.from('courses').delete().eq('id', course.id);
      if (!error) setCourses(courses.filter(c => c.id !== course.id));
    };

    const handleOpenCourse = async (course) => {
      setSelectedCourse(course);
      setActiveLesson(null);
      await loadLessons(course.id);
    };

    const resetLessonForm = () => {
      setLessonForm({ title: '', description: '', video_url: '', order_num: lessons.length + 1 });
      setEditingLesson(null);
      setShowLessonModal(false);
    };

    const handleSaveLesson = async () => {
      if (!lessonForm.title) return;
      const payload = {
        course_id: selectedCourse.id,
        title: lessonForm.title,
        description: lessonForm.description || null,
        video_url: lessonForm.video_url || null,
        order_num: Number(lessonForm.order_num) || 1
      };

      if (editingLesson) {
        const { error } = await supabase.from('lessons').update(payload).eq('id', editingLesson.id);
        if (!error) setLessons(lessons.map(l => l.id === editingLesson.id ? { ...l, ...payload } : l));
      } else {
        const { data, error } = await supabase.from('lessons').insert([payload]).select();
        if (data && data[0]) setLessons([...lessons, data[0]]);
      }
      resetLessonForm();
    };

    const handleDeleteLesson = async (id) => {
      if (!confirm('Excluir esta aula?')) return;
      const { error } = await supabase.from('lessons').delete().eq('id', id);
      if (!error) {
        setLessons(lessons.filter(l => l.id !== id));
        if (activeLesson?.id === id) setActiveLesson(null);
      }
    };

    // Course Detail View (with lessons + video player)
    if (selectedCourse) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedCourse(null); setActiveLesson(null); }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight size={20} className="rotate-180 text-gray-600" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{selectedCourse.title}</h2>
              <p className="text-sm text-gray-500">{selectedCourse.area} - {lessons.length} aula(s)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lesson List */}
            <div className="lg:col-span-1 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-700">Aulas ({lessons.length})</h3>
                <div className="flex gap-2">
                  <button onClick={() => loadLessons(selectedCourse.id)}
                    className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200">
                    <RefreshCw size={12} />
                  </button>
                  <button onClick={() => { resetLessonForm(); setLessonForm(f => ({ ...f, order_num: lessons.length + 1 })); setShowLessonModal(true); }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#6B1B8E] text-white rounded-lg text-xs font-bold hover:bg-[#5a1676]">
                    <Plus size={14} /> Aula
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {lessons.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Nenhuma aula adicionada</p>
                ) : lessons.map((lesson, idx) => (
                  <div key={lesson.id}
                    className={`p-3 rounded-xl border cursor-pointer transition-all group ${activeLesson?.id === lesson.id ? 'border-[#6B1B8E] bg-purple-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                    onClick={() => setActiveLesson(lesson)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="text-xs font-bold text-[#6B1B8E] bg-purple-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">{lesson.order_num || idx + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">{lesson.title}</p>
                          {lesson.description && <p className="text-xs text-gray-500 truncate">{lesson.description}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); setEditingLesson(lesson); setLessonForm({ title: lesson.title, description: lesson.description || '', video_url: lesson.video_url || '', order_num: lesson.order_num || idx + 1 }); setShowLessonModal(true); }}
                          className="p-1 text-gray-400 hover:text-[#6B1B8E]"><Edit2 size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id); }}
                          className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Player Area */}
            <div className="lg:col-span-2">
              {activeLesson ? (
                <div className="space-y-4">
                  <div className="bg-black rounded-2xl overflow-hidden aspect-video">
                    {activeLesson.video_url ? (
                      (() => {
                        const url = activeLesson.video_url;
                        // Detectar tipo de video
                        const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
                        const isVimeo = url.includes('vimeo.com');
                        const isLoom = url.includes('loom.com');

                        if (isYouTube) {
                          // Extrair video ID do YouTube
                          let videoId = '';
                          if (url.includes('youtu.be/')) {
                            videoId = url.split('youtu.be/')[1]?.split('?')[0];
                          } else if (url.includes('watch?v=')) {
                            videoId = url.split('watch?v=')[1]?.split('&')[0];
                          } else if (url.includes('embed/')) {
                            videoId = url.split('embed/')[1]?.split('?')[0];
                          }
                          return (
                            <iframe
                              key={activeLesson.id}
                              src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={activeLesson.title}
                            />
                          );
                        }

                        if (isVimeo) {
                          const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0];
                          return (
                            <iframe
                              key={activeLesson.id}
                              src={`https://player.vimeo.com/video/${vimeoId}`}
                              className="w-full h-full"
                              allow="autoplay; fullscreen; picture-in-picture"
                              allowFullScreen
                              title={activeLesson.title}
                            />
                          );
                        }

                        if (isLoom) {
                          const loomId = url.includes('/share/') ? url.split('/share/')[1]?.split('?')[0] : url.split('/embed/')[1]?.split('?')[0];
                          return (
                            <iframe
                              key={activeLesson.id}
                              src={`https://www.loom.com/embed/${loomId}`}
                              className="w-full h-full"
                              allowFullScreen
                              title={activeLesson.title}
                            />
                          );
                        }

                        // Video direto (MP4, Supabase Storage, etc)
                        // Nao usar crossOrigin para Supabase - causa erro de CORS
                        const isSupabase = url.includes('supabase.co');
                        return (
                          <video
                            key={activeLesson.id}
                            controls
                            className="w-full h-full"
                            controlsList="nodownload"
                            playsInline
                            preload="auto"
                            src={url}
                          >
                            Seu navegador nao suporta o player de video.
                          </video>
                        );
                      })()
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <GraduationCap size={48} className="mx-auto mb-2 text-gray-600" />
                          <p className="text-sm">Nenhum video adicionado</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{activeLesson.title}</h3>
                    {activeLesson.description && <p className="text-sm text-gray-600 mt-1">{activeLesson.description}</p>}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <GraduationCap size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400 font-bold">Selecione uma aula para assistir</p>
                </div>
              )}
            </div>
          </div>

          {/* Lesson Modal */}
          {showLessonModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={resetLessonForm}>
              <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-[#6B1B8E]">{editingLesson ? 'Editar Aula' : 'Nova Aula'}</h3>
                  <button onClick={resetLessonForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Titulo *</label>
                    <input type="text" value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none"
                      placeholder="Ex: Aula 1 - Introducao" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descricao</label>
                    <textarea value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none"
                      rows={2} placeholder="Descricao breve da aula" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL do Video</label>
                    <input type="url" value={lessonForm.video_url} onChange={e => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none"
                      placeholder="YouTube, Vimeo, Loom ou MP4 direto" />
                    <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                      <p>Formatos suportados:</p>
                      <p className="text-gray-500">• YouTube: youtube.com/watch?v=xxx ou youtu.be/xxx</p>
                      <p className="text-gray-500">• Vimeo: vimeo.com/xxx</p>
                      <p className="text-gray-500">• Loom: loom.com/share/xxx</p>
                      <p className="text-gray-500">• Supabase: URL publica do Storage</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ordem</label>
                    <input type="number" value={lessonForm.order_num} onChange={e => setLessonForm({ ...lessonForm, order_num: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none"
                      min={1} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={resetLessonForm} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-bold text-sm">Cancelar</button>
                    <button onClick={handleSaveLesson} className="flex-1 px-4 py-2 bg-[#6B1B8E] text-white rounded-xl font-bold text-sm hover:bg-[#5a1676]">
                      {editingLesson ? 'Salvar' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Course List View
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Sniff Academy</h2>
          <button
            onClick={() => { setEditingCourse(null); setShowCourseModal(true); }}
            className="bg-[#6B1B8E] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#4A1063] transition-all shadow-md"
          >
            <Plus size={20} /> Adicionar Curso
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <GraduationCap size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 font-bold">Nenhum curso cadastrado</p>
            <p className="text-gray-400 text-sm">Clique em "Adicionar Curso" para comecar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <div key={course.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-50 text-[#6B1B8E] rounded-xl">
                    <GraduationCap size={24} />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingCourse(course); setShowCourseModal(true); }} className="p-2 text-gray-400 hover:text-[#6B1B8E]"><Edit2 size={18}/></button>
                    <button onClick={() => handleDeleteCourse(course)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                  </div>
                </div>
                <h4 className="font-bold text-gray-800 mb-1">{course.title}</h4>
                <p className="text-sm text-gray-500 mb-4">{course.area}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-1 bg-green-50 text-green-600 rounded-full">{course.status}</span>
                  <button onClick={() => handleOpenCourse(course)} className="text-[#6B1B8E] text-sm font-bold flex items-center gap-1 hover:underline">Acessar <ChevronRight size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCourseModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{editingCourse ? 'Editar Curso' : 'Novo Curso'}</h3>
                <button onClick={() => setShowCourseModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
              </div>
              <form onSubmit={handleSaveCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titulo do Curso</label>
                  <input name="title" defaultValue={editingCourse?.title} required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#6B1B8E]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area / Categoria</label>
                  <select name="area" defaultValue={editingCourse?.area} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#6B1B8E]">
                    <option>Vendas</option>
                    <option>Logistica</option>
                    <option>RH</option>
                    <option>Tecnologia</option>
                    <option>Operacoes</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-[#6B1B8E] text-white py-3 rounded-xl font-bold shadow-md hover:bg-[#4A1063] transition-all">
                  {editingCourse ? 'Salvar Alteracoes' : 'Criar Curso'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 3. Recebimento Module
  const RecebimentoView = () => {
    const [recebimentos, setRecebimentos] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [sortBy, setSortBy] = useState('name');
    const [formData, setFormData] = useState({
      fornecedor: '',
      pedido_next: '',
      quantidade_caixas: '',
      transportadora: '',
      status: 'pendente',
      data: new Date().toISOString().split('T')[0],
      nota_fiscal: '',
      inicio_entrega: '',
      termino_entrega: '',
      revisionada: false,
      lancado_base: null
    });

    useEffect(() => {
      const loadRecebimentos = async () => {
        const { data, error } = await supabase.from('recebimentos').select('*').order('created_at', { ascending: false });
        if (data) setRecebimentos(data);
      };
      loadRecebimentos();
    }, []);

    const parseExtra = (observacoes) => {
      try {
        return JSON.parse(observacoes || '{}');
      } catch {
        return {};
      }
    };

    const getRecDate = (rec) => {
      if (rec.data_recebimento) {
        const [y, m, d] = rec.data_recebimento.split('-').map(Number);
        return new Date(y, m - 1, d);
      }
      const extra = parseExtra(rec.observacoes);
      if (extra.data) {
        const [y, m, d] = extra.data.split('-').map(Number);
        return new Date(y, m - 1, d);
      }
      return new Date(rec.created_at);
    };

    const filteredByPeriod = useMemo(() => {
      return recebimentos.filter(rec => {
        const d = getRecDate(rec);
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      });
    }, [recebimentos, selectedYear, selectedMonth]);

    const allYearData = useMemo(() => {
      return recebimentos.filter(rec => getRecDate(rec).getFullYear() === selectedYear);
    }, [recebimentos, selectedYear]);

    const totalRecebimentos = allYearData.length;
    const totalCaixas = allYearData.reduce((sum, r) => sum + (Number(r.quantidade_caixas) || 0), 0);
    const activeMonths = new Set(allYearData.map(r => getRecDate(r).getMonth())).size || 1;
    const mediaMensal = totalRecebimentos > 0 ? Math.round(totalRecebimentos / activeMonths) : 0;
    const mediaCaixasRec = totalRecebimentos > 0 ? Math.round(totalCaixas / totalRecebimentos) : 0;

    const monthlyData = useMemo(() => {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return months.map((month, idx) => {
        const count = recebimentos.filter(rec => {
          const d = getRecDate(rec);
          return d.getFullYear() === selectedYear && d.getMonth() === idx;
        }).length;
        return { month, recebimentos: count };
      });
    }, [recebimentos, selectedYear]);

    const fornecedorStats = useMemo(() => {
      const stats = {};
      allYearData.forEach(rec => {
        const f = rec.fornecedor || 'Sem fornecedor';
        if (!stats[f]) stats[f] = { entregas: 0, caixas: 0 };
        stats[f].entregas += 1;
        stats[f].caixas += Number(rec.quantidade_caixas) || 0;
      });
      return Object.entries(stats).map(([nome, data]) => ({
        nome,
        entregas: data.entregas,
        caixas: data.caixas,
        media: data.entregas > 0 ? Math.round(data.caixas / data.entregas) : 0
      })).sort((a, b) => b.caixas - a.caixas);
    }, [allYearData]);

    const top5Fornecedores = fornecedorStats.slice(0, 5);

    const sortedFornecedores = useMemo(() => {
      const sorted = [...fornecedorStats];
      if (sortBy === 'name') sorted.sort((a, b) => a.nome.localeCompare(b.nome));
      else if (sortBy === 'entregas') sorted.sort((a, b) => b.entregas - a.entregas);
      else if (sortBy === 'caixas') sorted.sort((a, b) => b.caixas - a.caixas);
      else if (sortBy === 'media') sorted.sort((a, b) => b.media - a.media);
      return sorted;
    }, [fornecedorStats, sortBy]);

    const resetForm = () => {
      setFormData({
        fornecedor: '',
        pedido_next: '',
        quantidade_caixas: '',
        transportadora: '',
        status: 'pendente',
        data: new Date().toISOString().split('T')[0],
        nota_fiscal: '',
        inicio_entrega: '',
        termino_entrega: '',
        revisionada: false,
        lancado_base: null
      });
      setEditingId(null);
      setShowForm(false);
    };

    const handleSave = async () => {
      const extra = {
        inicio_entrega: formData.inicio_entrega,
        termino_entrega: formData.termino_entrega,
        revisionada: formData.revisionada,
        lancado_base: formData.lancado_base
      };
      const payload = {
        fornecedor: formData.fornecedor,
        data_recebimento: formData.data,
        numero_nf: formData.nota_fiscal || null,
        pedido_next: formData.pedido_next || null,
        quantidade_caixas: Number(formData.quantidade_caixas),
        transportadora: formData.transportadora || null,
        status: formData.status,
        observacoes: JSON.stringify(extra),
        created_by: user?.id || null
      };
      if (editingId) {
        const { data, error } = await supabase.from('recebimentos').update(payload).eq('id', editingId).select();
        if (error) {
          alert('Erro ao salvar: ' + error.message);
          console.error('Update error:', error);
          return;
        }
        if (data && data.length > 0) {
          setRecebimentos(prev => prev.map(r => r.id === editingId ? data[0] : r));
        } else {
          alert('Nao foi possivel salvar. Verifique as permissoes da tabela no Supabase (RLS).');
          return;
        }
      } else {
        const { data, error } = await supabase.from('recebimentos').insert([payload]).select();
        if (error) {
          alert('Erro ao criar: ' + error.message);
          console.error('Insert error:', error);
          return;
        }
        if (data && data.length > 0) {
          setRecebimentos(prev => [data[0], ...prev]);
        }
      }
      resetForm();
    };

    const handleEdit = (rec) => {
      const extra = parseExtra(rec.observacoes);
      setFormData({
        fornecedor: rec.fornecedor || '',
        pedido_next: rec.pedido_next || '',
        quantidade_caixas: rec.quantidade_caixas || '',
        transportadora: rec.transportadora || '',
        status: rec.status || 'pendente',
        data: rec.data_recebimento || extra.data || new Date().toISOString().split('T')[0],
        nota_fiscal: rec.numero_nf || extra.nota_fiscal || '',
        inicio_entrega: extra.inicio_entrega || '',
        termino_entrega: extra.termino_entrega || '',
        revisionada: extra.revisionada || false,
        lancado_base: extra.lancado_base || null
      });
      setEditingId(rec.id);
      setShowForm(true);
    };

    const handleDelete = async (id) => {
      const { error } = await supabase.from('recebimentos').delete().eq('id', id);
      if (!error) setRecebimentos(prev => prev.filter(r => r.id !== id));
    };

    const exportCSV = () => {
      const headers = ['Fornecedor', 'Data', 'NF', 'Pedido NEXT', 'Caixas', 'Transportadora', 'Status'];
      const rows = filteredByPeriod.map(rec => {
        const extra = parseExtra(rec.observacoes);
        return [
          rec.fornecedor,
          rec.data_recebimento || extra.data || new Date(rec.created_at).toLocaleDateString('pt-BR'),
          rec.numero_nf || extra.nota_fiscal || '',
          rec.pedido_next || '',
          rec.quantidade_caixas || 0,
          rec.transportadora || '',
          rec.status || ''
        ];
      });
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recebimentos-${selectedYear}-${selectedMonth + 1}.csv`;
      a.click();
    };

    const months = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const years = [2024, 2025, 2026];

    return (
      <div className="space-y-6">
        {/* Year + Month Selector - sticky top */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
              {years.map(y => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedYear === y ? 'bg-white text-[#6B1B8E] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {y}
                </button>
              ))}
            </div>
            {/* KPI Summary inline */}
            <div className="flex items-center gap-4 text-sm">
              <span className="font-bold text-[#6B1B8E]">{totalRecebimentos} recebimentos</span>
              <span className="text-gray-300">|</span>
              <span className="font-bold text-[#F4B942]">{totalCaixas.toLocaleString('pt-BR')} caixas</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">Media: {mediaMensal}/mes ({mediaCaixasRec} cx/rec)</span>
            </div>
          </div>
          {/* Monthly Tabs */}
          <div className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {months.map((m, idx) => {
                const monthCount = monthlyData[idx]?.recebimentos || 0;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedMonth(idx)}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${selectedMonth === idx ? 'bg-[#6B1B8E] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    {m} {monthCount > 0 && <span className={`text-xs ml-1 ${selectedMonth === idx ? 'text-purple-200' : 'text-gray-400'}`}>({monthCount})</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Monthly Detail Table - RIGHT AFTER month selector for instant feedback */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-800">Detalhes - {months[selectedMonth]} {selectedYear}</h4>
              <p className="text-xs text-gray-400 mt-1">{filteredByPeriod.length} recebimentos | {filteredByPeriod.reduce((s, r) => s + (Number(r.quantidade_caixas) || 0), 0).toLocaleString('pt-BR')} caixas</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200">
                <Download size={16} /> CSV
              </button>
              <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#6B1B8E] text-white rounded-xl text-sm font-bold hover:bg-[#5a1676]">
                <Plus size={16} /> Novo
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase sticky top-0">
                <tr>
                  <th className="px-6 py-3">Fornecedor</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">NF</th>
                  <th className="px-6 py-3">Pedido NEXT</th>
                  <th className="px-6 py-3">Caixas</th>
                  <th className="px-6 py-3">Transportadora</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredByPeriod.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400">Nenhum recebimento neste periodo</td></tr>
                ) : filteredByPeriod.map(rec => {
                  const extra = parseExtra(rec.observacoes);
                  return (
                    <tr key={rec.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-800">{rec.fornecedor}</td>
                      <td className="px-6 py-3">{rec.data_recebimento ? new Date(rec.data_recebimento + 'T12:00:00').toLocaleDateString('pt-BR') : (extra.data ? new Date(extra.data + 'T12:00:00').toLocaleDateString('pt-BR') : new Date(rec.created_at).toLocaleDateString('pt-BR'))}</td>
                      <td className="px-6 py-3">{rec.numero_nf || extra.nota_fiscal || '-'}</td>
                      <td className="px-6 py-3">{rec.pedido_next || '-'}</td>
                      <td className="px-6 py-3">{(rec.quantidade_caixas || 0).toLocaleString('pt-BR')}</td>
                      <td className="px-6 py-3">{rec.transportadora || '-'}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${rec.status === 'concluido' || rec.status === 'entregue' ? 'bg-green-50 text-green-600' : rec.status === 'em_andamento' ? 'bg-blue-50 text-blue-600' : 'bg-yellow-50 text-yellow-600'}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(rec)} className="p-1 text-gray-600 hover:text-[#6B1B8E]"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(rec.id)} className="p-1 text-gray-600 hover:text-red-600"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics Section - chart + fornecedores below */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-gray-800">Recebimentos por Mes - {selectedYear}</h4>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="recebimentos" fill="#6B1B8E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top 5 Fornecedores */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h4 className="font-bold text-gray-800 mb-4">Top 5 Fornecedores</h4>
            <div className="space-y-3">
              {top5Fornecedores.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{f.nome}</p>
                    <p className="text-xs text-gray-500">{f.entregas} entregas</p>
                  </div>
                  <span className="text-sm font-black text-[#6B1B8E]">{f.caixas.toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Todos os Fornecedores */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-800">Todos os Fornecedores</h4>
              <div className="flex gap-2">
                <button onClick={() => setSortBy('name')} className={`px-3 py-1 rounded-lg text-xs font-bold ${sortBy === 'name' ? 'bg-[#6B1B8E] text-white' : 'bg-gray-100 text-gray-600'}`}>Nome</button>
                <button onClick={() => setSortBy('entregas')} className={`px-3 py-1 rounded-lg text-xs font-bold ${sortBy === 'entregas' ? 'bg-[#6B1B8E] text-white' : 'bg-gray-100 text-gray-600'}`}>Entregas</button>
                <button onClick={() => setSortBy('caixas')} className={`px-3 py-1 rounded-lg text-xs font-bold ${sortBy === 'caixas' ? 'bg-[#6B1B8E] text-white' : 'bg-gray-100 text-gray-600'}`}>Caixas</button>
                <button onClick={() => setSortBy('media')} className={`px-3 py-1 rounded-lg text-xs font-bold ${sortBy === 'media' ? 'bg-[#6B1B8E] text-white' : 'bg-gray-100 text-gray-600'}`}>Media</button>
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Fornecedor</th>
                    <th className="px-4 py-2 text-right">Entregas</th>
                    <th className="px-4 py-2 text-right">Caixas</th>
                    <th className="px-4 py-2 text-right">Media</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedFornecedores.map((f, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-800">{f.nome}</td>
                      <td className="px-4 py-2 text-right">{f.entregas}</td>
                      <td className="px-4 py-2 text-right">{f.caixas.toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-2 text-right">{f.media}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => resetForm()}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-[#6B1B8E] mb-4">{editingId ? 'Editar Recebimento' : 'Novo Recebimento'}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fornecedor *</label>
                  <input type="text" value={formData.fornecedor} onChange={e => setFormData({ ...formData, fornecedor: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data *</label>
                  <input type="date" value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nota Fiscal</label>
                  <input type="text" value={formData.nota_fiscal} onChange={e => setFormData({ ...formData, nota_fiscal: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pedido NEXT</label>
                  <input type="text" value={formData.pedido_next} onChange={e => setFormData({ ...formData, pedido_next: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantidade Caixas *</label>
                  <input type="number" value={formData.quantidade_caixas} onChange={e => setFormData({ ...formData, quantidade_caixas: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Transportadora</label>
                  <input type="text" value={formData.transportadora} onChange={e => setFormData({ ...formData, transportadora: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inicio Entrega</label>
                  <input type="time" value={formData.inicio_entrega} onChange={e => setFormData({ ...formData, inicio_entrega: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Termino Entrega</label>
                  <input type="time" value={formData.termino_entrega} onChange={e => setFormData({ ...formData, termino_entrega: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none">
                    <option value="pendente">Pendente</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="entregue">Entregue</option>
                    <option value="concluido">Concluido</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mt-6">
                    <input type="checkbox" checked={formData.revisionada} onChange={e => setFormData({ ...formData, revisionada: e.target.checked })} className="w-4 h-4 text-[#6B1B8E] rounded focus:ring-2 focus:ring-purple-200" />
                    Revisionada
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={resetForm} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50">Cancelar</button>
                <button onClick={handleSave} disabled={!formData.fornecedor || !formData.quantidade_caixas} className="flex-1 px-4 py-2 bg-[#6B1B8E] text-white rounded-xl text-sm font-bold hover:bg-[#5a1676] disabled:opacity-50">
                  {editingId ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 4. Agua Marinha Module
  const AguaMarinhaView = () => {
    const [defesaForm, setDefesaForm] = useState({ produto_nome: '', codigo_mlc: '', tipo: 'vendedor_novo', nome_invasor: '', descricao: '' });
    const [clipForm, setClipForm] = useState({ produto_nome: '', sku: '', responsavel: 'Mari' });
    const [editPiProduct, setEditPiProduct] = useState(null);
    const [piForm, setPiForm] = useState({ pi_atual: 0, pi_alvo: 0, estrategia: '' });
    const [showAddProduto, setShowAddProduto] = useState(false);
    const [novoProduto, setNovoProduto] = useState({ nome: '', mlc: '' });

    const allSubTabs = [
      { id: 'dashboard-am', label: 'Dashboard ML', icon: LayoutDashboard, permission: 'dashboard_am' },
      { id: 'checklist', label: 'Padrao Sniff', icon: CheckCircle2, permission: 'checklist' },
      { id: 'defesa', label: 'Defesa Catalogo', icon: ShieldCheck, permission: 'defesa' },
      { id: 'tracker', label: 'Tracker Clips', icon: Video, permission: 'tracker' },
      { id: 'preco', label: 'Semaforo PI', icon: DollarSign, permission: 'preco' },
      { id: 'sku-am', label: 'SKU Viability', icon: Target, permission: 'sku' },
      { id: 'sobre-am', label: 'Sobre', icon: Info, permission: 'sobre_am' },
    ];

    const subTabs = profile?.role === 'admin' ? allSubTabs : allSubTabs.filter(tab => profile?.permissions?.[tab.permission] === true);

    const toggleCheck = async (prodId, field, current) => {
      await supabase.from('am_produtos').update({ [field]: !current }).eq('id', prodId);
      setAmProdutos(prev => prev.map(p => p.id === prodId ? { ...p, [field]: !current } : p));
    };

    const handleAddDefesa = async () => {
      if (!defesaForm.produto_nome || !defesaForm.tipo) return;
      const { data } = await supabase.from('am_defesa_catalogo').insert([{ ...defesaForm, user_id: user.id }]).select();
      if (data) { setAmDefesa(prev => [data[0], ...prev]); setShowDefesaModal(false); setDefesaForm({ produto_nome: '', codigo_mlc: '', tipo: 'vendedor_novo', nome_invasor: '', descricao: '' }); }
    };

    const updateDefesaStatus = async (id, newStatus) => {
      await supabase.from('am_defesa_catalogo').update({ status: newStatus }).eq('id', id);
      setAmDefesa(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
    };

    const handleAddClip = async () => {
      if (!clipForm.produto_nome) return;
      const { data } = await supabase.from('am_clips').insert([{ ...clipForm, user_id: user.id }]).select();
      if (data) { setAmClips(prev => [data[0], ...prev]); setShowClipModal(false); setClipForm({ produto_nome: '', sku: '', responsavel: 'Mari' }); }
    };

    const updateClipStatus = async (id, newStatus) => {
      await supabase.from('am_clips').update({ status: newStatus }).eq('id', id);
      setAmClips(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    };

    const handleSavePi = async () => {
      if (!editPiProduct) return;
      await supabase.from('am_produtos').update({ pi_atual: piForm.pi_atual, pi_alvo: piForm.pi_alvo, estrategia: piForm.estrategia }).eq('id', editPiProduct.id);
      setAmProdutos(prev => prev.map(p => p.id === editPiProduct.id ? { ...p, ...piForm } : p));
      setEditPiProduct(null);
    };

    const handleAddProduto = async () => {
      if (!novoProduto.nome) return;
      const { data } = await supabase.from('am_produtos').insert([{ nome: novoProduto.nome, mlc: novoProduto.mlc }]).select();
      if (data) { setAmProdutos(prev => [...prev, data[0]]); setShowAddProduto(false); setNovoProduto({ nome: '', mlc: '' }); }
    };

    const checkFields = ['titulo_seo', 'campo_modelo', 'marca', 'capa', 'clip', 'afiliados', 'pi', 'ads', 'full_check'];
    const checkLabels = ['Titulo SEO', 'Modelo', 'Marca', 'Capa', 'Clip', 'Afiliados', 'PI', 'Ads', 'FULL'];
    const clipStatuses = ['pendente', 'produzindo', 'aprovacao', 'aprovado', 'publicado'];
    const clipStatusColors = { pendente: 'bg-gray-100 text-gray-600', produzindo: 'bg-blue-100 text-blue-700', aprovacao: 'bg-yellow-100 text-yellow-700', aprovado: 'bg-green-100 text-green-700', publicado: 'bg-purple-100 text-purple-700' };
    const defesaStatusColors = { pendente: 'bg-red-100 text-red-700', denunciado: 'bg-yellow-100 text-yellow-700', resolvido: 'bg-green-100 text-green-700' };
    const tipoLabels = { vendedor_novo: 'Vendedor Novo', titulo_alterado: 'Titulo Alterado', marca_alterada: 'Marca Alterada', info_alterada: 'Info Alterada' };

    // AM KPI data
    const amKpis = [
      { label: 'GMV Jan', atual: 'R$ 537k', meta: 'R$ 1.25M', pct: 43, color: 'red' },
      { label: 'Margem', atual: '2-3%', meta: '15%', pct: 17, color: 'red' },
      { label: 'TACoS', atual: '4%', meta: '2.5%', pct: 63, color: 'yellow' },
      { label: 'FULL', atual: '19%', meta: '80%', pct: 24, color: 'red' },
      { label: 'Curva A', atual: String(amProdutos.filter(p => checkFields.every(f => p[f])).length), meta: '20', pct: Math.round(amProdutos.filter(p => checkFields.every(f => p[f])).length / 20 * 100), color: 'red' },
      { label: 'Clips', atual: String(amClips.filter(c => c.status === 'publicado').length), meta: '200', pct: Math.round(amClips.filter(c => c.status === 'publicado').length / 200 * 100), color: 'red' },
      { label: 'Afiliados', atual: '7.9%', meta: '15%', pct: 53, color: 'yellow' },
    ];
    const kpiColor = (pct) => pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';

    const gmvData = [
      { mes: 'Set', real: 0, meta: 0 }, { mes: 'Out', real: 180, meta: 400 }, { mes: 'Nov', real: 320, meta: 600 },
      { mes: 'Dez', real: 420, meta: 800 }, { mes: 'Jan', real: 537, meta: 1250 }, { mes: 'Fev', real: 0, meta: 1500 },
    ];

    const renderSubContent = () => {
      switch (amSubTab) {
        case 'dashboard-am':
          return (
            <div className="space-y-6 animate-fadeIn">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {amKpis.map((k, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">{k.label}</p>
                    <p className="text-lg font-black text-gray-800">{k.atual}</p>
                    <p className="text-[10px] text-gray-400">Meta: {k.meta}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                      <div className={`h-1.5 rounded-full ${kpiColor(k.pct)}`} style={{ width: `${Math.min(k.pct, 100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* GMV Chart + Composition */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100">
                  <h3 className="font-bold mb-4">Evolucao GMV (R$ mil)</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gmvData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="real" fill="#6B1B8E" radius={[4,4,0,0]} name="Real" />
                        <Line type="monotone" dataKey="meta" stroke="#F4B942" strokeWidth={2} strokeDasharray="5 5" name="Meta" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100">
                  <h3 className="font-bold mb-4">Composicao Vendas</h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[{name: 'Top 20', value: 65}, {name: 'Outros', value: 35}]} innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                          <Cell fill="#6B1B8E" /><Cell fill="#F4B942" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#6B1B8E]"></span>Top 20</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#F4B942]"></span>Outros</span>
                  </div>
                </div>
              </div>
            </div>
          );

        case 'checklist':
          return (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2"><CheckCircle2 className="text-[#6B1B8E]" /> Padrao Sniff - Curva A Top 20</h3>
                <button onClick={() => setShowAddProduto(true)} className="flex items-center gap-1 bg-[#6B1B8E] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#4A1063]"><Plus size={14} /> Adicionar Produto</button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left p-3 text-xs font-bold text-gray-500 min-w-[200px]">Produto</th>
                      {checkLabels.map(l => <th key={l} className="p-3 text-xs font-bold text-gray-500 text-center min-w-[60px]">{l}</th>)}
                      <th className="p-3 text-xs font-bold text-gray-500 text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amProdutos.map(p => {
                      const score = checkFields.reduce((s, f) => s + (p[f] ? 1 : 0), 0);
                      const rowColor = score === 9 ? 'bg-green-50' : score >= 5 ? 'bg-yellow-50' : 'bg-red-50';
                      return (
                        <tr key={p.id} className={`border-b border-gray-50 ${rowColor} hover:brightness-95 transition-all`}>
                          <td className="p-3">
                            <p className="font-bold text-gray-800 text-xs">{p.nome}</p>
                            <p className="text-[10px] text-gray-400">{p.mlc}</p>
                          </td>
                          {checkFields.map(f => (
                            <td key={f} className="p-3 text-center">
                              <button onClick={() => toggleCheck(p.id, f, p[f])} className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${p[f] ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-[#6B1B8E]'}`}>
                                {p[f] && <CheckCircle size={14} />}
                              </button>
                            </td>
                          ))}
                          <td className="p-3 text-center">
                            <span className={`text-xs font-black px-2 py-1 rounded-full ${score === 9 ? 'bg-green-100 text-green-700' : score >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{score}/9</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Add Product Modal */}
              {showAddProduto && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddProduto(false)}>
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4">Adicionar Produto</h3>
                    <div className="space-y-3">
                      <input placeholder="Nome do Produto" value={novoProduto.nome} onChange={e => setNovoProduto({...novoProduto, nome: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-200" />
                      <input placeholder="Codigo MLC" value={novoProduto.mlc} onChange={e => setNovoProduto({...novoProduto, mlc: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-200" />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => setShowAddProduto(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50">Cancelar</button>
                      <button onClick={handleAddProduto} className="flex-1 py-2 bg-[#6B1B8E] text-white rounded-lg text-sm font-bold hover:bg-[#4A1063]">Salvar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );

        case 'defesa':
          return <DefesaCatalogo user={user} profile={profile} supabase={supabase} />;

        case 'tracker':
          const clipsMeta = 200;
          const clipsPublicados = amClips.filter(c => c.status === 'publicado').length;
          const clipsPorPessoa = ['Mari', 'Jonathan', 'Freelancer'].map(r => ({ nome: r, total: amClips.filter(c => c.responsavel === r).length, publicados: amClips.filter(c => c.responsavel === r && c.status === 'publicado').length }));
          return (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2"><Video className="text-[#6B1B8E]" /> Tracker Clips</h3>
                <button onClick={() => setShowClipModal(true)} className="flex items-center gap-1 bg-[#6B1B8E] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#4A1063]"><Plus size={14} /> Novo Clip</button>
              </div>
              {/* Progress bar */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-700">Progresso Clips</span>
                  <span className="text-sm font-black text-[#6B1B8E]">{clipsPublicados}/{clipsMeta}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4">
                  <div className="h-4 rounded-full bg-gradient-to-r from-[#6B1B8E] to-[#F4B942] transition-all" style={{ width: `${Math.min(clipsPublicados / clipsMeta * 100, 100)}%` }}></div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {clipsPorPessoa.map(p => (
                    <div key={p.nome} className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs font-bold text-gray-500">{p.nome}</p>
                      <p className="text-xl font-black text-gray-800">{p.total}</p>
                      <p className="text-[10px] text-gray-400">{p.publicados} publicados</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Clips Table */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className="text-left p-3 text-xs font-bold text-gray-500">Produto</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-500">SKU</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-500">Responsavel</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-500">Status</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-500">Data</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-500">Acao</th>
                  </tr></thead>
                  <tbody>
                    {amClips.map(c => {
                      const nextIdx = clipStatuses.indexOf(c.status) + 1;
                      const nextStatus = nextIdx < clipStatuses.length ? clipStatuses[nextIdx] : null;
                      return (
                        <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="p-3 font-bold text-xs">{c.produto_nome}</td>
                          <td className="p-3 text-xs text-gray-500">{c.sku || '-'}</td>
                          <td className="p-3 text-xs">{c.responsavel}</td>
                          <td className="p-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${clipStatusColors[c.status]}`}>{c.status}</span></td>
                          <td className="p-3 text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                          <td className="p-3">{nextStatus && <button onClick={() => updateClipStatus(c.id, nextStatus)} className="text-[10px] font-bold bg-[#6B1B8E] text-white px-2 py-1 rounded hover:bg-[#4A1063] flex items-center gap-1"><ArrowRight size={10} />{nextStatus}</button>}</td>
                        </tr>
                      );
                    })}
                    {amClips.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400 text-sm">Nenhum clip cadastrado.</td></tr>}
                  </tbody>
                </table>
              </div>
              {/* Modal Clip */}
              {showClipModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowClipModal(false)}>
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4">Novo Clip</h3>
                    <div className="space-y-3">
                      <select value={clipForm.produto_nome} onChange={e => setClipForm({...clipForm, produto_nome: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                        <option value="">Selecione o produto</option>
                        {amProdutos.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                      </select>
                      <input placeholder="SKU (opcional)" value={clipForm.sku} onChange={e => setClipForm({...clipForm, sku: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                      <select value={clipForm.responsavel} onChange={e => setClipForm({...clipForm, responsavel: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                        <option value="Mari">Mari</option>
                        <option value="Jonathan">Jonathan</option>
                        <option value="Freelancer">Freelancer</option>
                      </select>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => setShowClipModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50">Cancelar</button>
                      <button onClick={handleAddClip} className="flex-1 py-2 bg-[#6B1B8E] text-white rounded-lg text-sm font-bold hover:bg-[#4A1063]">Criar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );

        case 'preco':
          const piSemaforo = (atual, alvo) => {
            const diff = Number(atual) - Number(alvo);
            if (diff <= 2) return { color: 'bg-green-500', label: 'Bom', ring: 'ring-green-200' };
            if (diff <= 5) return { color: 'bg-yellow-500', label: 'Atencao', ring: 'ring-yellow-200' };
            return { color: 'bg-red-500', label: 'Critico', ring: 'ring-red-200' };
          };
          return (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-xl font-bold flex items-center gap-2"><DollarSign className="text-[#6B1B8E]" /> Semaforo PI - Top 20</h3>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className="text-left p-3 text-xs font-bold text-gray-500">Produto</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-500">PI Atual</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-500">PI Alvo</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-500">Semaforo</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-500">Estrategia</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-500">Acao</th>
                  </tr></thead>
                  <tbody>
                    {amProdutos.map(p => {
                      const sem = piSemaforo(p.pi_atual, p.pi_alvo);
                      return (
                        <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="p-3"><p className="font-bold text-xs">{p.nome}</p><p className="text-[10px] text-gray-400">{p.mlc}</p></td>
                          <td className="p-3 text-center font-bold">{p.pi_atual || '-'}</td>
                          <td className="p-3 text-center font-bold text-[#6B1B8E]">{p.pi_alvo || '-'}</td>
                          <td className="p-3 text-center"><span className={`inline-block w-4 h-4 rounded-full ${sem.color} ring-2 ${sem.ring}`} title={sem.label}></span></td>
                          <td className="p-3 text-center text-xs">{p.estrategia || '-'}</td>
                          <td className="p-3 text-center">
                            <button onClick={() => { setEditPiProduct(p); setPiForm({ pi_atual: p.pi_atual || 0, pi_alvo: p.pi_alvo || 0, estrategia: p.estrategia || '' }); }} className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200"><Edit2 size={10} className="inline mr-1" />Editar</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* PI Edit Modal */}
              {editPiProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditPiProduct(null)}>
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-2">Editar PI</h3>
                    <p className="text-sm text-gray-500 mb-4">{editPiProduct.nome}</p>
                    <div className="space-y-3">
                      <div><label className="text-xs font-bold text-gray-500">PI Atual</label><input type="number" value={piForm.pi_atual} onChange={e => setPiForm({...piForm, pi_atual: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" /></div>
                      <div><label className="text-xs font-bold text-gray-500">PI Alvo</label><input type="number" value={piForm.pi_alvo} onChange={e => setPiForm({...piForm, pi_alvo: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" /></div>
                      <div><label className="text-xs font-bold text-gray-500">Estrategia</label>
                        <select value={piForm.estrategia} onChange={e => setPiForm({...piForm, estrategia: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                          <option value="">Selecione</option><option value="Agressivo">Agressivo</option><option value="Briga">Briga</option><option value="Estavel">Estavel</option><option value="Manter">Manter</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => setEditPiProduct(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50">Cancelar</button>
                      <button onClick={handleSavePi} className="flex-1 py-2 bg-[#6B1B8E] text-white rounded-lg text-sm font-bold hover:bg-[#4A1063]">Salvar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );

        case 'sku-am':
          return (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 space-y-6">
              <h3 className="text-xl font-bold">SKU Viability</h3>
              <p className="text-gray-500 text-sm">Analise de viabilidade de SKUs para o catalogo Agua Marinha.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[{label: 'SKUs Ativos', value: String(amProdutos.length), color: 'green'}, {label: 'Checklist Completo', value: String(amProdutos.filter(p => checkFields.every(f => p[f])).length), color: 'blue'}, {label: 'Clips Publicados', value: String(amClips.filter(c => c.status === 'publicado').length), color: 'purple'}].map(s => (
                  <div key={s.label} className="p-4 rounded-xl border bg-gray-50 border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-bold">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          );

        case 'sobre-am':
          return (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 max-w-2xl">
              <h3 className="text-xl font-bold mb-4">Sobre o Projeto</h3>
              <p className="text-gray-600 leading-relaxed">
                O modulo Agua Marinha e o braco tatico do Grupo Sniff focado em inteligencia competitiva e penetracao de mercado.
                Atraves deste portal, consolidamos todas as acoes ofensivas e defensivas para garantir a lideranca do grupo nos
                territorios prioritarios.
              </p>
            </div>
          );

        default: return null;
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
          {subTabs.map(tab => (
            <button key={tab.id} onClick={() => setAmSubTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${amSubTab === tab.id ? 'bg-white text-[#6B1B8E] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <tab.icon size={16} />{tab.label}
            </button>
          ))}
        </div>
        {renderSubContent()}
      </div>
    );
  };

  // === VENDEDOR VIEW: BaseLinker Products with 3 Price Levels ===
  const VendedorView = () => {
    const [editingProduct, setEditingProduct] = useState(null);
    const [priceForm, setPriceForm] = useState({ preco_1: 0, preco_2: 0, preco_3: 0 });

    // Sync with BaseLinker API
    const syncBaseLinker = async () => {
      setVendedorSyncing(true);
      try {
        const response = await fetch('/api/baselinker/products');
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Erro ao buscar produtos');
        }

        // Map BaseLinker products to our schema
        const products = data.products.map(p => ({
          sku: p.sku || '',
          nome: p.name || '',
          ean: p.ean || '',
          estoque: p.stock || 0,
          preco_1: p.price1 || 0,
          preco_2: p.price2 || 0,
          preco_3: p.price3 || 0,
          categoria: p.category || '',
          marca: '',
        }));

        // Upsert to Supabase
        let updated = 0, inserted = 0;
        for (const prod of products) {
          if (!prod.sku && !prod.nome) continue;
          const { data: existing } = await supabase.from('vendedor_produtos').select('id').eq('sku', prod.sku).single();
          if (existing) {
            await supabase.from('vendedor_produtos').update(prod).eq('id', existing.id);
            updated++;
          } else {
            await supabase.from('vendedor_produtos').insert([prod]);
            inserted++;
          }
        }

        // Reload from Supabase
        const { data: refreshed } = await supabase.from('vendedor_produtos').select('*').order('nome', { ascending: true });
        setVendedorProdutos(refreshed || []);

        // Save sync timestamp
        const now = new Date().toISOString();
        localStorage.setItem('vendedor-last-sync', now);
        setVendedorLastSync(now);

        alert(`Sync concluido! ${inserted} novos, ${updated} atualizados. Total: ${products.length} produtos.`);
      } catch (err) {
        console.error('Sync error:', err);
        alert('Erro ao sincronizar: ' + err.message);
      }
      setVendedorSyncing(false);
    };

    // Parse CSV from BaseLinker
    const parseCSV = (text) => {
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) return [];
      const headers = lines[0].split(';').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      return lines.slice(1).map(line => {
        const values = line.split(';').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ''; });
        return obj;
      });
    };

    // Handle file upload
    const handleFileUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setVendedorUploading(true);
      try {
        const text = await file.text();
        let products = [];
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          products = Array.isArray(json) ? json : json.products || json.data || [];
        } else {
          products = parseCSV(text);
        }
        // Map to our schema
        const mapped = products.map(p => ({
          sku: p.sku || p.codigo || p.id || '',
          nome: p.nome || p.name || p.produto || p.title || '',
          ean: p.ean || p.gtin || p.barcode || '',
          estoque: Number(p.estoque || p.stock || p.quantity || 0),
          preco_1: Number(p.preco_1 || p.preco || p.price || p.price_1 || 0),
          preco_2: Number(p.preco_2 || p.price_2 || 0),
          preco_3: Number(p.preco_3 || p.price_3 || 0),
          categoria: p.categoria || p.category || '',
          marca: p.marca || p.brand || '',
        }));
        // Upsert to Supabase
        for (const prod of mapped) {
          if (!prod.sku && !prod.nome) continue;
          const { data: existing } = await supabase.from('vendedor_produtos').select('id').eq('sku', prod.sku).single();
          if (existing) {
            await supabase.from('vendedor_produtos').update(prod).eq('id', existing.id);
          } else {
            await supabase.from('vendedor_produtos').insert([prod]);
          }
        }
        // Reload
        const { data } = await supabase.from('vendedor_produtos').select('*').order('nome', { ascending: true });
        setVendedorProdutos(data || []);
        alert(`${mapped.length} produtos importados/atualizados!`);
      } catch (err) {
        alert('Erro ao processar arquivo: ' + err.message);
      }
      setVendedorUploading(false);
      e.target.value = '';
    };

    // Update prices
    const handleSavePrices = async () => {
      if (!editingProduct) return;
      await supabase.from('vendedor_produtos').update({
        preco_1: priceForm.preco_1,
        preco_2: priceForm.preco_2,
        preco_3: priceForm.preco_3
      }).eq('id', editingProduct.id);
      setVendedorProdutos(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...priceForm } : p));
      setEditingProduct(null);
    };

    // Delete product
    const handleDelete = async (id) => {
      if (!confirm('Excluir este produto?')) return;
      await supabase.from('vendedor_produtos').delete().eq('id', id);
      setVendedorProdutos(prev => prev.filter(p => p.id !== id));
    };

    // Filter products
    const filtered = vendedorProdutos.filter(p =>
      p.nome?.toLowerCase().includes(vendedorSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(vendedorSearch.toLowerCase()) ||
      p.ean?.includes(vendedorSearch)
    );

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ClipboardList className="text-[#6B1B8E]" /> Area do Vendedor
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Cadastro BaseLinker - {vendedorProdutos.length} produtos
              {vendedorLastSync && (
                <span className="ml-2 text-xs text-gray-400">
                  (Ultimo sync: {new Date(vendedorLastSync).toLocaleString('pt-BR')})
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={syncBaseLinker}
              disabled={vendedorSyncing}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${vendedorSyncing ? 'bg-gray-200 text-gray-500' : 'bg-green-600 text-white hover:bg-green-700'}`}
            >
              <RefreshCw size={16} className={vendedorSyncing ? 'animate-spin' : ''} />
              {vendedorSyncing ? 'Sincronizando...' : 'Sync BaseLinker'}
            </button>
            <label className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all ${vendedorUploading ? 'bg-gray-200 text-gray-500' : 'bg-[#6B1B8E] text-white hover:bg-[#4A1063]'}`}>
              <Download size={16} />
              {vendedorUploading ? 'Importando...' : 'Importar CSV/JSON'}
              <input type="file" accept=".csv,.json" onChange={handleFileUpload} className="hidden" disabled={vendedorUploading} />
            </label>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, SKU ou EAN..."
              value={vendedorSearch}
              onChange={e => setVendedorSearch(e.target.value)}
              className="flex-1 outline-none text-sm"
            />
            {vendedorSearch && (
              <button onClick={() => setVendedorSearch('')} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Produtos', value: vendedorProdutos.length, color: 'purple' },
            { label: 'Com Estoque', value: vendedorProdutos.filter(p => p.estoque > 0).length, color: 'green' },
            { label: 'Sem Estoque', value: vendedorProdutos.filter(p => p.estoque === 0).length, color: 'red' },
            { label: 'Sem Preco', value: vendedorProdutos.filter(p => !p.preco_1).length, color: 'yellow' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase">{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.color === 'purple' ? 'text-[#6B1B8E]' : s.color === 'green' ? 'text-green-600' : s.color === 'red' ? 'text-red-600' : 'text-yellow-600'}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left p-3 text-xs font-bold text-gray-500">SKU</th>
                  <th className="text-left p-3 text-xs font-bold text-gray-500">Produto</th>
                  <th className="text-left p-3 text-xs font-bold text-gray-500">EAN</th>
                  <th className="text-center p-3 text-xs font-bold text-gray-500">Estoque</th>
                  <th className="text-center p-3 text-xs font-bold text-gray-500 bg-green-50">Preco 1</th>
                  <th className="text-center p-3 text-xs font-bold text-gray-500 bg-yellow-50">Preco 2</th>
                  <th className="text-center p-3 text-xs font-bold text-gray-500 bg-red-50">Preco 3</th>
                  <th className="text-center p-3 text-xs font-bold text-gray-500">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      {vendedorProdutos.length === 0 ? 'Nenhum produto cadastrado. Importe um arquivo CSV ou JSON do BaseLinker.' : 'Nenhum produto encontrado.'}
                    </td>
                  </tr>
                ) : (
                  filtered.slice(0, 100).map(p => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-mono text-xs text-gray-600">{p.sku || '-'}</td>
                      <td className="p-3">
                        <p className="font-bold text-gray-800 text-xs">{p.nome}</p>
                        {p.categoria && <p className="text-[10px] text-gray-400">{p.categoria}</p>}
                      </td>
                      <td className="p-3 font-mono text-xs text-gray-500">{p.ean || '-'}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.estoque > 10 ? 'bg-green-100 text-green-700' : p.estoque > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {p.estoque}
                        </span>
                      </td>
                      <td className="p-3 text-center bg-green-50/50 font-bold text-green-700">
                        {p.preco_1 ? `R$ ${Number(p.preco_1).toFixed(2)}` : '-'}
                      </td>
                      <td className="p-3 text-center bg-yellow-50/50 font-bold text-yellow-700">
                        {p.preco_2 ? `R$ ${Number(p.preco_2).toFixed(2)}` : '-'}
                      </td>
                      <td className="p-3 text-center bg-red-50/50 font-bold text-red-700">
                        {p.preco_3 ? `R$ ${Number(p.preco_3).toFixed(2)}` : '-'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setEditingProduct(p); setPriceForm({ preco_1: p.preco_1 || 0, preco_2: p.preco_2 || 0, preco_3: p.preco_3 || 0 }); }}
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-[#6B1B8E] hover:text-white transition-colors"
                            title="Editar Precos"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-500 hover:text-white transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 100 && (
            <div className="p-3 text-center text-xs text-gray-400 border-t border-gray-100">
              Mostrando 100 de {filtered.length} produtos. Use a busca para filtrar.
            </div>
          )}
        </div>

        {/* Edit Prices Modal */}
        {editingProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingProduct(null)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-2">Editar Precos</h3>
              <p className="text-sm text-gray-500 mb-4">{editingProduct.nome}</p>
              <p className="text-xs text-gray-400 mb-4">SKU: {editingProduct.sku || '-'}</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-green-600 uppercase">Preco Nivel 1 (Principal)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={priceForm.preco_1}
                    onChange={e => setPriceForm({ ...priceForm, preco_1: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-green-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-200 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-yellow-600 uppercase">Preco Nivel 2</label>
                  <input
                    type="number"
                    step="0.01"
                    value={priceForm.preco_2}
                    onChange={e => setPriceForm({ ...priceForm, preco_2: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-yellow-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-200 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-red-600 uppercase">Preco Nivel 3</label>
                  <input
                    type="number"
                    step="0.01"
                    value={priceForm.preco_3}
                    onChange={e => setPriceForm({ ...priceForm, preco_3: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-200 mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setEditingProduct(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50">Cancelar</button>
                <button onClick={handleSavePrices} className="flex-1 py-2 bg-[#6B1B8E] text-white rounded-lg text-sm font-bold hover:bg-[#4A1063]">Salvar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 5. Pedido Fornecedor View
  const PedidoFornecedorView = () => {
    const [pedidos, setPedidos] = useState([]);
    const showForm = pedidoShowForm;
    const setShowForm = setPedidoShowForm;
    const [activeFilter, setActiveFilter] = useState('todos');
    const [respondingTo, setRespondingTo] = useState(null);
    const [viewingDetail, setViewingDetail] = useState(null);
    const [dbReady, setDbReady] = useState(true);
    const [responseData, setResponseData] = useState({ preco_resposta: '', prazo_resposta: '' });

    // Load pedidos from Supabase
    useEffect(() => {
      const loadPedidos = async () => {
        try {
          const { data, error } = await supabase
            .from('pedidos_fornecedor')
            .select('*')
            .order('created_at', { ascending: false });
          if (data) { setPedidos(data); setDbReady(true); }
          if (error) {
            console.warn('Pedidos table error:', error.message);
            setDbReady(false);
          }
        } catch (e) {
          console.warn('DB connection error');
          setDbReady(false);
        }
      };
      loadPedidos();
    }, []);

    const generateOC = () => {
      const num = String(pedidos.length + 1).padStart(3, '0');
      return `OC-2026-${num}`;
    };

    // calcTotals kept for handleDownloadPDF and handleCreatePedido

    const calcTotals = (items) => {
      let valor = 0, peso = 0, qtd = 0;
      (items || []).forEach(item => {
        const q = Number(item.quantidade) || 0;
        valor += q * (Number(item.preco_unitario) || 0);
        peso += q * (Number(item.peso_unitario) || 0);
        qtd += q;
      });
      return { valor_total: valor, peso_total: peso, quantidade_total: qtd };
    };

    const handleCreatePedido = async (formData) => {
      const totals = calcTotals(formData.items);
      const produtoResumo = formData.items.map(i => i.sku ? `${i.sku} (${i.quantidade})` : `${i.produto} (${i.quantidade})`).join(', ');
      const newPedido = {
        numero_oc: generateOC(),
        fornecedor: formData.fornecedor,
        items: formData.items.map(i => ({
          sku: i.sku,
          produto: i.produto,
          quantidade: Number(i.quantidade) || 0,
          preco_unitario: Number(i.preco_unitario) || 0,
          peso_unitario: Number(i.peso_unitario) || 0,
          valor_total: (Number(i.quantidade) || 0) * (Number(i.preco_unitario) || 0),
        })),
        produto: produtoResumo,
        quantidade: totals.quantidade_total,
        valor_total: totals.valor_total,
        peso_total: totals.peso_total,
        prazo_entrega: formData.prazo_entrega,
        observacoes: formData.observacoes,
        status: 'pendente',
        created_at: new Date().toISOString(),
      };
      try {
        const { data, error } = await supabase.from('pedidos_fornecedor').insert([newPedido]).select();
        if (data && data[0]) {
          setPedidos(prev => [data[0], ...prev]);
        } else if (error) {
          console.error('Insert error:', error.message);
          alert('Erro ao salvar: ' + error.message + '\n\nVerifique se a tabela pedidos_fornecedor existe no Supabase.');
          return false;
        }
      } catch (e) {
        console.error('DB error:', e);
        alert('Erro de conexao com banco de dados.');
        return false;
      }
      setShowForm(false);
    };

    const handleResponder = async (pedido) => {
      const updated = { ...pedido, status: 'respondida', preco_resposta: Number(responseData.preco_resposta), prazo_resposta: responseData.prazo_resposta, responded_at: new Date().toISOString() };
      try {
        await supabase.from('pedidos_fornecedor').update({ status: 'respondida', preco_resposta: updated.preco_resposta, prazo_resposta: updated.prazo_resposta, responded_at: updated.responded_at }).eq('id', pedido.id);
      } catch {}
      setPedidos(prev => prev.map(p => p.id === pedido.id ? updated : p));
      setRespondingTo(null);
      setResponseData({ preco_resposta: '', prazo_resposta: '' });
    };

    const handleUpdateStatus = async (pedido, newStatus) => {
      try {
        await supabase.from('pedidos_fornecedor').update({ status: newStatus }).eq('id', pedido.id);
      } catch {}
      setPedidos(prev => prev.map(p => p.id === pedido.id ? { ...p, status: newStatus } : p));
    };

    const handleDeletePedido = async (pedido) => {
      if (!confirm(`Excluir pedido ${pedido.numero_oc}?`)) return;
      try {
        await supabase.from('pedidos_fornecedor').delete().eq('id', pedido.id);
      } catch {}
      setPedidos(prev => prev.filter(p => p.id !== pedido.id));
    };

    const handleDownloadPDF = (pedido) => {
      const items = pedido.items || [];
      const t = calcTotals(items);
      const rows = items.map((item, i) => `
        <tr>
          <td style="border:1px solid #ddd;padding:8px;text-align:center">${i + 1}</td>
          <td style="border:1px solid #ddd;padding:8px">${item.sku || '-'}</td>
          <td style="border:1px solid #ddd;padding:8px">${item.produto || '-'}</td>
          <td style="border:1px solid #ddd;padding:8px;text-align:center">${item.quantidade || 0}</td>
          <td style="border:1px solid #ddd;padding:8px;text-align:right">R$ ${Number(item.preco_unitario || 0).toFixed(2)}</td>
          <td style="border:1px solid #ddd;padding:8px;text-align:right">R$ ${((Number(item.quantidade) || 0) * (Number(item.preco_unitario) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        </tr>`).join('');

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${pedido.numero_oc}</title>
        <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}
        .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;border-bottom:3px solid #6B1B8E;padding-bottom:15px}
        .logo{font-size:28px;font-weight:bold;color:#6B1B8E}
        .logo span{color:#F4B942}
        .oc-num{font-size:22px;color:#6B1B8E;font-weight:bold}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:25px}
        .info-box{background:#f9f5ff;border-radius:8px;padding:12px}
        .info-label{font-size:11px;color:#888;text-transform:uppercase;margin-bottom:4px}
        .info-value{font-size:14px;font-weight:600}
        table{width:100%;border-collapse:collapse;margin-bottom:20px}
        th{background:#6B1B8E;color:white;padding:10px 8px;text-align:left;font-size:12px}
        .totals{background:#f9f5ff;border-radius:8px;padding:15px;display:flex;justify-content:space-between}
        .total-item{text-align:center}
        .total-label{font-size:11px;color:#888;text-transform:uppercase}
        .total-value{font-size:18px;font-weight:bold;color:#6B1B8E}
        .footer{margin-top:40px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:15px}
        @media print{body{padding:20px}}</style></head>
        <body>
          <div class="header">
            <div class="logo">SNIFF <span>GROUP</span></div>
            <div class="oc-num">${pedido.numero_oc}</div>
          </div>
          <div class="info-grid">
            <div class="info-box"><div class="info-label">Fornecedor</div><div class="info-value">${pedido.fornecedor || '-'}</div></div>
            <div class="info-box"><div class="info-label">Data do Pedido</div><div class="info-value">${pedido.created_at ? new Date(pedido.created_at).toLocaleDateString('pt-BR') : '-'}</div></div>
            <div class="info-box"><div class="info-label">Status</div><div class="info-value">${(pedido.status || 'pendente').charAt(0).toUpperCase() + (pedido.status || 'pendente').slice(1)}</div></div>
            <div class="info-box"><div class="info-label">Prazo de Entrega</div><div class="info-value">${pedido.prazo_entrega ? new Date(pedido.prazo_entrega).toLocaleDateString('pt-BR') : 'Nao informado'}</div></div>
          </div>
          <h3 style="color:#6B1B8E;margin-bottom:10px">Itens do Pedido</h3>
          <table>
            <thead><tr><th>#</th><th>SKU</th><th>Produto</th><th>Qtd</th><th>Preco Unit.</th><th>Subtotal</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="totals">
            <div class="total-item"><div class="total-label">Total Itens</div><div class="total-value">${items.length}</div></div>
            <div class="total-item"><div class="total-label">Total Unidades</div><div class="total-value">${t.quantidade_total}</div></div>
            <div class="total-item"><div class="total-label">Peso Total</div><div class="total-value">${t.peso_total.toFixed(2)} kg</div></div>
            <div class="total-item"><div class="total-label">Valor Total</div><div class="total-value">R$ ${t.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></div>
          </div>
          ${pedido.observacoes ? `<div style="margin-top:20px"><strong>Observacoes:</strong><p style="color:#555">${pedido.observacoes}</p></div>` : ''}
          <div class="footer">Documento gerado em ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR')} - SNIFF GROUP Portal</div>
        </body></html>`;

      const w = window.open('', '_blank');
      w.document.write(html);
      w.document.close();
      w.onload = () => { w.print(); };
    };

    const filteredPedidos = pedidos.filter(p => {
      if (activeFilter === 'todos') return true;
      return p.status === activeFilter;
    });

    const totalOrdens = pedidos.length;
    const tempoMedioResposta = (() => {
      const responded = pedidos.filter(p => p.responded_at && p.created_at);
      if (responded.length === 0) return 0;
      const totalDays = responded.reduce((sum, p) => {
        return sum + (new Date(p.responded_at) - new Date(p.created_at)) / (1000 * 60 * 60 * 24);
      }, 0);
      return (totalDays / responded.length).toFixed(1);
    })();
    const taxaAprovacao = totalOrdens > 0 ? ((pedidos.filter(p => p.status === 'aprovada').length / totalOrdens) * 100).toFixed(0) : 0;
    const volumePendente = pedidos.filter(p => p.status === 'pendente').reduce((sum, p) => sum + (p.valor_total || 0), 0);

    const statusConfig = {
      pendente: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={14} /> },
      respondida: { color: 'bg-blue-100 text-blue-800', icon: <AlertCircle size={14} /> },
      aprovada: { color: 'bg-green-100 text-green-800', icon: <CheckCircle size={14} /> },
      rejeitada: { color: 'bg-red-100 text-red-800', icon: <XCircle size={14} /> },
    };

    const filters = [
      { key: 'todos', label: 'Minhas Solicitacoes' },
      { key: 'pendente', label: 'Pendentes Resposta' },
      { key: 'aprovada', label: 'Aprovadas' },
    ];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pedidos Fornecedor</h1>
            <p className="text-gray-500">Gestao de ordens de compra e cotacoes</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-xl" style={{ backgroundColor: COLORS.purple }}>
            <Plus size={18} /> Nova Ordem
          </button>
        </div>

        {/* DB Warning */}
        {!dbReady && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="font-medium text-red-800">Tabela nao encontrada no Supabase</p>
              <p className="text-red-600 text-sm mt-1">A tabela <code className="bg-red-100 px-1 rounded">pedidos_fornecedor</code> precisa ser criada. Acesse o Supabase SQL Editor e execute o SQL de criacao.</p>
              <button onClick={() => window.open('/api/debug/create-pedidos-table', '_blank')} className="mt-2 text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium">Ver SQL de Criacao</button>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { title: 'Total de Ordens', value: totalOrdens, icon: <ClipboardList size={24} />, color: COLORS.purple },
            { title: 'Tempo Medio Resposta', value: `${tempoMedioResposta}d`, icon: <Clock size={24} />, color: '#3B82F6' },
            { title: 'Taxa de Aprovacao', value: `${taxaAprovacao}%`, icon: <CheckCircle size={24} />, color: '#10B981' },
            { title: 'Volume Pendente', value: `R$ ${volumePendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <DollarSign size={24} />, color: COLORS.gold },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{kpi.title}</span>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: kpi.color }}>{kpi.icon}</div>
              </div>
              <p className="text-2xl font-bold text-gray-800">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {filters.map(f => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeFilter === f.key ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              style={activeFilter === f.key ? { backgroundColor: COLORS.purple } : {}}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b" style={{ backgroundColor: '#F9FAFB' }}>
                  <th className="px-4 py-3">Numero OC</th>
                  <th className="px-4 py-3">Fornecedor</th>
                  <th className="px-4 py-3">Produtos</th>
                  <th className="px-4 py-3">Itens</th>
                  <th className="px-4 py-3">Valor Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredPedidos.length === 0 ? (
                  <tr><td colSpan="8" className="px-4 py-12 text-center text-gray-400">Nenhum pedido encontrado</td></tr>
                ) : filteredPedidos.map(p => (
                  <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.numero_oc}</td>
                    <td className="px-4 py-3 text-gray-600">{p.fornecedor}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={p.produto}>{p.items?.length ? p.items.map(i => i.sku || i.produto).join(', ') : p.produto}</td>
                    <td className="px-4 py-3 text-gray-600">{p.items?.length || 1} ({p.quantidade || p.items?.reduce((s, i) => s + (Number(i.quantidade) || 0), 0) || 0} un)</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">R$ {(p.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[p.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                        {statusConfig[p.status]?.icon} {p.status?.charAt(0).toUpperCase() + p.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {p.status === 'pendente' && (
                          <button onClick={() => { setRespondingTo(p); setResponseData({ preco_resposta: '', prazo_resposta: '' }); }} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50" title="Responder"><Send size={15} /></button>
                        )}
                        {p.status === 'respondida' && (
                          <>
                            <button onClick={() => handleUpdateStatus(p, 'aprovada')} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50" title="Aprovar"><CheckCircle size={15} /></button>
                            <button onClick={() => handleUpdateStatus(p, 'rejeitada')} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50" title="Rejeitar"><XCircle size={15} /></button>
                          </>
                        )}
                        <button onClick={() => handleDownloadPDF(p)} className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50" title="Baixar PDF"><Download size={15} /></button>
                        <button onClick={() => setViewingDetail(p)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100" title="Ver Detalhes"><Eye size={15} /></button>
                        <button onClick={() => handleDeletePedido(p)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50" title="Excluir"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Order Modal - extracted component to fix input focus bug */}
        <NovaOrdemModal isOpen={showForm} onClose={() => setShowForm(false)} onSubmit={handleCreatePedido} />

        {/* Response Modal */}
        {respondingTo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-bold text-gray-800">Responder {respondingTo.numero_oc}</h3>
                <button onClick={() => setRespondingTo(null)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                  <p><span className="text-gray-500">Fornecedor:</span> {respondingTo.fornecedor}</p>
                  {respondingTo.items?.length > 0 ? respondingTo.items.map((item, idx) => (
                    <p key={idx}><span className="text-gray-500">{item.sku || `Item ${idx+1}`}:</span> {item.produto} x {item.quantidade}</p>
                  )) : (
                    <p><span className="text-gray-500">Produto:</span> {respondingTo.produto} x {respondingTo.quantidade}</p>
                  )}
                  <p className="font-medium pt-1" style={{ color: COLORS.purple }}>Total: R$ {(respondingTo.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preco Ofertado (R$)</label>
                  <input type="number" step="0.01" value={responseData.preco_resposta} onChange={e => setResponseData({ ...responseData, preco_resposta: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de Entrega</label>
                  <input type="date" value={responseData.prazo_resposta} onChange={e => setResponseData({ ...responseData, prazo_resposta: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2" />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button onClick={() => setRespondingTo(null)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancelar</button>
                <button onClick={() => handleResponder(respondingTo)} disabled={!responseData.preco_resposta || !responseData.prazo_resposta} className="px-4 py-2 text-white rounded-xl disabled:opacity-50" style={{ backgroundColor: COLORS.purple }}>Enviar Resposta</button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {viewingDetail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-bold text-gray-800">Detalhes {viewingDetail.numero_oc}</h3>
                <button onClick={() => setViewingDetail(null)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-gray-500">Fornecedor:</span><p className="font-medium">{viewingDetail.fornecedor}</p></div>
                  <div><span className="text-gray-500">Status:</span><p><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[viewingDetail.status]?.color}`}>{statusConfig[viewingDetail.status]?.icon} {viewingDetail.status?.charAt(0).toUpperCase() + viewingDetail.status?.slice(1)}</span></p></div>
                  <div><span className="text-gray-500">Prazo Entrega:</span><p className="font-medium">{viewingDetail.prazo_entrega || '-'}</p></div>
                  <div><span className="text-gray-500">Criado em:</span><p className="font-medium">{viewingDetail.created_at ? new Date(viewingDetail.created_at).toLocaleDateString('pt-BR') : '-'}</p></div>
                </div>

                {/* Items Table */}
                {viewingDetail.items?.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-gray-500 mb-2 font-medium">Itens do Pedido ({viewingDetail.items.length})</p>
                    <div className="border rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead><tr className="bg-gray-50 text-gray-500 text-left">
                          <th className="px-3 py-2">SKU</th><th className="px-3 py-2">Produto</th><th className="px-3 py-2 text-right">Qtd</th><th className="px-3 py-2 text-right">Preco Un.</th><th className="px-3 py-2 text-right">Subtotal</th>
                        </tr></thead>
                        <tbody>{viewingDetail.items.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-3 py-2 text-gray-600">{item.sku || '-'}</td>
                            <td className="px-3 py-2 font-medium">{item.produto}</td>
                            <td className="px-3 py-2 text-right">{item.quantidade}</td>
                            <td className="px-3 py-2 text-right">R$ {(Number(item.preco_unitario) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="px-3 py-2 text-right font-medium">R$ {((Number(item.quantidade) || 0) * (Number(item.preco_unitario) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div><span className="text-gray-500">Produto:</span><p className="font-medium">{viewingDetail.produto}</p></div>
                    <div><span className="text-gray-500">Quantidade:</span><p className="font-medium">{viewingDetail.quantidade}</p></div>
                  </div>
                )}

                {/* Totals */}
                <div className="bg-purple-50 rounded-xl p-3 grid grid-cols-3 gap-2">
                  <div><span className="text-gray-500">Qtd Total:</span><p className="font-bold" style={{ color: COLORS.purple }}>{viewingDetail.quantidade || viewingDetail.items?.reduce((s, i) => s + (Number(i.quantidade) || 0), 0) || 0}</p></div>
                  <div><span className="text-gray-500">Valor Total:</span><p className="font-bold" style={{ color: COLORS.purple }}>R$ {(viewingDetail.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
                  <div><span className="text-gray-500">Peso Total:</span><p className="font-bold" style={{ color: COLORS.purple }}>{(viewingDetail.peso_total || 0).toFixed(2)} kg</p></div>
                </div>

                {viewingDetail.preco_resposta && (
                  <div className="bg-blue-50 rounded-xl p-3 mt-2">
                    <p className="font-medium text-blue-800 mb-1">Resposta do Representante</p>
                    <p><span className="text-gray-500">Preco Ofertado:</span> R$ {viewingDetail.preco_resposta?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p><span className="text-gray-500">Prazo:</span> {viewingDetail.prazo_resposta || '-'}</p>
                  </div>
                )}
                {viewingDetail.observacoes && (
                  <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-500 mb-1">Observacoes:</p><p>{viewingDetail.observacoes}</p></div>
                )}
              </div>
              <div className="flex justify-end p-6 border-t">
                <button onClick={() => setViewingDetail(null)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Fechar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 6. Generic View for placeholder modules
  // Times - Task Checklist System
  const TimesView = () => {
    const [tasks, setTasks] = useState([]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_to: '', priority: 'normal', due_date: '' });
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
      loadTasks();
    }, []);

    const loadTasks = async () => {
      let { data, error } = await supabase.from('tasks').select('*, assignee:assigned_to(full_name, email), creator:assigned_by(full_name, email)').order('created_at', { ascending: false });
      if (error) {
        // Fallback without joins if FK doesn't exist
        const res = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        data = res.data;
      }
      setTasks(data || []);
    };

    const handleCreateTask = async () => {
      if (!taskForm.title) { alert('Titulo e obrigatorio'); return; }
      const payload = {
        title: taskForm.title,
        description: taskForm.description || null,
        assigned_to: taskForm.assigned_to && taskForm.assigned_to !== '' ? taskForm.assigned_to : null,
        assigned_by: user?.id || null,
        priority: taskForm.priority || 'normal',
        due_date: taskForm.due_date && taskForm.due_date !== '' ? taskForm.due_date : null,
        status: 'pendente'
      };
      const { error } = await supabase.from('tasks').insert([payload]);
      if (error) {
        console.error('Erro ao criar tarefa:', error);
        alert('Erro ao criar tarefa: ' + error.message);
        return;
      }
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assigned_to: '', priority: 'normal', due_date: '' });
      loadTasks();
    };

    const handleUpdateStatus = async (taskId, newStatus) => {
      const { error } = await supabase.from('tasks').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', taskId);
      if (!error) loadTasks();
    };

    const handleDeleteTask = async (taskId) => {
      if (!confirm('Excluir esta tarefa?')) return;
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (!error) loadTasks();
    };

    const statusConfig = {
      pendente: { label: 'Pendente', color: 'yellow', icon: Clock },
      em_andamento: { label: 'Em Andamento', color: 'blue', icon: AlertCircle },
      concluido: { label: 'Concluido', color: 'green', icon: CheckCircle },
      problema: { label: 'Problema', color: 'red', icon: XCircle }
    };

    const priorityConfig = {
      baixa: { label: 'Baixa', color: 'gray' },
      normal: { label: 'Normal', color: 'blue' },
      alta: { label: 'Alta', color: 'orange' },
      urgente: { label: 'Urgente', color: 'red' }
    };

    const filteredTasks = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus);
    const counts = { pendente: tasks.filter(t => t.status === 'pendente').length, em_andamento: tasks.filter(t => t.status === 'em_andamento').length, concluido: tasks.filter(t => t.status === 'concluido').length, problema: tasks.filter(t => t.status === 'problema').length };

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Gestao de Times</h2>
          {profile?.role === 'admin' && (
            <button onClick={() => setShowTaskModal(true)} className="bg-[#6B1B8E] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#4A1063] transition-all shadow-md">
              <Plus size={20} /> Nova Tarefa
            </button>
          )}
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <button key={key} onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
              className={`p-4 rounded-2xl border transition-all ${filterStatus === key ? 'ring-2 ring-[#6B1B8E] border-[#6B1B8E]' : 'border-gray-100 hover:border-gray-200'} bg-white`}>
              <div className="flex items-center justify-between mb-2">
                <cfg.icon size={20} className={`text-${cfg.color}-500`} />
                <span className="text-2xl font-bold text-gray-800">{counts[key]}</span>
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase">{cfg.label}</p>
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <ClipboardList size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400 font-bold">Nenhuma tarefa {filterStatus !== 'all' ? statusConfig[filterStatus]?.label.toLowerCase() : ''}</p>
            </div>
          ) : filteredTasks.map(task => {
            const sc = statusConfig[task.status] || statusConfig.pendente;
            const pc = priorityConfig[task.priority] || priorityConfig.normal;
            return (
              <div key={task.id} className="bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-bold text-gray-800">{task.title}</h4>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-${pc.color}-100 text-${pc.color}-700`}>{pc.label}</span>
                    </div>
                    {task.description && <p className="text-sm text-gray-500 mb-2">{task.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                      {task.assignee && <span>Para: <strong className="text-gray-600">{task.assignee.full_name || task.assignee.email}</strong></span>}
                      {task.creator && <span>De: <strong className="text-gray-600">{task.creator.full_name || task.creator.email}</strong></span>}
                      {task.due_date && <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(task.due_date).toLocaleDateString('pt-BR')}</span>}
                    </div>
                    {task.notes && <p className="text-xs text-gray-400 mt-1 italic">Nota: {task.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select value={task.status} onChange={e => handleUpdateStatus(task.id, e.target.value)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 bg-${sc.color}-100 text-${sc.color}-700 cursor-pointer outline-none`}>
                      <option value="pendente">Pendente</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="concluido">Concluido</option>
                      <option value="problema">Problema</option>
                    </select>
                    {profile?.role === 'admin' && (
                      <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Task Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setShowTaskModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-[#6B1B8E]">Nova Tarefa</h3>
                <button onClick={() => setShowTaskModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Titulo *</label>
                  <input type="text" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none"
                    placeholder="Ex: Conferir estoque do armazem" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descricao</label>
                  <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none"
                    rows={3} placeholder="Detalhes da tarefa..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Atribuir Para</label>
                  <select value={taskForm.assigned_to} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none">
                    <option value="">Ninguem (geral)</option>
                    {allProfiles.filter(p => p.role !== 'admin').map(p => (
                      <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prioridade</label>
                    <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none">
                      <option value="baixa">Baixa</option>
                      <option value="normal">Normal</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prazo</label>
                    <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-[#6B1B8E] outline-none" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowTaskModal(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-bold text-sm">Cancelar</button>
                  <button onClick={handleCreateTask} className="flex-1 px-4 py-2 bg-[#6B1B8E] text-white rounded-xl font-bold text-sm hover:bg-[#5a1676]">Criar Tarefa</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const GenericView = ({ title }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
        <Settings size={40} />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <p className="text-gray-500">Modulo em desenvolvimento para a fase 2 do portal.</p>
      </div>
    </div>
  );

  // 7. Precificacao - Planilha Dinamica de Precos
  const PrecificacaoView = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadProgress, setLoadProgress] = useState({ page: 0, count: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState('sku');
    const [sortDir, setSortDir] = useState('asc');
    const [activeMarketplace, setActiveMarketplace] = useState('mercadolivre');
    const [showConfig, setShowConfig] = useState(false);
    const [showHidden, setShowHidden] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newSku, setNewSku] = useState('');
    const [newName, setNewName] = useState('');
    const [newCost, setNewCost] = useState('');
    const ITEMS_PER_PAGE = 50;

    // Marketplace configs (same as old calculator)
    const defaultConfigs = {
      mercadolivre: { nome: 'Mercado Livre', cor: '#FFE600', imposto: 11, comissao: 11.5, freteBaixo: 6.50, freteAlto: 20.00, limiarFrete: 79 },
      shopee: { nome: 'Shopee', cor: '#EE4D2D', imposto: 11, comissao: 14, freteBaixo: 5.00, freteAlto: 15.00, limiarFrete: 49 },
      amazon: { nome: 'Amazon', cor: '#FF9900', imposto: 11, comissao: 15, freteBaixo: 8.00, freteAlto: 22.00, limiarFrete: 99 },
      tiktok: { nome: 'TikTok Shop', cor: '#69C9D0', imposto: 11, comissao: 8, freteBaixo: 5.00, freteAlto: 12.00, limiarFrete: 59 },
      temu: { nome: 'Temu', cor: '#F54B24', imposto: 11, comissao: 12, freteBaixo: 0, freteAlto: 0, limiarFrete: 0 },
      shein: { nome: 'Shein', cor: '#222222', imposto: 11, comissao: 20, freteBaixo: 0, freteAlto: 0, limiarFrete: 0 },
    };

    const [mktConfigs, setMktConfigs] = useState(() => {
      try {
        const saved = localStorage.getItem('portal-sniff-marketplace-configs');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Merge with defaults to add any new marketplaces
          return { ...defaultConfigs, ...parsed };
        }
        return defaultConfigs;
      } catch { return defaultConfigs; }
    });

    useEffect(() => {
      localStorage.setItem('portal-sniff-marketplace-configs', JSON.stringify(mktConfigs));
    }, [mktConfigs]);

    // Hidden SKUs (excluded from view)
    const [hiddenSkus, setHiddenSkus] = useState(() => {
      try {
        const saved = localStorage.getItem('portal-sniff-hidden-skus');
        return saved ? JSON.parse(saved) : [];
      } catch { return []; }
    });

    useEffect(() => {
      localStorage.setItem('portal-sniff-hidden-skus', JSON.stringify(hiddenSkus));
    }, [hiddenSkus]);

    // Custom products (manually added)
    const [customProducts, setCustomProducts] = useState(() => {
      try {
        const saved = localStorage.getItem('portal-sniff-custom-products');
        return saved ? JSON.parse(saved) : [];
      } catch { return []; }
    });

    useEffect(() => {
      localStorage.setItem('portal-sniff-custom-products', JSON.stringify(customProducts));
    }, [customProducts]);

    const config = mktConfigs[activeMarketplace];

    const updateConfig = (field, value) => {
      setMktConfigs(prev => ({
        ...prev,
        [activeMarketplace]: { ...prev[activeMarketplace], [field]: Number(value) }
      }));
    };

    // Price tiers
    const tiers = [
      { key: 'ataque', nome: 'Ataque', desc: '0-10%', mcMin: 0, mcMid: 5, mcMax: 10, bgHead: 'bg-red-500/80', bgCell: 'bg-red-50', textHead: 'text-white', textPrice: 'text-red-700' },
      { key: 'estruturacao', nome: 'Estruturacao', desc: '10-15%', mcMin: 10, mcMid: 12.5, mcMax: 15, bgHead: 'bg-amber-500/80', bgCell: 'bg-amber-50', textHead: 'text-white', textPrice: 'text-amber-700' },
      { key: 'estabilidade', nome: 'Estabilidade', desc: '15-30%', mcMin: 15, mcMid: 22.5, mcMax: 30, bgHead: 'bg-green-500/80', bgCell: 'bg-green-50', textHead: 'text-white', textPrice: 'text-green-700' },
    ];

    // Price calculation (same formula as old calculator)
    const calcPreco = (custo, margemAlvo) => {
      if (!custo || Number(custo) <= 0 || !config) return null;
      const c = Number(custo);
      const divisor = 1 - (config.imposto / 100) - (config.comissao / 100) - (margemAlvo / 100);
      if (divisor <= 0) return null;

      const pvBaixo = (c + config.freteBaixo) / divisor;
      const pvAlto = (c + config.freteAlto) / divisor;

      if (config.limiarFrete === 0 || pvBaixo >= config.limiarFrete) {
        return pvAlto;
      }
      return pvBaixo;
    };

    // Parse SKU type
    const parseProductType = (sku, allSkus) => {
      if (!sku) return { type: 'simple', label: 'Simples', baseSku: sku, mult: null };
      const upper = sku.toUpperCase();

      const kitMatch = upper.match(/^(.+?)KIT(\d+)$/);
      if (kitMatch) {
        return { type: 'kit', label: 'Kit x' + kitMatch[2], baseSku: kitMatch[1], mult: parseInt(kitMatch[2]) };
      }

      if (upper.startsWith('KIT')) {
        return { type: 'combo', label: 'Combo', baseSku: null, mult: null };
      }

      const hasKits = allSkus.some(o => {
        const m = o.toUpperCase().match(/^(.+?)KIT(\d+)$/);
        return m && m[1] === upper;
      });

      if (hasKits) {
        return { type: 'simple_with_kits', label: 'Base', baseSku: sku, mult: null };
      }

      return { type: 'simple', label: 'Simples', baseSku: sku, mult: null };
    };

    // Fetch ALL products
    const fetchAllProducts = async () => {
      setLoading(true);
      setProducts([]);
      let all = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        setLoadProgress({ page, count: all.length });
        try {
          const res = await fetch('/api/baselinker/products?page=' + page);
          const data = await res.json();
          if (data.success && data.products && data.products.length > 0) {
            all = all.concat(data.products);
            page++;
          } else {
            hasMore = false;
          }
        } catch (err) {
          console.error('Fetch error page', page, err);
          hasMore = false;
        }
      }

      const allSkus = all.map(p => p.sku).filter(Boolean);
      const processed = all
        .map(p => ({ ...p, productType: parseProductType(p.sku, allSkus), isCustom: false }))
        .filter(p => p.productType.type !== 'simple_with_kits');

      setProducts(processed);
      setLoading(false);
    };

    // No auto-fetch - only when user clicks "Atualizar"

    // All products including custom ones
    const allProducts = useMemo(() => {
      const customs = customProducts.map(cp => ({
        ...cp,
        productType: { type: 'custom', label: 'Manual', baseSku: cp.sku, mult: null },
        isCustom: true
      }));
      return [...products, ...customs];
    }, [products, customProducts]);

    // Filtered + sorted
    const filteredProducts = useMemo(() => {
      let result = [...allProducts];

      // Hide/show hidden
      if (!showHidden) {
        result = result.filter(p => !hiddenSkus.includes(p.sku));
      }

      if (searchTerm) {
        const strip = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const term = strip(searchTerm);
        result = result.filter(p =>
          (p.sku && strip(p.sku).includes(term)) ||
          (p.name && strip(p.name).includes(term))
        );
      }

      if (filterType !== 'all') {
        result = result.filter(p => p.productType.type === filterType);
      }

      result.sort((a, b) => {
        let va = a[sortField] || '';
        let vb = b[sortField] || '';
        if (sortField === 'price1' || sortField === 'stock') {
          va = Number(va) || 0;
          vb = Number(vb) || 0;
        } else {
          va = String(va).toLowerCase();
          vb = String(vb).toLowerCase();
        }
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });

      return result;
    }, [allProducts, searchTerm, filterType, sortField, sortDir, showHidden, hiddenSkus]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = filteredProducts.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );

    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterType, showHidden]);

    const toggleSort = (field) => {
      if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
      else { setSortField(field); setSortDir('asc'); }
    };

    const toggleHide = (sku) => {
      setHiddenSkus(prev =>
        prev.includes(sku) ? prev.filter(s => s !== sku) : [...prev, sku]
      );
    };

    const addCustomProduct = () => {
      if (!newSku || !newName || !newCost) return;
      const exists = customProducts.some(p => p.sku === newSku) || products.some(p => p.sku === newSku);
      if (exists) return;
      setCustomProducts(prev => [...prev, {
        id: 'custom_' + Date.now(),
        sku: newSku,
        name: newName,
        price1: parseFloat(newCost) || 0,
        stock: 0,
        isCustom: true
      }]);
      setNewSku('');
      setNewName('');
      setNewCost('');
      setShowAddForm(false);
    };

    const removeCustomProduct = (sku) => {
      setCustomProducts(prev => prev.filter(p => p.sku !== sku));
    };

    const fmt = (v) => v != null && !isNaN(v) ? 'R$ ' + Number(v).toFixed(2).replace('.', ',') : '-';
    const sortIcon = (field) => sortField === field ? (sortDir === 'asc' ? ' \u2191' : ' \u2193') : '';

    const typeBadge = (type) => {
      switch (type) {
        case 'kit': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'combo': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'custom': return 'bg-blue-100 text-blue-700 border-blue-200';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
      }
    };

    // Export CSV
    const exportCSV = () => {
      const headers = ['SKU', 'Produto', 'Tipo', 'Custo', 'Estoque',
        config.nome + ' Ataque (5%)', config.nome + ' Estruturacao (12.5%)', config.nome + ' Estabilidade (22.5%)'];
      const rows = filteredProducts.map(p => [
        p.sku,
        '"' + (p.name || '').replace(/"/g, '""') + '"',
        p.productType.label,
        p.price1 || 0,
        p.stock || 0,
        calcPreco(p.price1, 5) ? calcPreco(p.price1, 5).toFixed(2) : '',
        calcPreco(p.price1, 12.5) ? calcPreco(p.price1, 12.5).toFixed(2) : '',
        calcPreco(p.price1, 22.5) ? calcPreco(p.price1, 22.5).toFixed(2) : ''
      ]);
      const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'precificacao_' + activeMarketplace + '_' + new Date().toISOString().slice(0, 10) + '.csv';
      a.click();
      URL.revokeObjectURL(url);
    };

    // Stats
    const stats = useMemo(() => {
      const visible = allProducts.filter(p => !hiddenSkus.includes(p.sku));
      return {
        total: visible.length,
        kits: visible.filter(p => p.productType.type === 'kit').length,
        combos: visible.filter(p => p.productType.type === 'combo').length,
        simples: visible.filter(p => p.productType.type === 'simple').length,
        custom: customProducts.length,
        hidden: hiddenSkus.length
      };
    }, [allProducts, hiddenSkus, customProducts]);

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d0520 0%, #1a0a2e 50%, #6B1B8E 100%)' }}>
          <div className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <DollarSign size={28} className="text-[#F4B942]" />
                  Planilha de Precificacao
                </h2>
                <p className="text-purple-200 text-sm mt-1">Precos calculados automaticamente por marketplace</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={exportCSV} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                  <Download size={16} /> CSV
                </button>
                <button onClick={fetchAllProducts} disabled={loading} className="px-4 py-2 bg-[#F4B942] hover:bg-[#e5aa33] text-gray-900 rounded-xl text-sm font-black flex items-center gap-2 transition-all disabled:opacity-50">
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {loading ? 'Carregando...' : 'Atualizar'}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-5">
              {[
                { label: 'Total', value: stats.total, bg: 'bg-white/10' },
                { label: 'Kits', value: stats.kits, bg: 'bg-purple-500/30' },
                { label: 'Combos', value: stats.combos, bg: 'bg-amber-500/30' },
                { label: 'Simples', value: stats.simples, bg: 'bg-blue-500/30' },
                { label: 'Manual', value: stats.custom, bg: 'bg-cyan-500/30' },
                { label: 'Ocultos', value: stats.hidden, bg: 'bg-gray-500/30' },
              ].map(s => (
                <div key={s.label} className={s.bg + ' rounded-xl px-3 py-2.5 text-center'}>
                  <p className="text-xl font-black text-white">{loading ? '...' : s.value}</p>
                  <p className="text-[10px] text-purple-200 font-bold uppercase">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Marketplace Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.entries(mktConfigs).map(([key, mp]) => (
              <button
                key={key}
                onClick={() => setActiveMarketplace(key)}
                className={'px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ' + (
                  activeMarketplace === key
                    ? 'text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
                style={activeMarketplace === key ? { backgroundColor: mp.cor, color: ['#FFE600', '#69C9D0', '#FF9900'].includes(mp.cor) ? '#000' : '#fff' } : {}}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: mp.cor }}></span>
                {mp.nome}
              </button>
            ))}
          </div>

          {/* Config toggle */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-xs text-gray-500 hover:text-[#6B1B8E] font-bold flex items-center gap-1 transition-all"
          >
            <Settings size={14} />
            {showConfig ? 'Ocultar parametros' : 'Editar parametros'} de {config.nome}
            <ChevronDown size={14} className={'transition-transform ' + (showConfig ? 'rotate-180' : '')} />
          </button>

          {/* Config panel */}
          {showConfig && (
            <div className="mt-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Imposto %</label>
                  <input type="number" step="0.1" value={config.imposto} onChange={e => updateConfig('imposto', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-purple-200 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Comissao %</label>
                  <input type="number" step="0.1" value={config.comissao} onChange={e => updateConfig('comissao', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-purple-200 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Frete Baixo R$</label>
                  <input type="number" step="0.01" value={config.freteBaixo} onChange={e => updateConfig('freteBaixo', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-purple-200 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Frete Alto R$</label>
                  <input type="number" step="0.01" value={config.freteAlto} onChange={e => updateConfig('freteAlto', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-purple-200 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Limiar Frete R$</label>
                  <input type="number" step="1" value={config.limiarFrete} onChange={e => updateConfig('limiarFrete', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-purple-200 outline-none" />
                  <p className="text-[9px] text-gray-400 mt-0.5">0 = sem frete gratis</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar SKU ou nome..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none"
              />
            </div>

            {/* Type filters */}
            <div className="flex items-center gap-1.5">
              {[
                { key: 'all', label: 'Todos' },
                { key: 'kit', label: 'Kits' },
                { key: 'combo', label: 'Combos' },
                { key: 'simple', label: 'Simples' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilterType(f.key)}
                  className={'px-3 py-2 rounded-xl text-xs font-bold transition-all ' + (
                    filterType === f.key
                      ? 'bg-[#6B1B8E] text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Show hidden toggle */}
            <button
              onClick={() => setShowHidden(!showHidden)}
              className={'px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ' + (
                showHidden
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              )}
            >
              <Eye size={14} /> {showHidden ? 'Ocultos visiveis' : 'Mostrar ocultos'}
              {hiddenSkus.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{hiddenSkus.length}</span>}
            </button>

            {/* Add product */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-[#6B1B8E] text-white hover:bg-[#5a1678] transition-all flex items-center gap-1.5"
            >
              <Plus size={14} /> Adicionar SKU
            </button>

            <span className="text-sm text-gray-500 font-bold">{filteredProducts.length} produtos</span>
          </div>

          {/* Add product form */}
          {showAddForm && (
            <div className="mt-3 p-4 rounded-xl border border-purple-200 bg-purple-50 flex items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-[120px]">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">SKU</label>
                <input type="text" value={newSku} onChange={e => setNewSku(e.target.value)} placeholder="Ex: PROD001" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-purple-200" />
              </div>
              <div className="flex-[2] min-w-[200px]">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nome do Produto</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome completo" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-purple-200" />
              </div>
              <div className="w-[120px]">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Custo R$</label>
                <input type="number" step="0.01" value={newCost} onChange={e => setNewCost(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-purple-200" />
              </div>
              <button onClick={addCustomProduct} className="px-4 py-2 bg-[#6B1B8E] text-white rounded-lg text-sm font-bold hover:bg-[#5a1678] transition-all">
                Adicionar
              </button>
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-300 transition-all">
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <RefreshCw size={32} className="mx-auto text-[#6B1B8E] animate-spin mb-3" />
            <p className="font-bold text-gray-700">Carregando produtos do BaseLinker...</p>
            <p className="text-sm text-gray-500 mt-1">Pagina {loadProgress.page} - {loadProgress.count} produtos carregados</p>
          </div>
        )}

        {/* Spreadsheet */}
        {!loading && allProducts.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #0d0520, #1a0a2e)' }}>
                    <th className="px-3 py-3 text-left text-xs font-bold text-purple-200 uppercase cursor-pointer hover:text-white whitespace-nowrap" onClick={() => toggleSort('sku')}>
                      SKU{sortIcon('sku')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-purple-200 uppercase cursor-pointer hover:text-white whitespace-nowrap" onClick={() => toggleSort('name')}>
                      Produto{sortIcon('name')}
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-purple-200 uppercase whitespace-nowrap">Tipo</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-purple-200 uppercase cursor-pointer hover:text-white whitespace-nowrap" onClick={() => toggleSort('price1')}>
                      Custo{sortIcon('price1')}
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-purple-200 uppercase cursor-pointer hover:text-white whitespace-nowrap" onClick={() => toggleSort('stock')}>
                      Estoque{sortIcon('stock')}
                    </th>
                    {tiers.map(t => (
                      <th key={t.key} className={'px-3 py-3 text-center text-xs font-bold uppercase whitespace-nowrap ' + t.bgHead + ' ' + t.textHead}>
                        <div>{t.nome}</div>
                        <div className="text-[10px] opacity-80 font-normal">{t.desc}</div>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center text-xs font-bold text-purple-200 uppercase whitespace-nowrap">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((p, idx) => {
                    const isHidden = hiddenSkus.includes(p.sku);
                    return (
                      <tr key={p.id || p.sku} className={'border-b border-gray-50 transition-colors ' + (isHidden ? 'opacity-40 bg-red-50/30' : idx % 2 === 0 ? 'bg-white hover:bg-purple-50/50' : 'bg-gray-50/30 hover:bg-purple-50/50')}>
                        <td className="px-3 py-2.5 font-mono text-xs font-bold text-[#6B1B8E] whitespace-nowrap">{p.sku}</td>
                        <td className="px-3 py-2.5 text-gray-700 max-w-[250px] truncate" title={p.name}>{p.name}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ' + typeBadge(p.productType.type)}>
                            {p.productType.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs font-bold text-gray-600 whitespace-nowrap">{fmt(p.price1)}</td>
                        <td className={'px-3 py-2.5 text-right font-mono text-xs whitespace-nowrap ' + (
                          (p.stock || 0) <= 0 ? 'text-red-500 font-bold' : (p.stock || 0) <= 10 ? 'text-amber-500 font-bold' : 'text-gray-500'
                        )}>
                          {p.stock || 0}
                        </td>
                        {tiers.map(t => {
                          const pvMid = calcPreco(p.price1, t.mcMid);
                          const pvMin = calcPreco(p.price1, t.mcMax);
                          const pvMax = calcPreco(p.price1, t.mcMin);
                          return (
                            <td key={t.key} className={'px-2 py-2.5 text-center ' + t.bgCell}
                              title={pvMin && pvMax ? 'Faixa: ' + fmt(pvMin) + ' a ' + fmt(pvMax) : ''}>
                              <span className={'font-bold text-xs ' + t.textPrice}>
                                {pvMid ? fmt(pvMid) : '-'}
                              </span>
                              {pvMin && pvMax && (
                                <span className="block text-[9px] text-gray-400">
                                  {fmt(pvMin)} - {fmt(pvMax)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-2 py-2.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => toggleHide(p.sku)}
                              className={'p-1.5 rounded-lg transition-all ' + (isHidden ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500')}
                              title={isHidden ? 'Mostrar SKU' : 'Ocultar SKU'}
                            >
                              {isHidden ? <Eye size={14} /> : <XCircle size={14} />}
                            </button>
                            {p.isCustom && (
                              <button
                                onClick={() => removeCustomProduct(p.sku)}
                                className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition-all"
                                title="Remover produto manual"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <span className="text-sm text-gray-500">
                  Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} de {filteredProducts.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-bold bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-all"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 7) pageNum = i + 1;
                    else if (currentPage <= 4) pageNum = i + 1;
                    else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
                    else pageNum = currentPage - 3 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={'w-8 h-8 rounded-lg text-sm font-bold transition-all ' + (
                          currentPage === pageNum
                            ? 'bg-[#6B1B8E] text-white shadow-md'
                            : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-600'
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm font-bold bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-all"
                  >
                    Proximo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && allProducts.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
            <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 font-bold">Nenhum produto carregado</p>
            <p className="text-sm text-gray-400 mt-2">Clique em "Atualizar" para buscar produtos do BaseLinker</p>
          </div>
        )}

        {/* Legend */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
            <span className="font-bold text-gray-700">Faixas {config.nome}:</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-200"></span> Ataque 0-10% (agressivo)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></span> Estruturacao 10-15% (competitivo)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 border border-green-200"></span> Estabilidade 15-30% (saudavel)</span>
            <span className="ml-auto text-gray-400">Imposto: {config.imposto}% | Comissao: {config.comissao}% | Frete: R${config.freteBaixo}-{config.freteAlto}</span>
          </div>
        </div>
      </div>
    );
  };

  // ============== ANALYTICS VIEW ==============
  const AnalyticsView = () => {
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [useCache, setUseCache] = useState(true); // Default: usar cache
    const [cacheStatus, setCacheStatus] = useState(null);

    // Period selector
    const [selectedPeriod, setSelectedPeriod] = useState('7d');
    const [customDateFrom, setCustomDateFrom] = useState('');
    const [customDateTo, setCustomDateTo] = useState('');
    const [filterMarketplace, setFilterMarketplace] = useState('');
    const [filterCompany, setFilterCompany] = useState('');

    const periods = [
      { id: 'today', label: 'Hoje', days: 0 },
      { id: '7d', label: 'Ultimos 7 dias', days: 7 },
      { id: '15d', label: 'Ultimos 15 dias', days: 15 },
      { id: '30d', label: 'Ultimos 30 dias', days: 30 },
      { id: '60d', label: 'Ultimos 60 dias', days: 60 },
      { id: '90d', label: 'Ultimos 90 dias', days: 90 },
      { id: 'month', label: 'Este mes', days: -1 },
      { id: 'lastmonth', label: 'Mes passado', days: -2 },
      { id: 'custom', label: 'Personalizado', days: -99 },
    ];

    const marketplaces = [
      { id: '', label: 'Todos' },
      { id: 'mercadolivre', label: 'Mercado Livre', color: '#FFE600' },
      { id: 'shopee', label: 'Shopee', color: '#EE4D2D' },
      { id: 'amazon', label: 'Amazon', color: '#FF9900' },
      { id: 'tiktok', label: 'TikTok Shop', color: '#000000' },
      { id: 'temu', label: 'Temu', color: '#F54B24' },
      { id: 'shein', label: 'Shein', color: '#000000' },
    ];

    const companies = [
      { id: '', label: 'Todas' },
      { id: 'casa_ipiranga', label: 'Casa Ipiranga' },
      { id: 'romobr', label: 'ROMOBR' },
      { id: 'sniffhome', label: 'Sniff Home' },
      { id: 'inovate', label: 'Inovate' },
      { id: 'agua_marinha', label: 'Agua Marinha' },
    ];

    const getDateRange = () => {
      const now = new Date();
      let from, to;

      if (selectedPeriod === 'custom') {
        from = customDateFrom ? new Date(customDateFrom) : new Date();
        to = customDateTo ? new Date(customDateTo + 'T23:59:59') : new Date();
      } else if (selectedPeriod === 'today') {
        from = new Date(now.setHours(0, 0, 0, 0));
        to = new Date();
      } else if (selectedPeriod === 'month') {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date();
      } else if (selectedPeriod === 'lastmonth') {
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      } else {
        const period = periods.find(p => p.id === selectedPeriod);
        const days = period?.days || 7;
        from = new Date();
        from.setDate(from.getDate() - days);
        to = new Date();
      }

      return { from, to };
    };

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      try {
        const { from, to } = getDateRange();
        const fromTs = Math.floor(from.getTime() / 1000);
        const toTs = Math.floor(to.getTime() / 1000);

        // Escolher endpoint baseado na preferencia de cache
        const endpoint = useCache ? '/api/baselinker/cached-analytics' : '/api/baselinker/analytics';
        let url = `${endpoint}?date_from=${fromTs}&date_to=${toTs}`;
        if (filterMarketplace) url += `&marketplace=${filterMarketplace}`;
        if (filterCompany) url += `&company=${filterCompany}`;

        const response = await fetch(url);
        const result = await response.json();

        if (!result.success) throw new Error(result.error);
        setData(result);

        // Atualizar status do cache se veio do cache
        if (result.fromCache) {
          setCacheStatus({
            ageMinutes: result.cacheAgeMinutes,
            warning: result.warning
          });
        } else {
          setCacheStatus(null);
        }
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    };

    // Funcao de sync - atualiza cache do BaseLinker
    const syncData = async (mode = 'incremental') => {
      setSyncing(true);
      setError(null);
      try {
        const response = await fetch(`/api/baselinker/sync?mode=${mode}&days=30`, { method: 'POST' });
        const result = await response.json();

        if (!result.success) throw new Error(result.error || result.details);

        // Mostrar sucesso e recarregar dados
        alert(`Sync ${result.syncType} completo! ${result.ordersSaved} pedidos sincronizados.`);

        // Recarregar dados do cache
        if (hasSearched) {
          await fetchData();
        }
      } catch (err) {
        setError('Sync falhou: ' + err.message);
      }
      setSyncing(false);
    };

    // Auto-load 30-day summary from pre-computed view (instant, zero API calls)
    const [quickSummary, setQuickSummary] = useState(null);
    useEffect(() => {
      fetch('/api/baselinker/dashboard-summary')
        .then(r => r.json())
        .then(d => { if (d.success && !d.empty) setQuickSummary(d); })
        .catch(() => {});
    }, []);

    const fmt = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const fmtNum = (v) => Number(v || 0).toLocaleString('pt-BR');

    const mpColors = {
      mercadolivre: '#FFE600',
      shopee: '#EE4D2D',
      amazon: '#FF9900',
      tiktok: '#000000',
      temu: '#F54B24',
      shein: '#333333',
      magalu: '#0086FF',
      outros: '#999999'
    };

    const companyColors = {
      casa_ipiranga: '#6B1B8E',
      romobr: '#2563EB',
      sniffhome: '#059669',
      inovate: '#DC2626',
      agua_marinha: '#0891B2',
      outros: '#6B7280'
    };

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="text-[#6B1B8E]" /> Analytics Multi-Empresa
            </h2>
            <p className="text-sm text-gray-500 mt-1">Faturamento real por empresa e marketplace</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Period Selector */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Periodo de Analise</label>
              <select
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-200 outline-none bg-gray-50"
              >
                {periods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>

            {/* Custom Date Range - only show when custom is selected */}
            {selectedPeriod === 'custom' && (
              <div className="md:col-span-2 lg:col-span-1 flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">De</label>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={e => setCustomDateFrom(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ate</label>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={e => setCustomDateTo(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Marketplace Filter */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Marketplace</label>
              <select
                value={filterMarketplace}
                onChange={e => setFilterMarketplace(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-200 outline-none bg-gray-50"
              >
                {marketplaces.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>

            {/* Company Filter */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Empresa</label>
              <select
                value={filterCompany}
                onChange={e => setFilterCompany(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-200 outline-none bg-gray-50"
              >
                {companies.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Cache Toggle + Sync Button */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCache}
                  onChange={e => setUseCache(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Usar Cache Local</span>
              </label>
              {useCache && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  Zero requisicoes API
                </span>
              )}
              {!useCache && (
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                  Direto do BaseLinker
                </span>
              )}
            </div>
            <button
              onClick={() => syncData('incremental')}
              disabled={syncing}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                syncing ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Sincronizando...' : 'Sync Cache'}
            </button>
          </div>

          {/* Cache Status */}
          {cacheStatus && (
            <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
              cacheStatus.warning ? 'bg-yellow-50 border border-yellow-200 text-yellow-700' : 'bg-green-50 border border-green-200 text-green-700'
            }`}>
              <Clock size={16} />
              <span>Cache atualizado ha {cacheStatus.ageMinutes} minutos</span>
              {cacheStatus.warning && (
                <button
                  onClick={() => syncData('incremental')}
                  className="ml-auto text-xs px-2 py-1 bg-yellow-200 hover:bg-yellow-300 rounded transition-colors"
                >
                  Atualizar agora
                </button>
              )}
            </div>
          )}

          {/* Search Button - prominent */}
          <button
            onClick={fetchData}
            disabled={loading || (selectedPeriod === 'custom' && (!customDateFrom || !customDateTo))}
            className={`w-full px-6 py-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-3 ${
              loading ? 'bg-gray-200 text-gray-500' : 'bg-gradient-to-r from-[#6B1B8E] to-[#4A1063] text-white hover:shadow-lg hover:scale-[1.02]'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                {useCache ? 'Carregando do cache...' : 'Carregando do BaseLinker...'}
              </>
            ) : (
              <>
                <Search size={20} />
                Buscar Analytics
              </>
            )}
          </button>
        </div>

        {/* Quick Summary (auto-loaded from view) or Empty State */}
        {!hasSearched && !loading && (
          quickSummary ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Clock size={14} /> Resumo automatico dos ultimos 30 dias
                  {quickSummary.cacheAgeMinutes != null && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                      cache {quickSummary.cacheAgeMinutes}min atras
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400">Use os filtros acima para analise detalhada</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase">Faturamento 30d</p>
                  <p className="text-2xl font-black text-[#6B1B8E] mt-1">{fmt(quickSummary.summary.totalRevenue)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase">Pedidos</p>
                  <p className="text-2xl font-black text-gray-800 mt-1">{fmtNum(quickSummary.summary.totalOrders)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase">Ticket Medio</p>
                  <p className="text-2xl font-black text-green-600 mt-1">{fmt(quickSummary.summary.avgTicket)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase">Unidades</p>
                  <p className="text-2xl font-black text-gray-800 mt-1">{fmtNum(quickSummary.summary.totalUnits)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase">% Full</p>
                  <p className="text-2xl font-black text-blue-600 mt-1">{quickSummary.summary.fullPercentage}%</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2"><Target size={16} className="text-[#6B1B8E]" /> Por Marketplace</h4>
                  <div className="space-y-2">
                    {Object.entries(quickSummary.byMarketplace).sort((a, b) => b[1].revenue - a[1].revenue).map(([mp, s]) => (
                      <div key={mp} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mpColors[mp] || '#999' }}></div>
                        <span className="text-sm font-medium capitalize flex-1">{mp}</span>
                        <span className="text-sm font-black text-[#6B1B8E]">{fmt(s.revenue)}</span>
                        <span className="text-xs text-gray-400">{s.orders} ped.</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2"><Users size={16} className="text-[#6B1B8E]" /> Por Empresa</h4>
                  <div className="space-y-2">
                    {Object.entries(quickSummary.byCompany).sort((a, b) => b[1].revenue - a[1].revenue).map(([comp, s]) => (
                      <div key={comp} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: companyColors[comp] || '#999' }}></div>
                        <span className="text-sm font-medium capitalize flex-1">{comp.replace('_', ' ')}</span>
                        <span className="text-sm font-black text-[#6B1B8E]">{fmt(s.revenue)}</span>
                        <span className="text-xs text-gray-400">{s.orders} ped.</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
              <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-600 mb-2">Selecione os filtros e clique em Buscar</h3>
              <p className="text-sm text-gray-400">Escolha o periodo, marketplace e empresa para visualizar os dados de faturamento.</p>
            </div>
          )
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            <strong>Erro:</strong> {error}
          </div>
        )}

        {data && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase">Faturamento</p>
                <p className="text-2xl font-black text-[#6B1B8E] mt-1">{fmt(data.summary.totalRevenue)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase">Pedidos</p>
                <p className="text-2xl font-black text-gray-800 mt-1">{fmtNum(data.summary.totalOrders)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase">Ticket Medio</p>
                <p className="text-2xl font-black text-green-600 mt-1">{fmt(data.summary.avgTicket)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase">Unidades</p>
                <p className="text-2xl font-black text-gray-800 mt-1">{fmtNum(data.summary.totalUnits)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase">% Full</p>
                <p className="text-2xl font-black text-blue-600 mt-1">{data.summary.fullPercentage}%</p>
              </div>
            </div>

            {/* Alert about Original Value correction */}
            {data.summary.ordersWithOriginalValueCorrection > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-yellow-800 text-sm flex items-center gap-2">
                <AlertCircle size={18} />
                <span><strong>{data.summary.ordersWithOriginalValueCorrection}</strong> pedidos corrigidos com "Valor Original" (Shopee/TEMU/TikTok)</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Marketplace */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Target size={18} className="text-[#6B1B8E]" /> Por Marketplace
                </h3>
                <div className="space-y-3">
                  {Object.entries(data.byMarketplace).sort((a, b) => b[1].revenue - a[1].revenue).map(([mp, stats]) => (
                    <div key={mp} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mpColors[mp] || '#999' }}></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm capitalize">{mp}</span>
                          <span className="font-black text-[#6B1B8E]">{fmt(stats.revenue)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{stats.orders} pedidos</span>
                          <span>TM: {fmt(stats.orders > 0 ? stats.revenue / stats.orders : 0)}</span>
                        </div>
                        <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(stats.revenue / parseFloat(data.summary.totalRevenue)) * 100}%`,
                              backgroundColor: mpColors[mp] || '#999'
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Company */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users size={18} className="text-[#6B1B8E]" /> Por Empresa
                </h3>
                <div className="space-y-3">
                  {Object.entries(data.byCompany).sort((a, b) => b[1].revenue - a[1].revenue).map(([comp, stats]) => (
                    <div key={comp} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: companyColors[comp] || '#999' }}></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm capitalize">{comp.replace('_', ' ')}</span>
                          <span className="font-black text-[#6B1B8E]">{fmt(stats.revenue)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{stats.orders} pedidos</span>
                          <span>TM: {fmt(stats.orders > 0 ? stats.revenue / stats.orders : 0)}</span>
                        </div>
                        <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(stats.revenue / parseFloat(data.summary.totalRevenue)) * 100}%`,
                              backgroundColor: companyColors[comp] || '#999'
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Matrix: Company x Marketplace */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-[#6B1B8E]" /> Matriz Empresa x Marketplace
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-2 text-xs font-bold text-gray-500">Empresa / Marketplace</th>
                    {Object.keys(mpColors).map(mp => (
                      <th key={mp} className="text-center p-2">
                        <span className="inline-block px-2 py-1 rounded-lg text-xs font-bold text-white capitalize" style={{ backgroundColor: mpColors[mp] }}>
                          {mp === 'mercadolivre' ? 'ML' : mp}
                        </span>
                      </th>
                    ))}
                    <th className="text-right p-2 text-xs font-bold text-gray-500">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.byCompany).sort((a, b) => b[1].revenue - a[1].revenue).map(([comp, compStats]) => (
                    <tr key={comp} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-2 font-bold capitalize" style={{ color: companyColors[comp] }}>{comp.replace('_', ' ')}</td>
                      {Object.keys(mpColors).map(mp => {
                        const cellData = data.matrix.find(m => m.company === comp && m.marketplace === mp);
                        return (
                          <td key={mp} className="text-center p-2">
                            {cellData ? (
                              <div>
                                <p className="font-bold text-gray-800">{fmt(cellData.revenue)}</p>
                                <p className="text-[10px] text-gray-400">{cellData.orders} ped.</p>
                              </div>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-right p-2 font-black text-[#6B1B8E]">{fmt(compStats.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Daily Chart */}
            {data.dailyData && data.dailyData.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-[#6B1B8E]" /> Evolucao Diaria
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={data.dailyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6B1B8E" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6B1B8E" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value) => [fmt(value), 'Faturamento']}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6B1B8E" fill="url(#colorRevenue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top Products */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Award size={18} className="text-[#6B1B8E]" /> Top Produtos Vendidos
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left p-2 text-xs font-bold text-gray-500">#</th>
                      <th className="text-left p-2 text-xs font-bold text-gray-500">SKU</th>
                      <th className="text-left p-2 text-xs font-bold text-gray-500">Produto</th>
                      <th className="text-center p-2 text-xs font-bold text-gray-500">Qtd</th>
                      <th className="text-right p-2 text-xs font-bold text-gray-500">Faturamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.slice(0, 20).map((p, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="p-2 text-gray-400 font-bold">{i + 1}</td>
                        <td className="p-2 font-mono text-xs text-gray-600">{p.sku || '-'}</td>
                        <td className="p-2 font-medium text-gray-800 max-w-xs truncate">{p.name}</td>
                        <td className="p-2 text-center">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">{p.quantity}</span>
                        </td>
                        <td className="p-2 text-right font-bold text-[#6B1B8E]">{fmt(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ==================== MARKETING VIEW ====================
  const MarketingView = () => {
    const [mktSubTab, setMktSubTab] = useState('novos');
    const [pedidos, setPedidos] = useState([]);
    const [strategies, setStrategies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showStrategyModal, setShowStrategyModal] = useState(false);
    const [selectedSku, setSelectedSku] = useState(null);
    const [strategyForm, setStrategyForm] = useState({
      marketplaces_foco: [],
      tipo_estrategia: 'lancamento',
      acoes_planejadas: [],
      prioridade: 'media',
      responsavel: '',
      deadline: '',
      observacoes: '',
      ja_vendemos: false
    });

    const marketplaces = ['Mercado Livre', 'Shopee', 'Amazon', 'Magalu', 'Shein', 'Site Proprio'];
    const tiposEstrategia = ['lancamento', 'reposicao', 'promocional', 'sazonal', 'teste'];
    const acoesOptions = ['Criar Anuncio ML', 'Criar Anuncio Shopee', 'Foto Produto', 'Video/Clip', 'Campanha Ads', 'Precificacao PI', 'Cadastro Afiliados', 'Full/FBS'];
    const statusFlow = ['pendente_analise', 'em_planejamento', 'em_execucao', 'concluido'];
    const statusLabels = { pendente_analise: 'Pendente', em_planejamento: 'Em Planejamento', em_execucao: 'Em Execucao', concluido: 'Concluido' };
    const statusColors = { pendente_analise: 'bg-yellow-100 text-yellow-800', em_planejamento: 'bg-blue-100 text-blue-800', em_execucao: 'bg-purple-100 text-purple-800', concluido: 'bg-green-100 text-green-800' };
    const prioridadeColors = { alta: 'bg-red-100 text-red-700', media: 'bg-yellow-100 text-yellow-700', baixa: 'bg-green-100 text-green-700' };

    const subTabs = [
      { id: 'novos', label: 'Pedidos Novos', icon: AlertCircle, color: 'text-yellow-600' },
      { id: 'planejamento', label: 'Em Planejamento', icon: FileText, color: 'text-blue-600' },
      { id: 'execucao', label: 'Em Execucao', icon: Target, color: 'text-purple-600' },
      { id: 'concluidos', label: 'Concluidos', icon: CheckCircle, color: 'text-green-600' }
    ];

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
      setLoading(true);
      try {
        const [pedRes, strRes] = await Promise.all([
          supabase.from('pedidos_fornecedor').select('*').order('created_at', { ascending: false }),
          supabase.from('marketing_strategies').select('*').order('created_at', { ascending: false })
        ]);
        if (pedRes.data) setPedidos(pedRes.data);
        if (strRes.data) setStrategies(strRes.data);
      } catch (err) { console.error('Marketing fetch error:', err); }
      setLoading(false);
    };

    // Explode pedidos into individual SKU items
    const allSkuItems = pedidos.flatMap(p =>
      (p.items || []).map(item => ({
        ...item,
        pedido_id: p.id,
        numero_oc: p.numero_oc,
        fornecedor: p.fornecedor,
        created_at: p.created_at,
        subtotal: (Number(item.quantidade) || 0) * (Number(item.preco_unitario) || 0)
      }))
    );

    const getStrategyForSku = (pedidoId, sku) => strategies.find(s => s.pedido_id === pedidoId && s.sku === sku);

    const skuNovos = allSkuItems.filter(item => !getStrategyForSku(item.pedido_id, item.sku));
    const skuByStatus = (status) => {
      const strats = strategies.filter(s => s.status_marketing === status);
      return strats.map(s => {
        const pedido = pedidos.find(p => p.id === s.pedido_id);
        const item = pedido?.items?.find(i => i.sku === s.sku) || {};
        return { ...s, pedido, item };
      }).filter(s => s.pedido);
    };

    const openStrategyModal = (skuItem) => {
      setSelectedSku(skuItem);
      const existing = getStrategyForSku(skuItem.pedido_id, skuItem.sku);
      if (existing) {
        setStrategyForm({
          marketplaces_foco: existing.marketplaces_foco || [],
          tipo_estrategia: existing.tipo_estrategia || 'lancamento',
          acoes_planejadas: existing.acoes_planejadas || [],
          prioridade: existing.prioridade || 'media',
          responsavel: existing.responsavel || '',
          deadline: existing.deadline || '',
          observacoes: existing.observacoes || '',
          ja_vendemos: existing.ja_vendemos || false
        });
      } else {
        setStrategyForm({ marketplaces_foco: [], tipo_estrategia: 'lancamento', acoes_planejadas: [], prioridade: 'media', responsavel: '', deadline: '', observacoes: '', ja_vendemos: false });
      }
      setShowStrategyModal(true);
    };

    const toggleArrayItem = (arr, item) => arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

    const toggleJaVendemos = async (skuItem) => {
      const existing = getStrategyForSku(skuItem.pedido_id, skuItem.sku);
      if (existing) {
        const newVal = !existing.ja_vendemos;
        try {
          const { data } = await supabase.from('marketing_strategies').update({ ja_vendemos: newVal, updated_at: new Date().toISOString() }).eq('id', existing.id).select();
          if (data) setStrategies(prev => prev.map(s => s.id === existing.id ? data[0] : s));
        } catch (err) { console.error('Toggle ja_vendemos error:', err); }
      }
    };

    const handleSaveStrategy = async () => {
      if (!selectedSku) return;
      const existing = getStrategyForSku(selectedSku.pedido_id, selectedSku.sku);
      const payload = {
        pedido_id: selectedSku.pedido_id,
        numero_oc: selectedSku.numero_oc,
        produto: selectedSku.produto,
        sku: selectedSku.sku,
        ...strategyForm,
        deadline: strategyForm.deadline || null,
        status_marketing: existing ? existing.status_marketing : 'em_planejamento',
        updated_at: new Date().toISOString()
      };
      try {
        if (existing) {
          const { data } = await supabase.from('marketing_strategies').update(payload).eq('id', existing.id).select();
          if (data) setStrategies(prev => prev.map(s => s.id === existing.id ? data[0] : s));
        } else {
          const { data } = await supabase.from('marketing_strategies').insert(payload).select();
          if (data) setStrategies(prev => [...data, ...prev]);
        }
      } catch (err) { console.error('Save strategy error:', err); }
      setShowStrategyModal(false);
      setSelectedSku(null);
    };

    const advanceStatus = async (strategyId) => {
      const strat = strategies.find(s => s.id === strategyId);
      if (!strat) return;
      const currentIdx = statusFlow.indexOf(strat.status_marketing);
      if (currentIdx >= statusFlow.length - 1) return;
      const nextStatus = statusFlow[currentIdx + 1];
      try {
        const { data } = await supabase.from('marketing_strategies').update({ status_marketing: nextStatus, updated_at: new Date().toISOString() }).eq('id', strategyId).select();
        if (data) setStrategies(prev => prev.map(s => s.id === strategyId ? data[0] : s));
      } catch (err) { console.error('Advance status error:', err); }
    };

    const formatCurrency = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';

    const renderSkuRow = (skuItem, strategy = null) => (
      <tr key={strategy?.id || `${skuItem.pedido_id}-${skuItem.sku}`} className="border-b border-gray-100 hover:bg-gray-50">
        <td className="px-4 py-3 font-mono text-sm font-medium text-[#6B1B8E]">{skuItem.sku || '-'}</td>
        <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate" title={skuItem.produto}>{skuItem.produto || '-'}</td>
        <td className="px-4 py-3 text-gray-600 text-center">{skuItem.quantidade || skuItem.item?.quantidade || '-'}</td>
        <td className="px-4 py-3 text-gray-700 font-medium">{formatCurrency((skuItem.quantidade || skuItem.item?.quantidade || 0) * (skuItem.preco_unitario || skuItem.item?.preco_unitario || 0))}</td>
        <td className="px-4 py-3 text-gray-500 text-sm">{skuItem.fornecedor || skuItem.pedido?.fornecedor || '-'}</td>
        <td className="px-4 py-3 text-center">
          {strategy ? (
            <button onClick={() => toggleJaVendemos({ pedido_id: strategy.pedido_id, sku: strategy.sku })} className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${strategy.ja_vendemos ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'}`}>
              {strategy.ja_vendemos && <CheckCircle2 size={14} />}
            </button>
          ) : (
            <span className="text-gray-300 text-xs">-</span>
          )}
        </td>
        {strategy && (
          <>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                {(strategy.marketplaces_foco || []).map(mp => (
                  <span key={mp} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">{mp}</span>
                ))}
              </div>
            </td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${prioridadeColors[strategy.prioridade] || 'bg-gray-100'}`}>
                {(strategy.prioridade || 'media').charAt(0).toUpperCase() + (strategy.prioridade || 'media').slice(1)}
              </span>
            </td>
          </>
        )}
        <td className="px-4 py-3">
          <div className="flex gap-1">
            <button onClick={() => openStrategyModal(strategy ? { ...skuItem, ...(skuItem.item || {}), pedido_id: strategy.pedido_id, sku: strategy.sku, numero_oc: strategy.numero_oc, fornecedor: skuItem.pedido?.fornecedor || skuItem.fornecedor } : skuItem)} className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50" title={strategy ? 'Editar Estrategia' : 'Definir Estrategia'}>
              {strategy ? <Edit2 size={15} /> : <Plus size={15} />}
            </button>
            {strategy && strategy.status_marketing !== 'concluido' && (
              <button onClick={() => advanceStatus(strategy.id)} className="p-1.5 rounded-lg text-green-500 hover:text-green-700 hover:bg-green-50" title="Avancar Status">
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </td>
      </tr>
    );

    const counts = {
      novos: skuNovos.length,
      planejamento: skuByStatus('em_planejamento').length,
      execucao: skuByStatus('em_execucao').length,
      concluidos: skuByStatus('concluido').length
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Marketing</h2>
            <p className="text-sm text-gray-500 mt-1">Estrategias de marketing para pedidos de fornecedores</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
            <RefreshCw size={16} /> Atualizar
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
          {subTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setMktSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${mktSubTab === tab.id ? 'bg-[#6B1B8E] text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <tab.icon size={16} />
              {tab.label}
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${mktSubTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {counts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#6B1B8E] border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Pedidos Novos - por SKU */}
            {mktSubTab === 'novos' && (
              <>
                {skuNovos.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Megaphone size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Nenhum SKU novo para marketing</p>
                    <p className="text-sm mt-1">Novos produtos de pedidos de fornecedores aparecerao aqui automaticamente</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Produto</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Qtd</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fornecedor</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Ja Vendemos</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acoes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {skuNovos.map(item => renderSkuRow(item))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Em Planejamento / Em Execucao / Concluidos - por SKU */}
            {['planejamento', 'execucao', 'concluidos'].includes(mktSubTab) && (() => {
              const statusMap = { planejamento: 'em_planejamento', execucao: 'em_execucao', concluidos: 'concluido' };
              const items = skuByStatus(statusMap[mktSubTab]);
              return items.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Nenhum SKU {statusLabels[statusMap[mktSubTab]].toLowerCase()}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Produto</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Qtd</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fornecedor</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Ja Vendemos</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Marketplaces</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Prioridade</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(s => renderSkuRow(s, s))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* Strategy Modal */}
        {showStrategyModal && selectedSku && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Estrategia de Marketing - {selectedSku.sku}</h3>
                    <p className="text-sm text-gray-500 mt-1">{selectedSku.produto} | {selectedSku.fornecedor}</p>
                  </div>
                  <button onClick={() => setShowStrategyModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* SKU details */}
                <div className="bg-purple-50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-purple-700 mb-1">Detalhes do SKU:</p>
                    <p className="text-sm text-purple-900">{selectedSku.sku}: {selectedSku.produto} | {selectedSku.quantidade}un x R$ {Number(selectedSku.preco_unitario || 0).toFixed(2)} = R$ {((selectedSku.quantidade || 0) * (selectedSku.preco_unitario || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all bg-white">
                    <input type="checkbox" className="rounded text-green-500" checked={strategyForm.ja_vendemos} onChange={() => setStrategyForm({ ...strategyForm, ja_vendemos: !strategyForm.ja_vendemos })} />
                    <span className="text-sm font-medium text-gray-700">Ja vendemos</span>
                  </label>
                </div>

                {/* Marketplace Foco */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Marketplace Foco</label>
                  <div className="grid grid-cols-3 gap-2">
                    {marketplaces.map(mp => (
                      <label key={mp} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${strategyForm.marketplaces_foco.includes(mp) ? 'border-[#6B1B8E] bg-purple-50 text-[#6B1B8E]' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="checkbox" className="rounded text-[#6B1B8E]" checked={strategyForm.marketplaces_foco.includes(mp)} onChange={() => setStrategyForm({ ...strategyForm, marketplaces_foco: toggleArrayItem(strategyForm.marketplaces_foco, mp) })} />
                        <span className="text-sm">{mp}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tipo Estrategia */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Estrategia</label>
                  <select value={strategyForm.tipo_estrategia} onChange={e => setStrategyForm({ ...strategyForm, tipo_estrategia: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6B1B8E]/20 focus:border-[#6B1B8E]">
                    {tiposEstrategia.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>

                {/* Acoes Planejadas */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Acoes Planejadas</label>
                  <div className="grid grid-cols-2 gap-2">
                    {acoesOptions.map(acao => (
                      <label key={acao} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${strategyForm.acoes_planejadas.includes(acao) ? 'border-[#6B1B8E] bg-purple-50 text-[#6B1B8E]' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="checkbox" className="rounded text-[#6B1B8E]" checked={strategyForm.acoes_planejadas.includes(acao)} onChange={() => setStrategyForm({ ...strategyForm, acoes_planejadas: toggleArrayItem(strategyForm.acoes_planejadas, acao) })} />
                        <span className="text-sm">{acao}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Prioridade + Responsavel */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Prioridade</label>
                    <select value={strategyForm.prioridade} onChange={e => setStrategyForm({ ...strategyForm, prioridade: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6B1B8E]/20 focus:border-[#6B1B8E]">
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baixa">Baixa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Responsavel</label>
                    <input type="text" value={strategyForm.responsavel} onChange={e => setStrategyForm({ ...strategyForm, responsavel: e.target.value })} placeholder="Nome do responsavel" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6B1B8E]/20 focus:border-[#6B1B8E]" />
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Deadline</label>
                  <input type="date" value={strategyForm.deadline} onChange={e => setStrategyForm({ ...strategyForm, deadline: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6B1B8E]/20 focus:border-[#6B1B8E]" />
                </div>

                {/* Observacoes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Observacoes</label>
                  <textarea value={strategyForm.observacoes} onChange={e => setStrategyForm({ ...strategyForm, observacoes: e.target.value })} rows={3} placeholder="Notas sobre a estrategia..." className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6B1B8E]/20 focus:border-[#6B1B8E]" />
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setShowStrategyModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button onClick={handleSaveStrategy} className="px-6 py-2 bg-[#6B1B8E] text-white rounded-lg hover:bg-[#5a1678] font-medium">Salvar Estrategia</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 7b. Gestao de Produtos Parados
  const GestaoAnunciosView = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTutorial, setShowTutorial] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [filter, setFilter] = useState('todos');
    const emptyForm = { sku: '', produto: '', giro_mensal: '', estoque_atual: '', data_compra: '', projecao_vendas_meses: '', estrategia: '', acao: '', semana_1: '', semana_2: '', semana_3: '', semana_4: '', responsavel: '', status: 'em_analise', observacoes: '' };
    const [formData, setFormData] = useState({ ...emptyForm });

    const statusOpts = [
      { value: 'em_analise', label: 'Em Analise', color: 'bg-yellow-100 text-yellow-800' },
      { value: 'em_acao', label: 'Em Acao', color: 'bg-blue-100 text-blue-800' },
      { value: 'resolvido', label: 'Resolvido', color: 'bg-green-100 text-green-800' }
    ];
    const getStatusStyle = (s) => statusOpts.find(o => o.value === s)?.color || 'bg-gray-100 text-gray-800';
    const getStatusLabel = (s) => statusOpts.find(o => o.value === s)?.label || s;

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.from('gestao_produtos_parados').select('*').order('created_at', { ascending: false });
        if (data) setProducts(data);
      } catch (err) { console.error('Gestao parados fetch error:', err); }
      setLoading(false);
    };

    const handleSave = async () => {
      const payload = {
        sku: formData.sku,
        produto: formData.produto,
        giro_mensal: Number(formData.giro_mensal) || 0,
        estoque_atual: Number(formData.estoque_atual) || 0,
        data_compra: formData.data_compra || null,
        projecao_vendas_meses: Number(formData.projecao_vendas_meses) || null,
        estrategia: formData.estrategia || null,
        acao: formData.acao || null,
        semana_1: formData.semana_1 || null,
        semana_2: formData.semana_2 || null,
        semana_3: formData.semana_3 || null,
        semana_4: formData.semana_4 || null,
        responsavel: formData.responsavel || null,
        status: formData.status,
        observacoes: formData.observacoes || null,
        updated_at: new Date().toISOString()
      };
      try {
        if (editingProduct) {
          const { data } = await supabase.from('gestao_produtos_parados').update(payload).eq('id', editingProduct.id).select();
          if (data) setProducts(prev => prev.map(p => p.id === editingProduct.id ? data[0] : p));
        } else {
          const { data } = await supabase.from('gestao_produtos_parados').insert(payload).select();
          if (data) setProducts(prev => [data[0], ...prev]);
        }
      } catch (err) { console.error('Save error:', err); }
      setShowForm(false);
      setEditingProduct(null);
      setFormData({ ...emptyForm });
    };

    const handleEdit = (product) => {
      setEditingProduct(product);
      setFormData({
        sku: product.sku || '',
        produto: product.produto || '',
        giro_mensal: product.giro_mensal || '',
        estoque_atual: product.estoque_atual || '',
        data_compra: product.data_compra || '',
        projecao_vendas_meses: product.projecao_vendas_meses || '',
        estrategia: product.estrategia || '',
        acao: product.acao || '',
        semana_1: product.semana_1 || '',
        semana_2: product.semana_2 || '',
        semana_3: product.semana_3 || '',
        semana_4: product.semana_4 || '',
        responsavel: product.responsavel || '',
        status: product.status || 'em_analise',
        observacoes: product.observacoes || ''
      });
      setShowForm(true);
    };

    const handleDelete = async (id) => {
      if (!confirm('Remover este produto da gestao?')) return;
      await supabase.from('gestao_produtos_parados').delete().eq('id', id);
      setProducts(prev => prev.filter(p => p.id !== id));
    };

    const counts = {
      todos: products.length,
      em_analise: products.filter(p => p.status === 'em_analise').length,
      em_acao: products.filter(p => p.status === 'em_acao').length,
      resolvido: products.filter(p => p.status === 'resolvido').length
    };

    const displayList = filter === 'todos' ? products : products.filter(p => p.status === filter);
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestao de Produtos Parados</h2>
            <p className="text-sm text-gray-500 mt-1">Acompanhe acoes em produtos com baixo giro ou parados</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTutorial(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200">
              <Info size={16} /> Tutorial de Uso
            </button>
            <button onClick={() => { setEditingProduct(null); setFormData({ ...emptyForm }); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#6B1B8E] text-white rounded-lg hover:bg-[#5a1678]">
              <Plus size={16} /> Adicionar Produto
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button onClick={() => setFilter('todos')} className={`p-4 rounded-xl border transition-all text-left ${filter === 'todos' ? 'border-[#6B1B8E] bg-purple-50 shadow-md' : 'border-gray-100 bg-white hover:border-gray-300'}`}>
            <p className="text-3xl font-bold text-gray-800">{counts.todos}</p>
            <p className="text-sm text-gray-500 mt-1">Total</p>
          </button>
          <button onClick={() => setFilter('em_analise')} className={`p-4 rounded-xl border transition-all text-left ${filter === 'em_analise' ? 'border-yellow-400 bg-yellow-50 shadow-md' : 'border-gray-100 bg-white hover:border-gray-300'}`}>
            <p className="text-3xl font-bold text-yellow-600">{counts.em_analise}</p>
            <p className="text-sm text-gray-500 mt-1">Em Analise</p>
          </button>
          <button onClick={() => setFilter('em_acao')} className={`p-4 rounded-xl border transition-all text-left ${filter === 'em_acao' ? 'border-blue-400 bg-blue-50 shadow-md' : 'border-gray-100 bg-white hover:border-gray-300'}`}>
            <p className="text-3xl font-bold text-blue-600">{counts.em_acao}</p>
            <p className="text-sm text-gray-500 mt-1">Em Acao</p>
          </button>
          <button onClick={() => setFilter('resolvido')} className={`p-4 rounded-xl border transition-all text-left ${filter === 'resolvido' ? 'border-green-400 bg-green-50 shadow-md' : 'border-gray-100 bg-white hover:border-gray-300'}`}>
            <p className="text-3xl font-bold text-green-600">{counts.resolvido}</p>
            <p className="text-sm text-gray-500 mt-1">Resolvidos</p>
          </button>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#6B1B8E] border-t-transparent rounded-full animate-spin" /></div>
        ) : displayList.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
            <Target size={48} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium text-gray-600">Nenhum produto cadastrado</p>
            <p className="text-sm mt-2">Clique em "Adicionar Produto" para comecar a acompanhar produtos parados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayList.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-[#6B1B8E] bg-purple-50 px-3 py-1 rounded-lg">{item.sku}</span>
                    <span className="font-medium text-gray-800">{item.produto || '-'}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(item.status)}`}>{getStatusLabel(item.status)}</span>
                    {item.estrategia && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.estrategia === 'queima' ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700'}`}>
                        {item.estrategia === 'queima' ? 'Queima' : 'Reintroducao'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Editar"><Edit2 size={15} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Remover"><Trash2 size={15} /></button>
                  </div>
                </div>

                {(() => {
                  const vendaSemanas = [item.semana_1, item.semana_2, item.semana_3, item.semana_4].map(s => Number(s) || 0);
                  const totalVendido = vendaSemanas.reduce((a, b) => a + b, 0);
                  const semanasPreenchidas = vendaSemanas.filter(v => v > 0).length;
                  const estoqueAtualizado = (item.estoque_atual || 0) - totalVendido;
                  const giroSemanal = semanasPreenchidas > 0 ? totalVendido / semanasPreenchidas : 0;
                  const giroMensalAtualizado = semanasPreenchidas > 0 ? Math.round(giroSemanal * 4 * 10) / 10 : Number(item.giro_mensal) || 0;
                  const projecaoAtualizada = giroMensalAtualizado > 0 ? Math.round(estoqueAtualizado / giroMensalAtualizado * 10) / 10 : Number(item.projecao_vendas_meses) || 0;

                  return (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-semibold">Giro Mensal {semanasPreenchidas > 0 ? '(atualizado)' : '(inicial)'}</p>
                          <p className="text-sm font-medium text-gray-700">{giroMensalAtualizado} un/mes</p>
                          {semanasPreenchidas > 0 && Number(item.giro_mensal) > 0 && <p className="text-xs text-gray-400 line-through">{item.giro_mensal} un/mes</p>}
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-semibold">Estoque {totalVendido > 0 ? 'Atualizado' : 'Atual'}</p>
                          <p className={`text-sm font-bold ${estoqueAtualizado < 10 ? 'text-red-600' : 'text-gray-700'}`}>{estoqueAtualizado} un</p>
                          {totalVendido > 0 && <p className="text-xs text-gray-400 line-through">{item.estoque_atual} un</p>}
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-semibold">Data Compra</p>
                          <p className="text-sm font-medium text-gray-700">{formatDate(item.data_compra)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-semibold">Projecao {semanasPreenchidas > 0 ? '(atualizada)' : ''}</p>
                          <p className={`text-sm font-bold ${projecaoAtualizada > 12 ? 'text-red-600' : projecaoAtualizada > 6 ? 'text-yellow-600' : 'text-green-600'}`}>{projecaoAtualizada > 0 ? `${projecaoAtualizada} meses` : '-'}</p>
                          {semanasPreenchidas > 0 && Number(item.projecao_vendas_meses) > 0 && <p className="text-xs text-gray-400 line-through">{item.projecao_vendas_meses} meses</p>}
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-semibold">Responsavel</p>
                          <p className="text-sm font-medium text-gray-700">{item.responsavel || '-'}</p>
                        </div>
                      </div>

                      {item.acao && (
                        <div className="mb-3 bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-blue-500 uppercase font-semibold mb-1">Acao Tomada</p>
                          <p className="text-sm text-blue-800">{item.acao}</p>
                        </div>
                      )}

                      {/* Weekly Tracking */}
                      <div className="grid grid-cols-4 gap-2">
                        {['semana_1', 'semana_2', 'semana_3', 'semana_4'].map((sem, idx) => {
                          const val = Number(item[sem]) || 0;
                          const filled = val > 0;
                          return (
                            <div key={sem} className={`rounded-lg p-2.5 text-center border ${filled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                              <p className="text-xs font-semibold text-gray-500">Semana {idx + 1}</p>
                              {filled ? (
                                <p className="text-lg font-bold text-green-700 mt-1">{val} <span className="text-xs font-normal">un</span></p>
                              ) : (
                                <p className="text-xs mt-2 text-gray-300">Aguardando</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {totalVendido > 0 && (
                        <div className="mt-2 flex items-center gap-4 text-xs">
                          <span className="text-green-600 font-semibold">Total vendido: {totalVendido} un em {semanasPreenchidas} semana{semanasPreenchidas > 1 ? 's' : ''}</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-gray-500">Media: {Math.round(totalVendido / semanasPreenchidas * 10) / 10} un/semana</span>
                        </div>
                      )}

                      {item.observacoes && (
                        <div className="mt-3 text-xs text-gray-400"><span className="font-semibold">Obs:</span> {item.observacoes}</div>
                      )}
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        )}

        {/* Tutorial Modal */}
        {showTutorial && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Info size={20} className="text-blue-600" /></div>
                  <h3 className="text-lg font-bold text-gray-800">Tutorial - Gestao de Produtos Parados</h3>
                </div>
                <button onClick={() => setShowTutorial(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="bg-purple-50 rounded-xl p-4">
                  <h4 className="font-bold text-[#6B1B8E] mb-2">Objetivo</h4>
                  <p className="text-sm text-gray-700">Acompanhar e tomar acoes sobre produtos com baixo giro ou parados, garantindo que nenhum produto fique encalhado sem uma estrategia definida.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#6B1B8E] text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Identificar o Produto</h5>
                      <p className="text-sm text-gray-600 mt-1">Escolha qual SKU sera analisado. Priorize produtos com alto estoque e baixo giro.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#6B1B8E] text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Puxar Historico de Vendas (60 dias)</h5>
                      <p className="text-sm text-gray-600 mt-1">No BaseLinker, consulte o historico de vendas dos ultimos 60 dias do produto. Anote a quantidade vendida no periodo para calcular o giro mensal.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#6B1B8E] text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Verificar Estoque Atual</h5>
                      <p className="text-sm text-gray-600 mt-1">Consulte o estoque atual do produto no BaseLinker (inventario SNIFF 39104).</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#6B1B8E] text-white flex items-center justify-center text-sm font-bold shrink-0">4</div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Calcular Projecao</h5>
                      <p className="text-sm text-gray-600 mt-1">Divida o estoque atual pelo giro mensal para saber quantos meses o produto ficara parado sem acao. <strong>Ex: 180 un / 6 un/mes = 30 meses.</strong></p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#6B1B8E] text-white flex items-center justify-center text-sm font-bold shrink-0">5</div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Escolher Estrategia</h5>
                      <p className="text-sm text-gray-600 mt-1">Defina se a estrategia e de <strong>Queima</strong> (eliminar o estoque de vez, via promocao agressiva, kit, liquidacao) ou <strong>Reintroducao</strong> (avaliar se vale a pena voltar a trabalhar o produto com nova estrategia de vendas).</p>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Queima = Eliminar estoque</span>
                        <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">Reintroducao = Avaliar potencial</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#6B1B8E] text-white flex items-center justify-center text-sm font-bold shrink-0">6</div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Definir Acao</h5>
                      <p className="text-sm text-gray-600 mt-1">Defina que acao sera tomada para acelerar as vendas. Exemplos: Enviar ao FULL, criar catalogo, campanha de ads, baixar preco, enviar a novo marketplace.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#6B1B8E] text-white flex items-center justify-center text-sm font-bold shrink-0">7</div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Acompanhamento Semanal</h5>
                      <p className="text-sm text-gray-600 mt-1">Toda semana, preencha o resultado da acao (vendas, visualizacoes, performance). O responsavel deve atualizar as semanas 1, 2, 3 e 4 com os resultados.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                  <h4 className="font-bold text-yellow-700 mb-2">Dica: Relatorio Diario</h4>
                  <p className="text-sm text-gray-700">O ideal e alimentar o relatorio todo dia (tarefa do estagiario). Use o ChatGPT dos funcionarios para analisar os dados de vendas e gerar insights sobre cada produto.</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-bold text-gray-700 mb-2">Exemplo Preenchido</h4>
                  <div className="text-sm text-gray-600 space-y-1 font-mono">
                    <p><strong>SKU:</strong> GL7309</p>
                    <p><strong>Produto:</strong> Copo De Caipirinha 300ml De Vidro</p>
                    <p><strong>Giro Mensal:</strong> 6 un (1 Jogo) nos ultimos 30 dias</p>
                    <p><strong>Projecao:</strong> 30 Meses</p>
                    <p><strong>Estrategia:</strong> Reintroducao (avaliar se vale voltar com nova estrategia)</p>
                    <p><strong>Acao:</strong> Enviado ao FULL da Romobr em Catalogo no ML com media de 50 vendas/mes</p>
                    <p><strong>Responsavel:</strong> Natalya</p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end">
                <button onClick={() => setShowTutorial(false)} className="px-6 py-2 bg-[#6B1B8E] text-white rounded-lg hover:bg-[#5a1678] font-medium">Entendi!</button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">{editingProduct ? 'Editar Produto' : 'Adicionar Produto Parado'}</h3>
                <button onClick={() => { setShowForm(false); setEditingProduct(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">SKU *</label>
                    <input type="text" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} placeholder="Ex: GL7309" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6B1B8E]/20 focus:border-[#6B1B8E]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Produto</label>
                    <input type="text" value={formData.produto} onChange={e => setFormData({ ...formData, produto: e.target.value })} placeholder="Nome do produto" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6B1B8E]/20 focus:border-[#6B1B8E]" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Giro Mensal (un)</label>
                    <input type="number" value={formData.giro_mensal} onChange={e => setFormData({ ...formData, giro_mensal: e.target.value })} placeholder="6" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6B1B8E]/20 focus:border-[#6B1B8E]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Estoque Atual (un)</label>
                    <input type="number" value={formData.estoque_atual} onChange={e => setFormData({ ...formData, estoque_atual: e.target.value })} placeholder="180" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6B1B8E]/20 focus:border-[#6B1B8E]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Projecao (meses)</label>
                    <input type="number" value={formData.projecao_vendas_meses} onChange={e => setFormData({ ...formData, projecao_vendas_meses: e.target.value })} placeholder="30" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6B1B8E]/20 focus:border-[#6B1B8E]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Data da Compra</label>
                    <input type="date" value={formData.data_compra} onChange={e => setFormData({ ...formData, data_compra: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6B1B8E]/20 focus:border-[#6B1B8E]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6B1B8E]/20 focus:border-[#6B1B8E]">
                      {statusOpts.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Estrategia</label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setFormData({ ...formData, estrategia: 'queima' })} className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${formData.estrategia === 'queima' ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}>
                      <span className="text-lg">🔥</span>
                      <p className="font-bold mt-1">Queima</p>
                      <p className="text-xs mt-0.5 opacity-75">Eliminar do estoque</p>
                    </button>
                    <button type="button" onClick={() => setFormData({ ...formData, estrategia: 'reintroducao' })} className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${formData.estrategia === 'reintroducao' ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}>
                      <span className="text-lg">🔄</span>
                      <p className="font-bold mt-1">Reintroducao</p>
                      <p className="text-xs mt-0.5 opacity-75">Avaliar se vale voltar</p>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Acao Tomada</label>
                  <textarea value={formData.acao} onChange={e => setFormData({ ...formData, acao: e.target.value })} rows={2} placeholder="Ex: Enviado ao FULL da Romobr em um Catalogo no ML com media de 50 vendas/mes" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6B1B8E]/20 focus:border-[#6B1B8E]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Acompanhamento Semanal (qtd vendida)</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n}>
                        <label className="block text-xs text-gray-500 mb-1">Semana {n}</label>
                        <input type="number" min="0" value={formData[`semana_${n}`]} onChange={e => setFormData({ ...formData, [`semana_${n}`]: e.target.value })} placeholder="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-[#6B1B8E]/20 focus:border-[#6B1B8E]" />
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const sv = [1,2,3,4].map(n => Number(formData[`semana_${n}`]) || 0);
                    const tot = sv.reduce((a,b) => a+b, 0);
                    const weeks = sv.filter(v => v > 0).length;
                    const est = (Number(formData.estoque_atual) || 0) - tot;
                    const giroS = weeks > 0 ? tot / weeks : 0;
                    const giroM = weeks > 0 ? Math.round(giroS * 4 * 10) / 10 : Number(formData.giro_mensal) || 0;
                    const proj = giroM > 0 ? Math.round(est / giroM * 10) / 10 : 0;
                    return tot > 0 ? (
                      <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-green-700 font-semibold">Vendido: {tot} un em {weeks} semana{weeks > 1 ? 's' : ''}</span>
                          <span className="text-green-600">Estoque ajustado: {est} un</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-gray-600">Novo giro: {giroM} un/mes</span>
                          <span className={`font-bold ${proj > 12 ? 'text-red-600' : proj > 6 ? 'text-yellow-600' : 'text-green-600'}`}>Projecao: {proj > 0 ? `${proj} meses` : '-'}</span>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Responsavel</label>
                    <input type="text" value={formData.responsavel} onChange={e => setFormData({ ...formData, responsavel: e.target.value })} placeholder="Nome do responsavel" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6B1B8E]/20 focus:border-[#6B1B8E]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Observacoes</label>
                    <input type="text" value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} placeholder="Notas adicionais" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6B1B8E]/20 focus:border-[#6B1B8E]" />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => { setShowForm(false); setEditingProduct(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button onClick={handleSave} disabled={!formData.sku} className="px-6 py-2 bg-[#6B1B8E] text-white rounded-lg hover:bg-[#5a1678] font-medium disabled:opacity-50 disabled:cursor-not-allowed">Salvar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 8. Fulfillment View
  const FulfillmentView = () => {
    const [envios, setEnvios] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingEnvio, setEditingEnvio] = useState(null);
    const [activeFilter, setActiveFilter] = useState('todos');
    const [filterMonth, setFilterMonth] = useState('todos');
    const [filterMarketplace, setFilterMarketplace] = useState('todos');
    const [filterLoja, setFilterLoja] = useState('todos');
    const emptyForm = { numero_envio: '', marketplace: '', skus: '', quantidade: '', custo_envio: '', custo_obs: '', data_criacao: '', data_coleta: '', status: 'em_aberto', observacoes: '' };
    const [formData, setFormData] = useState({ ...emptyForm });

    useEffect(() => {
      const load = async () => {
        const { data } = await supabase.from('fulfillment_envios').select('*').order('data_criacao', { ascending: false });
        if (data) setEnvios(data);
      };
      load();
    }, []);

    const handleSave = async () => {
      const payload = {
        numero_envio: formData.numero_envio,
        marketplace: formData.marketplace,
        skus: formData.skus ? formData.skus.split(',').map(s => s.trim()).filter(Boolean) : [],
        quantidade: Number(formData.quantidade) || 0,
        custo_envio: formData.custo_envio ? Number(formData.custo_envio) : null,
        custo_obs: formData.custo_obs || null,
        data_criacao: formData.data_criacao || null,
        data_coleta: formData.data_coleta || null,
        status: formData.status,
        observacoes: formData.observacoes || null,
      };

      if (editingEnvio) {
        const { data } = await supabase.from('fulfillment_envios').update(payload).eq('id', editingEnvio.id).select();
        if (data) setEnvios(prev => prev.map(e => e.id === editingEnvio.id ? data[0] : e));
      } else {
        const { data } = await supabase.from('fulfillment_envios').insert(payload).select();
        if (data) setEnvios(prev => [data[0], ...prev]);
      }
      setShowForm(false);
      setEditingEnvio(null);
      setFormData({ ...emptyForm });
    };

    const handleEdit = (envio) => {
      setEditingEnvio(envio);
      setFormData({
        numero_envio: envio.numero_envio || '',
        marketplace: envio.marketplace || '',
        skus: (envio.skus || []).join(', '),
        quantidade: envio.quantidade || '',
        custo_envio: envio.custo_envio || '',
        custo_obs: envio.custo_obs || '',
        data_criacao: envio.data_criacao || '',
        data_coleta: envio.data_coleta || '',
        status: envio.status || 'em_aberto',
        observacoes: envio.observacoes || '',
      });
      setShowForm(true);
    };

    const handleDelete = async (envio) => {
      if (!confirm(`Excluir envio ${envio.numero_envio}?`)) return;
      await supabase.from('fulfillment_envios').delete().eq('id', envio.id);
      setEnvios(prev => prev.filter(e => e.id !== envio.id));
    };

    const handleStatusChange = async (envio, newStatus) => {
      const updates = { status: newStatus };
      if (newStatus === 'coletado' && !envio.data_coleta) updates.data_coleta = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('fulfillment_envios').update(updates).eq('id', envio.id).select();
      if (data) setEnvios(prev => prev.map(e => e.id === envio.id ? data[0] : e));
    };

    // Loja extraction from marketplace name
    const getLojaFromMarketplace = (mp) => {
      if (!mp) return 'Outro';
      const lower = mp.toLowerCase();
      if (lower.includes('sniff')) return 'Sniff';
      if (lower.includes('casa')) return 'Casa Ipiranga';
      if (lower.includes('romo')) return 'RomoBR';
      if (lower.includes('inovate') || lower === 'amazon') return 'Inovate';
      return 'Outro';
    };

    const getMarketplaceBase = (mp) => {
      if (!mp) return 'Outro';
      if (mp.startsWith('Mercado')) return 'Mercado Livre';
      if (mp.startsWith('Amazon')) return 'Amazon';
      if (mp.startsWith('Shopee')) return 'Shopee';
      if (mp.startsWith('Shein')) return 'Shein';
      return 'Outro';
    };

    // Build available months from data
    const availableMonths = useMemo(() => {
      const months = new Set();
      envios.forEach(e => {
        if (e.data_criacao) months.add(e.data_criacao.slice(0, 7));
      });
      return Array.from(months).sort().reverse();
    }, [envios]);

    // Chain filters: month -> marketplace -> loja -> status
    const baseFiltered = envios.filter(e => {
      if (filterMonth !== 'todos' && !(e.data_criacao && e.data_criacao.startsWith(filterMonth))) return false;
      if (filterMarketplace !== 'todos' && getMarketplaceBase(e.marketplace) !== filterMarketplace) return false;
      if (filterLoja !== 'todos' && getLojaFromMarketplace(e.marketplace) !== filterLoja) return false;
      return true;
    });

    const filtered = baseFiltered.filter(e => {
      if (activeFilter === 'todos') return true;
      return e.status === activeFilter;
    });

    const stats = {
      total: baseFiltered.length,
      aberto: baseFiltered.filter(e => e.status === 'em_aberto').length,
      coletado: baseFiltered.filter(e => e.status === 'coletado').length,
      problema: baseFiltered.filter(e => e.status === 'problema').length,
      custoTotal: baseFiltered.reduce((s, e) => s + (Number(e.custo_envio) || 0), 0),
      unidadesTotal: baseFiltered.reduce((s, e) => s + (Number(e.quantidade) || 0), 0),
    };

    const statusColors = {
      em_aberto: 'bg-yellow-100 text-yellow-800',
      coletado: 'bg-green-100 text-green-800',
      problema: 'bg-red-100 text-red-800',
    };
    const statusLabels = { em_aberto: 'Em Aberto', coletado: 'Coletado', problema: 'Problema' };

    const marketplaces = ['Mercado Livre Sniff', 'Mercado Livre Romo', 'Amazon', 'Amazon Casa', 'Amazon Inovate', 'Shopee', 'Shopee Casa', 'Shopee Romo', 'Shein', 'Shein Casa', 'Shein Romo', 'Shein Sniff', 'Outro'];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Fulfillment</h1>
            <p className="text-gray-500">Controle de envios Full com custos</p>
          </div>
          <button onClick={() => { setEditingEnvio(null); setFormData({ ...emptyForm }); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 text-white rounded-xl" style={{ backgroundColor: COLORS.purple }}>
            <Plus size={18} /> Novo Envio
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { label: 'Total Envios', value: stats.total, color: COLORS.purple },
            { label: 'Em Aberto', value: stats.aberto, color: '#EAB308' },
            { label: 'Coletados', value: stats.coletado, color: '#22C55E' },
            { label: 'Problemas', value: stats.problema, color: '#EF4444' },
            { label: 'Custo Total', value: `R$ ${stats.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: COLORS.gold },
            { label: 'Unidades', value: stats.unidadesTotal.toLocaleString('pt-BR'), color: '#3B82F6' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md p-4 text-center">
              <p className="text-xs text-gray-500 uppercase">{kpi.label}</p>
              <p className="text-xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {[
              { key: 'todos', label: `Todos ${stats.total}` },
              { key: 'em_aberto', label: `Em Aberto ${stats.aberto}` },
              { key: 'coletado', label: `Coletados ${stats.coletado}` },
              { key: 'problema', label: `Problemas ${stats.problema}` },
            ].map(f => (
              <button key={f.key} onClick={() => setActiveFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeFilter === f.key ? 'text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                style={activeFilter === f.key ? { backgroundColor: COLORS.purple } : {}}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 ml-auto flex-wrap">
            <select value={filterMarketplace} onChange={e => setFilterMarketplace(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 cursor-pointer">
              <option value="todos">Marketplace</option>
              {['Mercado Livre', 'Amazon', 'Shopee', 'Shein'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select value={filterLoja} onChange={e => setFilterLoja(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 cursor-pointer">
              <option value="todos">Loja</option>
              {['Sniff', 'Casa Ipiranga', 'RomoBR', 'Inovate', 'Outro'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <Calendar size={16} className="text-gray-400" />
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200 cursor-pointer">
                <option value="todos">Todos os meses</option>
                {availableMonths.map(m => {
                  const [y, mo] = m.split('-');
                  const label = new Date(Number(y), Number(mo) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                  return <option key={m} value={m}>{label.charAt(0).toUpperCase() + label.slice(1)}</option>;
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-white uppercase" style={{ backgroundColor: COLORS.purple }}>
                  <th className="px-4 py-3">ID Envio</th>
                  <th className="px-4 py-3">Marketplace</th>
                  <th className="px-4 py-3">Loja</th>
                  <th className="px-4 py-3">Produtos Enviados</th>
                  <th className="px-4 py-3">Qtd</th>
                  <th className="px-4 py-3">Custo Envio</th>
                  <th className="px-4 py-3">Data Criacao</th>
                  <th className="px-4 py-3">Data Coleta</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">Nenhum envio encontrado</td></tr>
                ) : filtered.map(envio => (
                  <tr key={envio.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-sm" style={{ color: COLORS.purple }}>{envio.numero_envio}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{envio.marketplace}</td>
                    <td className="px-4 py-3 text-sm">
                      {(() => {
                        const loja = getLojaFromMarketplace(envio.marketplace);
                        const lojaColors = { 'Sniff': 'bg-purple-100 text-purple-700', 'Casa Ipiranga': 'bg-blue-100 text-blue-700', 'RomoBR': 'bg-orange-100 text-orange-700', 'Inovate': 'bg-green-100 text-green-700', 'Outro': 'bg-gray-100 text-gray-600' };
                        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${lojaColors[loja] || lojaColors['Outro']}`}>{loja}</span>;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {(envio.skus || []).map((sku, i) => (
                          <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">{sku}</span>
                        ))}
                        {(!envio.skus || envio.skus.length === 0) && <span className="text-gray-400">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{envio.quantidade?.toLocaleString('pt-BR') || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {envio.custo_envio ? (
                        <span className="font-medium text-gray-700">R$ {Number(envio.custo_envio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">{envio.custo_obs || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{envio.data_criacao ? new Date(envio.data_criacao + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{envio.data_coleta ? new Date(envio.data_coleta + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                    <td className="px-4 py-3">
                      <select value={envio.status} onChange={e => handleStatusChange(envio, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${statusColors[envio.status] || 'bg-gray-100'}`}>
                        <option value="em_aberto">Em Aberto</option>
                        <option value="coletado">Coletado</option>
                        <option value="problema">Problema</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(envio)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100" title="Editar"><Edit2 size={15} /></button>
                        <button onClick={() => handleDelete(envio)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50" title="Excluir"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* New/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-bold text-gray-800">{editingEnvio ? 'Editar Envio' : 'Novo Envio Full'}</h3>
                <button onClick={() => { setShowForm(false); setEditingEnvio(null); }} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID do Envio *</label>
                    <input type="text" value={formData.numero_envio} onChange={e => setFormData({ ...formData, numero_envio: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200" placeholder="Ex: #60811477" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marketplace *</label>
                    <select value={formData.marketplace} onChange={e => setFormData({ ...formData, marketplace: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200">
                      <option value="">Selecionar...</option>
                      {marketplaces.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Codigos dos Produtos Enviados (separados por virgula)</label>
                  <input type="text" value={formData.skus} onChange={e => setFormData({ ...formData, skus: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200" placeholder="Ex: CK6482, CK6198, SNF-100, SNFKIT-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade (un)</label>
                    <input type="number" value={formData.quantidade} onChange={e => setFormData({ ...formData, quantidade: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custo Envio (R$)</label>
                    <input type="number" step="0.01" value={formData.custo_envio} onChange={e => setFormData({ ...formData, custo_envio: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Obs. Custo (se nao tem valor)</label>
                  <input type="text" value={formData.custo_obs} onChange={e => setFormData({ ...formData, custo_obs: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200" placeholder="Ex: frete gratis, envio proprio" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Criacao Full</label>
                    <input type="date" value={formData.data_criacao} onChange={e => setFormData({ ...formData, data_criacao: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Coleta</label>
                    <input type="date" value={formData.data_coleta} onChange={e => setFormData({ ...formData, data_coleta: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200">
                    <option value="em_aberto">Em Aberto</option>
                    <option value="coletado">Coletado</option>
                    <option value="problema">Problema</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observacoes</label>
                  <textarea value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200" rows={2} placeholder="Observacoes adicionais..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button onClick={() => { setShowForm(false); setEditingEnvio(null); }} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancelar</button>
                <button onClick={handleSave} disabled={!formData.numero_envio || !formData.marketplace} className="px-4 py-2 text-white rounded-xl disabled:opacity-50" style={{ backgroundColor: COLORS.purple }}>
                  {editingEnvio ? 'Salvar Alteracoes' : 'Criar Envio'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Analise de Vendas Module
  const AnaliseVendasView = () => {
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [error, setError] = useState(null);

    const MONTH_NAMES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

    useEffect(() => {
      loadReports();
    }, []);

    const loadReports = async () => {
      setLoadingReports(true);
      try {
        const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://shaohvrqjimlodzroazt.supabase.co';
        const indexUrl = `${baseUrl}/storage/v1/object/public/reports/index.json`;
        const resp = await fetch(indexUrl);
        if (!resp.ok) throw new Error('index.json not found');
        const index = await resp.json();
        const pdfs = index.filter(f => f.name.endsWith('.pdf')).map(f => {
          const match = f.name.match(/Relatorio_Sniff_(\d{4})-(\d{2})-(\d{2})/);
          return {
            ...f, date: match ? `${match[3]}/${match[2]}/${match[1]}` : f.name,
            dateSort: match ? `${match[1]}-${match[2]}-${match[3]}` : f.date || '',
            month: match ? MONTH_NAMES[parseInt(match[2]) - 1] : '',
            year: match ? match[1] : '',
            url: `${baseUrl}/storage/v1/object/public/reports/${f.name}`,
          };
        }).sort((a, b) => b.dateSort.localeCompare(a.dateSort));
        setReports(pdfs);
        if (pdfs.length > 0) setSelectedReport(pdfs[0]);
      } catch (e) {
        setError('Nenhum relatorio encontrado. O Agente SNIFF criara o index automaticamente no proximo upload.');
        console.error(e);
      }
      setLoadingReports(false);
    };

    const formatBytes = (bytes) => {
      if (!bytes) return '-';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(1) + ' MB';
    };

    if (loadingReports) return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Carregando relatorios...</p>
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6B1B8E] to-[#4A1063] rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={28} />
            <h2 className="text-2xl font-bold">Analise de Vendas</h2>
          </div>
          <p className="text-purple-200">Relatorios diarios gerados automaticamente pelo Agente SNIFF</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-yellow-600" size={20} />
            <div>
              <p className="font-semibold text-yellow-800">Configuracao Pendente</p>
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        )}

        {reports.length === 0 && !error ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-600 mb-2">Nenhum relatorio disponivel</h3>
            <p className="text-gray-400">Os relatorios serao gerados automaticamente pelo Agente SNIFF diariamente as 07:30.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Report list */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Calendar size={18} /> Relatorios Disponiveis ({reports.length})
              </h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {reports.map((r) => (
                  <button
                    key={r.name}
                    onClick={() => setSelectedReport(r)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedReport?.name === r.name
                        ? 'border-[#6B1B8E] bg-purple-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800">{r.date}</p>
                        <p className="text-xs text-gray-500">{r.month} {r.year}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{formatBytes(r.metadata?.size)}</p>
                        <FileText size={16} className="text-purple-400 ml-auto mt-1" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: PDF viewer */}
            <div className="lg:col-span-2">
              {selectedReport && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="bg-gray-50 p-4 flex items-center justify-between border-b">
                    <div>
                      <h3 className="font-bold text-gray-800">Relatorio {selectedReport.date}</h3>
                      <p className="text-sm text-gray-500">{selectedReport.name}</p>
                    </div>
                    <a
                      href={selectedReport.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-[#6B1B8E] text-white rounded-xl text-sm font-bold hover:bg-[#4A1063] transition-all"
                    >
                      <Download size={16} /> Baixar PDF
                    </a>
                  </div>
                  <iframe
                    src={selectedReport.url}
                    className="w-full border-0"
                    style={{ height: '700px' }}
                    title={`Relatorio ${selectedReport.date}`}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================== OPORTUNIDADES v2 ====================
  const OportunidadesView = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('todos');
    const [activeSubTab, setActiveSubTab] = useState('todos');
    const [csvPreview, setCsvPreview] = useState(null);
    const [importing, setImporting] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const emptyForm = { produto: '', fornecedor: '', preco_venda: '', plataforma: '', media_vendas_mes: '', preco_ideal_pagar: '', link_referencia: '', observacoes: '', status: 'mapeado', visitas: '', conversao: '', faturamento_30d: '', share_mercado: '', grupo: '' };
    const [filterGrupo, setFilterGrupo] = useState('todos');
    const [reportGrupo, setReportGrupo] = useState('');
    const normalizeAccents = (str) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
    const grupos = useMemo(() => {
      const seen = new Map();
      items.forEach(i => {
        if (i.grupo) {
          const norm = normalizeAccents(i.grupo.toUpperCase());
          if (!seen.has(norm)) seen.set(norm, i.grupo);
        }
      });
      return [...seen.values()].sort();
    }, [items]);
    const [formData, setFormData] = useState({ ...emptyForm });

    const plataformas = ['Mercado Livre', 'Shopee', 'Amazon', 'TikTok Shop', 'Temu', 'Shein', 'Magazine Luiza', 'Outro'];
    const statusOpts = [
      { value: 'mapeado', label: 'Mapeado', color: 'bg-blue-100 text-blue-800' },
      { value: 'em_analise', label: 'Em Analise', color: 'bg-yellow-100 text-yellow-800' },
      { value: 'aprovado', label: 'Aprovado', color: 'bg-green-100 text-green-800' },
      { value: 'descartado', label: 'Descartado', color: 'bg-red-100 text-red-800' },
      { value: 'em_negociacao', label: 'Em Negociacao', color: 'bg-purple-100 text-purple-800' }
    ];
    const getStatusStyle = (s) => statusOpts.find(o => o.value === s)?.color || 'bg-gray-100 text-gray-800';
    const getStatusLabel = (s) => statusOpts.find(o => o.value === s)?.label || s;

    const comissoes = {
      'Mercado Livre': { pct: 0.115, fixo: (p) => p < 79 ? 6.50 : 0, label: '11.5% + R$6.50 (se <R$79)' },
      'Shopee': { pct: 0.20, fixo: () => 4, label: '20% + R$4/item' },
      'Amazon': { pct: 0.12, fixo: (p) => p >= 100 ? 0 : 5, label: '12% + R$5 (gratis >R$100)' },
      'TikTok Shop': { pct: 0.15, fixo: () => 0, label: '15%' },
      'Temu': { pct: 0.20, fixo: () => 0, label: '20%' },
      'Shein': { pct: 0.20, fixo: () => 0, label: '20%' },
      'Magazine Luiza': { pct: 0.18, fixo: () => 0, label: '18%' },
      'Outro': { pct: 0.15, fixo: () => 0, label: '15%' }
    };
    const impostoSimples = 0.08;
    const margemAlvo = 0.15;

    const calcPrecoIdeal = (precoVenda, plataforma) => {
      if (!precoVenda) return null;
      const c = comissoes[plataforma] || comissoes['Outro'];
      const taxaFixa = c.fixo(precoVenda);
      const ideal = precoVenda * (1 - c.pct - impostoSimples - margemAlvo) - taxaFixa;
      return Math.max(0, ideal).toFixed(2);
    };

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.from('oportunidades').select('*').order('created_at', { ascending: false });
        if (data) setItems(data);
      } catch (err) { console.error('Oportunidades fetch error:', err); }
      setLoading(false);
    };

    const handleSave = async () => {
      if (!formData.produto) return;
      const payload = {
        produto: formData.produto,
        fornecedor: formData.fornecedor || null,
        preco_venda: Number(formData.preco_venda) || null,
        plataforma: formData.plataforma || null,
        media_vendas_mes: Number(formData.media_vendas_mes) || null,
        preco_ideal_pagar: Number(formData.preco_ideal_pagar) || null,
        link_referencia: formData.link_referencia || null,
        observacoes: formData.observacoes || null,
        status: formData.status,
        visitas: Number(formData.visitas) || 0,
        conversao: Number(formData.conversao) || 0,
        faturamento_30d: Number(formData.faturamento_30d) || 0,
        share_mercado: Number(formData.share_mercado) || 0,
        grupo: formData.grupo || null,
        updated_at: new Date().toISOString()
      };
      try {
        if (editingItem) {
          const { data } = await supabase.from('oportunidades').update(payload).eq('id', editingItem.id).select();
          if (data) setItems(prev => prev.map(p => p.id === editingItem.id ? data[0] : p));
        } else {
          payload.user_id = user.id;
          const { data } = await supabase.from('oportunidades').insert(payload).select();
          if (data) setItems(prev => [data[0], ...prev]);
        }
      } catch (err) { console.error('Save error:', err); }
      setShowForm(false);
      setEditingItem(null);
      setFormData({ ...emptyForm });
    };

    const handleEdit = (item) => {
      setEditingItem(item);
      setFormData({
        produto: item.produto || '', fornecedor: item.fornecedor || '', preco_venda: item.preco_venda || '',
        plataforma: item.plataforma || '', media_vendas_mes: item.media_vendas_mes || '', preco_ideal_pagar: item.preco_ideal_pagar || '',
        link_referencia: item.link_referencia || '', observacoes: item.observacoes || '', status: item.status || 'mapeado',
        visitas: item.visitas || '', conversao: item.conversao || '', faturamento_30d: item.faturamento_30d || '', share_mercado: item.share_mercado || '', grupo: item.grupo || ''
      });
      setShowForm(true);
    };

    const handleDelete = async (id) => {
      if (!confirm('Remover esta oportunidade?')) return;
      await supabase.from('oportunidades').delete().eq('id', id);
      setItems(prev => prev.filter(p => p.id !== id));
    };

    // File Upload for Nubimetrics (ML) - supports CSV and Excel (.xlsx/.xls)
    const handleCsvUpload = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const isExcel = file.name.match(/\.xlsx?$/i);

      if (isExcel) {
        // Excel parsing (Nubimetrics format)
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const wb = XLSX.read(evt.target.result, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const allRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

            // Nubimetrics format: Row 1=title, Row 2=date range, Row 3=empty, Row 4=headers, Row 5+=data
            // Find header row: must have 3+ non-empty cells AND contain "Vendas" keyword
            let headerIdx = -1;
            for (let i = 0; i < Math.min(10, allRows.length); i++) {
              const row = allRows[i];
              const nonEmpty = row.filter(c => c !== '' && c != null).length;
              if (nonEmpty < 3) continue; // Skip title/date rows (single merged cell)
              const rowStr = row.map(c => String(c).toLowerCase()).join('|');
              if (rowStr.includes('vendas') && (rowStr.includes('vendedor') || rowStr.includes('anuncio') || rowStr.includes('an\u00fancio') || rowStr.includes('pre\u00e7o') || rowStr.includes('preco'))) {
                headerIdx = i;
                break;
              }
            }
            if (headerIdx === -1) { alert('Formato nao reconhecido. Nao encontrei cabecalho com colunas "Vendas", "Vendedor", "Preco".'); return; }

            const headers = allRows[headerIdx].map(h => String(h).trim());
            const dataRows = allRows.slice(headerIdx + 1).filter(r => r.some(c => c !== ''));

            // Map columns
            const findIdx = (patterns) => headers.findIndex(h => patterns.some(p => h.toLowerCase().includes(p)));
            const iData = findIdx(['data', 'date']);
            const iAnuncio = findIdx(['titulo', 't\u00edtulo', 'anuncio', 'an\u00fancio', 'produto']);
            const iVendedor = findIdx(['vendedor', 'seller', 'loja']);
            const iVendasR = findIdx(['vendas em $', 'vendas r$', 'faturamento', 'revenue']);
            const iVendasUn = findIdx(['vendas em unid', 'unidades', 'units', 'qtd']);
            const iPreco = findIdx(['preco', 'pre\u00e7o', 'price']);
            const iVisitas = findIdx(['visitas', 'visits', 'views']);
            const iConversao = findIdx(['convers\u00e3o', 'conversao', 'conversion']);
            const iShare = findIdx(['share em $', 'share', 'market share']);

            if (iAnuncio === -1 && iVendedor === -1) { alert('Colunas "Titulo/Anuncio" ou "Vendedor" nao encontradas no arquivo.'); return; }

            // Detect format: SUMMARY (no Data column or Data col has no dates) vs DAILY (has date column)
            const isSummaryFormat = iData === -1 || !dataRows.some(r => {
              const v = r[iData];
              if (!v) return false;
              if (typeof v === 'number' && v > 40000 && v < 60000) return true;
              return String(v).match(/^\d{4}-\d{2}-\d{2}/);
            });

            let parsed;
            let periodDays = 30;
            let extrapolationFactor = 1;

            if (isSummaryFormat) {
              // SUMMARY FORMAT: 1 row per seller, already 30-day data
              parsed = dataRows.map(row => {
                const anuncio = iAnuncio >= 0 ? String(row[iAnuncio] || '').trim() : '';
                const vendedor = iVendedor >= 0 ? String(row[iVendedor] || '').trim() : '';
                if (!anuncio && !vendedor) return null;
                const vendasUn = iVendasUn >= 0 ? (parseInt(String(row[iVendasUn] || '0')) || 0) : 0;
                const preco = iPreco >= 0 ? (parseFloat(String(row[iPreco] || '0').replace(',', '.')) || 0) : 0;
                const faturamento = iVendasR >= 0 ? (parseFloat(String(row[iVendasR] || '0').replace(',', '.')) || 0) : 0;
                const visitas = iVisitas >= 0 ? (parseInt(String(row[iVisitas] || '0')) || 0) : 0;
                const conversao = iConversao >= 0 ? (parseFloat(String(row[iConversao] || '0').replace(',', '.')) || 0) : 0;
                const share = iShare >= 0 ? (parseFloat(String(row[iShare] || '0').replace(',', '.')) || 0) : 0;
                return {
                  produto: (anuncio || vendedor).substring(0, 150),
                  fornecedor: vendedor,
                  preco_venda: Math.round(preco * 100) / 100,
                  media_vendas_mes: vendasUn,
                  faturamento_30d: Math.round(faturamento * 100) / 100,
                  visitas,
                  conversao: Math.round(conversao * 100) / 100,
                  share_mercado: Math.round(share * 100) / 100,
                  link_referencia: '',
                  plataforma: 'Mercado Livre'
                };
              }).filter(r => r && r.produto && r.media_vendas_mes > 0)
                .sort((a, b) => b.media_vendas_mes - a.media_vendas_mes);
            } else {
              // DAILY FORMAT: multiple rows per seller with dates, needs aggregation
              const excelDateToStr = (d) => {
                if (!d) return '';
                if (typeof d === 'number' && d > 40000 && d < 60000) return new Date((d - 25569) * 86400 * 1000).toISOString().slice(0, 10);
                const s = String(d).trim();
                if (s.match(/^\d{4}-\d{2}-\d{2}/)) return s.slice(0, 10);
                const m2 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
                if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`;
                return s;
              };
              const dates = new Set();
              dataRows.forEach(r => { if (iData >= 0) { const ds = excelDateToStr(r[iData]); if (ds.match(/^\d{4}-\d{2}-\d{2}$/)) dates.add(ds); } });
              periodDays = Math.max(dates.size, 1);
              extrapolationFactor = 30 / periodDays;

              const sellers = {};
              dataRows.forEach(row => {
                const vendedor = iVendedor >= 0 ? String(row[iVendedor] || '').trim() : '';
                const anuncio = iAnuncio >= 0 ? String(row[iAnuncio] || '').trim() : '';
                const key = vendedor || anuncio;
                if (!key) return;
                const vendasUn = iVendasUn >= 0 ? (parseFloat(String(row[iVendasUn] || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0) : 0;
                const preco = iPreco >= 0 ? (parseFloat(String(row[iPreco] || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0) : 0;
                if (!sellers[key]) sellers[key] = { anuncio: anuncio || '', vendedor: vendedor || '', maxVendas: 0, precos: [] };
                if (vendasUn > sellers[key].maxVendas) sellers[key].maxVendas = vendasUn;
                if (preco > 0) sellers[key].precos.push(preco);
                if (anuncio && !sellers[key].anuncio) sellers[key].anuncio = anuncio;
              });
              parsed = Object.values(sellers).map(s => {
                const avgPreco = s.precos.length > 0 ? s.precos.reduce((a, b) => a + b, 0) / s.precos.length : 0;
                return {
                  produto: (s.anuncio || s.vendedor).substring(0, 150),
                  fornecedor: s.vendedor,
                  preco_venda: Math.round(avgPreco * 100) / 100,
                  media_vendas_mes: Math.round(s.maxVendas * extrapolationFactor),
                  faturamento_30d: 0, visitas: 0, conversao: 0, share_mercado: 0,
                  link_referencia: '',
                  plataforma: 'Mercado Livre'
                };
              }).filter(r => r.produto && r.media_vendas_mes > 0)
                .sort((a, b) => b.media_vendas_mes - a.media_vendas_mes);
            }

            if (parsed.length === 0) { alert('Nenhum dado de vendas encontrado no arquivo. Verifique o formato.'); return; }

            // Extract group name from filename: "Grupo de anuncios - PRODUCT NAME - dates.xlsx"
            const grupoMatch = file.name.match(/^Grupo de an[uú]ncios\s*-\s*(.+?)\s*-\s*(?:Evolu|[\d]{4})/i);
            const grupoName = grupoMatch ? grupoMatch[1].trim().toUpperCase() : file.name.replace(/\.[^.]+$/, '').toUpperCase();

            setCsvPreview({
              data: parsed,
              fileName: file.name,
              grupo: grupoName,
              colMap: { colTitulo: headers[iAnuncio], colPreco: headers[iPreco], colVendas: headers[iVendasUn], colVendedor: headers[iVendedor] },
              totalRows: dataRows.length,
              isSummary: isSummaryFormat,
              periodDays: isSummaryFormat ? 30 : periodDays,
              extrapolationFactor: isSummaryFormat ? '1.0' : extrapolationFactor.toFixed(1)
            });
          } catch (err) {
            console.error('Excel parse error:', err);
            alert('Erro ao ler o arquivo Excel: ' + err.message);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        // CSV parsing (original Papa Parse)
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          encoding: 'UTF-8',
          complete: (results) => {
            if (results.data?.length > 0) {
              const cols = Object.keys(results.data[0]);
              const findCol = (patterns) => cols.find(c => patterns.some(p => c.toLowerCase().includes(p)));
              const colTitulo = findCol(['titulo', 't\u00edtulo', 'nome', 'product', 'anuncio', 'an\u00fancio', 'item']);
              const colPreco = findCol(['preco', 'pre\u00e7o', 'price', 'valor']);
              const colVendas = findCol(['vendas', 'venda', 'sold', 'units', 'unidades', 'quantidade', 'qtd']);
              const colVendedor = findCol(['vendedor', 'seller', 'loja', 'store']);
              const colLink = findCol(['link', 'url', 'permalink']);
              const parsed = results.data.filter(row => row[colTitulo]).map(row => ({
                produto: row[colTitulo]?.trim().substring(0, 150) || '',
                fornecedor: row[colVendedor]?.trim() || '',
                preco_venda: parseFloat(String(row[colPreco] || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
                media_vendas_mes: parseInt(String(row[colVendas] || '0').replace(/[^\d]/g, '')) || 0,
                link_referencia: row[colLink]?.trim() || '',
                plataforma: 'Mercado Livre'
              })).filter(r => r.produto && r.media_vendas_mes > 0);
              const grupoMatchCsv = file.name.match(/^Grupo de an[uú]ncios\s*-\s*(.+?)\s*-\s*(?:Evolu|[\d]{4})/i);
              const grupoNameCsv = grupoMatchCsv ? grupoMatchCsv[1].trim().toUpperCase() : file.name.replace(/\.[^.]+$/, '').toUpperCase();
              setCsvPreview({ data: parsed, fileName: file.name, grupo: grupoNameCsv, colMap: { colTitulo, colPreco, colVendas, colVendedor, colLink }, totalRows: results.data.length });
            }
          },
          error: (err) => { console.error('CSV parse error:', err); alert('Erro ao ler o arquivo CSV'); }
        });
      }
      e.target.value = '';
    };

    const handleImportCsv = async () => {
      if (!csvPreview?.data?.length) return;
      setImporting(true);
      const rows = csvPreview.data.map(r => ({
        produto: r.produto,
        fornecedor: r.fornecedor,
        preco_venda: r.preco_venda,
        media_vendas_mes: r.media_vendas_mes,
        link_referencia: r.link_referencia || '',
        plataforma: r.plataforma || 'Mercado Livre',
        preco_ideal_pagar: Number(calcPrecoIdeal(r.preco_venda, 'Mercado Livre')) || null,
        visitas: r.visitas || 0,
        conversao: r.conversao || 0,
        faturamento_30d: r.faturamento_30d || 0,
        share_mercado: r.share_mercado || 0,
        grupo: csvPreview.grupo || '',
        status: 'mapeado',
        user_id: user.id,
        updated_at: new Date().toISOString()
      }));
      try {
        const batchSize = 50;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          const { data } = await supabase.from('oportunidades').insert(batch).select();
          if (data) setItems(prev => [...data, ...prev]);
        }
      } catch (err) { console.error('Import error:', err); }
      setCsvPreview(null);
      setImporting(false);
    };

    const filtered = items.filter(item => {
      const matchSearch = !searchTerm || item.produto?.toLowerCase().includes(searchTerm.toLowerCase()) || item.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPlat = activeSubTab === 'todos' || (activeSubTab === 'ml' && item.plataforma === 'Mercado Livre') || (activeSubTab === 'shopee' && item.plataforma === 'Shopee') || (activeSubTab === 'amazon' && item.plataforma === 'Amazon');
      const matchStatus = filterStatus === 'todos' || item.status === filterStatus;
      const matchGrupo = filterGrupo === 'todos' || normalizeAccents((item.grupo || '').toUpperCase()) === normalizeAccents(filterGrupo.toUpperCase());
      return matchSearch && matchPlat && matchStatus && matchGrupo;
    });

    const grupoItems = filterGrupo === 'todos' ? items : items.filter(i => normalizeAccents((i.grupo || '').toUpperCase()) === normalizeAccents(filterGrupo.toUpperCase()));
    const stats = {
      total: grupoItems.length,
      ml: grupoItems.filter(i => i.plataforma === 'Mercado Livre').length,
      shopee: grupoItems.filter(i => i.plataforma === 'Shopee').length,
      amazon: grupoItems.filter(i => i.plataforma === 'Amazon').length,
      potencial_mensal: grupoItems.reduce((sum, i) => sum + ((i.preco_venda || 0) * (i.media_vendas_mes || 0)), 0)
    };

    const calcMargem = (item) => {
      if (!item.preco_venda || !item.preco_ideal_pagar) return null;
      return ((item.preco_venda - item.preco_ideal_pagar) / item.preco_venda * 100).toFixed(1);
    };

    const calcFaturamento = (item) => {
      if (!item.preco_venda || !item.media_vendas_mes) return null;
      return (item.preco_venda * item.media_vendas_mes).toFixed(2);
    };

    // Report: aggregate by product across marketplaces
    const generateReport = () => {
      const byProduct = {};
      items.forEach(item => {
        const key = item.produto?.toLowerCase().trim();
        if (!key) return;
        if (!byProduct[key]) byProduct[key] = { produto: item.produto, entries: [], fornecedor: item.fornecedor };
        byProduct[key].entries.push(item);
        if (item.fornecedor && !byProduct[key].fornecedor) byProduct[key].fornecedor = item.fornecedor;
      });
      return Object.values(byProduct).map(group => {
        const entries = group.entries;
        const avgVendas = Math.round(entries.reduce((s, e) => s + (e.media_vendas_mes || 0), 0) / entries.length);
        const avgPreco = entries.reduce((s, e) => s + (e.preco_venda || 0), 0) / entries.length;
        const platformData = entries.map(e => ({ plataforma: e.plataforma, vendas: e.media_vendas_mes, preco: e.preco_venda }));
        const precoIdealByPlat = entries.map(e => ({ plat: e.plataforma, ideal: calcPrecoIdeal(e.preco_venda, e.plataforma) }));
        const avgIdeal = precoIdealByPlat.reduce((s, p) => s + (Number(p.ideal) || 0), 0) / precoIdealByPlat.length;
        return {
          produto: group.produto, fornecedor: group.fornecedor, plataformas: entries.length,
          platformData, avgVendas, avgPreco: avgPreco.toFixed(2), avgIdeal: avgIdeal.toFixed(2),
          fatMensal: (avgPreco * avgVendas).toFixed(2),
          margem: avgPreco > 0 ? ((avgPreco - avgIdeal) / avgPreco * 100).toFixed(1) : '0'
        };
      }).sort((a, b) => b.avgVendas - a.avgVendas);
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B1B8E]" /></div>;

    const subTabs = [
      { id: 'todos', label: 'Todos', count: stats.total },
      { id: 'ml', label: 'Mercado Livre', count: stats.ml, color: 'text-yellow-600' },
      { id: 'shopee', label: 'Shopee', count: stats.shopee, color: 'text-orange-600' },
      { id: 'amazon', label: 'Amazon', count: stats.amazon, color: 'text-blue-600' },
      { id: 'relatorio', label: 'Relatorio', icon: true }
    ];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Compass size={28} className="text-[#6B1B8E]" /> Oportunidades</h2>
            <p className="text-sm text-gray-500 mt-1">Mapeamento de novos produtos e oportunidades de mercado</p>
          </div>
          <div className="flex gap-2">
            {activeSubTab === 'ml' && (
              <label className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors shadow-lg cursor-pointer">
                <Upload size={18} /> Importar Nubimetrics
                <input type="file" accept=".csv,.txt,.xlsx,.xls" onChange={handleCsvUpload} className="hidden" />
              </label>
            )}
            <button onClick={() => { setEditingItem(null); setFormData({ ...emptyForm, plataforma: activeSubTab === 'ml' ? 'Mercado Livre' : activeSubTab === 'shopee' ? 'Shopee' : activeSubTab === 'amazon' ? 'Amazon' : '' }); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-[#6B1B8E] text-white rounded-xl hover:bg-[#5a1578] transition-colors shadow-lg">
              <Plus size={18} /> Nova Oportunidade
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="bg-white rounded-xl shadow-sm border p-1 flex gap-1">
          {subTabs.map(tab => (
            <button key={tab.id} onClick={() => { setActiveSubTab(tab.id); if (tab.id === 'relatorio') setShowReport(true); else setShowReport(false); }}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeSubTab === tab.id ? 'bg-[#6B1B8E] text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>
              {tab.icon && <BarChart3 size={14} className="inline mr-1" />}
              {tab.label}
              {tab.count !== undefined && <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${activeSubTab === tab.id ? 'bg-white/20' : 'bg-gray-200'}`}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <p className="text-xs text-gray-500 uppercase tracking-wide">ML</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.ml}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Shopee</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.shopee}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Amazon</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.amazon}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Potencial Mensal Total</p>
            <p className="text-2xl font-bold text-[#6B1B8E] mt-1">R$ {stats.potencial_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Report View */}
        {showReport ? (() => {
          const rItems = reportGrupo ? items.filter(i => normalizeAccents((i.grupo || '').toUpperCase()) === normalizeAccents(reportGrupo.toUpperCase())) : items;
          const SHARE_PCT = 0.15;
          const COVER_DAYS = 60;
          const COVER_MONTHS = COVER_DAYS / 30;

          // Group by marketplace
          const byPlat = {};
          rItems.forEach(item => {
            const plat = item.plataforma || 'Outro';
            if (!byPlat[plat]) byPlat[plat] = [];
            byPlat[plat].push(item);
          });
          const mktStats = Object.entries(byPlat).map(([plat, sellers]) => {
            const totalVendas = sellers.reduce((s, i) => s + (i.media_vendas_mes || 0), 0);
            const totalFat = sellers.reduce((s, i) => s + ((i.preco_venda || 0) * (i.media_vendas_mes || 0)), 0);
            const avgPreco = totalVendas > 0 ? totalFat / totalVendas : 0;
            const precoIdeal = Number(calcPrecoIdeal(avgPreco, plat)) || 0;
            const myShare = Math.round(totalVendas * SHARE_PCT);
            const myBuy = Math.round(myShare * COVER_MONTHS);
            return { plataforma: plat, sellers: sellers.length, totalVendas, totalFat, avgPreco, precoIdeal, myShare, myBuy };
          }).sort((a, b) => b.totalVendas - a.totalVendas);

          const totalMercado = mktStats.reduce((s, m) => s + m.totalVendas, 0);
          const totalFatMercado = mktStats.reduce((s, m) => s + m.totalFat, 0);
          const myShareTotal = Math.round(totalMercado * SHARE_PCT);
          const myBuyTotal = Math.round(myShareTotal * COVER_MONTHS);
          const avgPrecoGeral = totalMercado > 0 ? totalFatMercado / totalMercado : 0;
          const weightedIdeal = myShareTotal > 0 ? mktStats.reduce((s, m) => s + m.precoIdeal * m.myShare, 0) / myShareTotal : 0;
          const investimento = myBuyTotal * weightedIdeal;

          return (
            <div className="space-y-4">
              {/* Group selector */}
              <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-wrap items-center gap-4">
                <label className="text-sm font-semibold text-gray-700">Produto:</label>
                <select value={reportGrupo} onChange={e => setReportGrupo(e.target.value)} className="flex-1 min-w-[250px] px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#6B1B8E] font-medium">
                  <option value="">Todos os Produtos</option>
                  {grupos.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <div className="text-xs text-gray-400">Marketshare: {(SHARE_PCT * 100).toFixed(0)}% | Cobertura: {COVER_DAYS} dias</div>
              </div>

              {rItems.length === 0 ? (
                <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
                  <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600">Nenhum dado para gerar relatorio</h3>
                  <p className="text-sm text-gray-400 mt-1">Importe dados do Nubimetrics ou adicione oportunidades manualmente</p>
                </div>
              ) : (
                <>
                  {/* Consolidated Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-white rounded-xl p-4 shadow-sm border">
                      <p className="text-xs text-gray-500 uppercase">Mercado Total</p>
                      <p className="text-xl font-bold text-gray-800 mt-1">{totalMercado.toLocaleString('pt-BR')} un/mes</p>
                      <p className="text-xs text-gray-400">R$ {totalFatMercado.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mes</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200 bg-purple-50">
                      <p className="text-xs text-purple-600 uppercase font-semibold">Minha Meta ({(SHARE_PCT * 100).toFixed(0)}%)</p>
                      <p className="text-xl font-bold text-[#6B1B8E] mt-1">{myShareTotal.toLocaleString('pt-BR')} un/mes</p>
                      <p className="text-xs text-purple-500">Fat. est. R$ {(myShareTotal * avgPrecoGeral).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mes</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-200">
                      <p className="text-xs text-yellow-700 uppercase font-semibold">Comprar ({COVER_DAYS}d)</p>
                      <p className="text-xl font-bold text-yellow-800 mt-1">{myBuyTotal.toLocaleString('pt-BR')} unidades</p>
                      <p className="text-xs text-yellow-600">{COVER_MONTHS} meses de estoque</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-200">
                      <p className="text-xs text-green-700 uppercase font-semibold">Preco Ideal Pagar</p>
                      <p className="text-xl font-bold text-green-800 mt-1">R$ {weightedIdeal.toFixed(2)}</p>
                      <p className="text-xs text-green-600">Media ponderada por marketplace</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-200">
                      <p className="text-xs text-blue-700 uppercase font-semibold">Investimento Total</p>
                      <p className="text-xl font-bold text-blue-800 mt-1">R$ {investimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-blue-600">{myBuyTotal} un x R$ {weightedIdeal.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Per-marketplace breakdown */}
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 size={20} className="text-[#6B1B8E]" /> Breakdown por Marketplace</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="text-left px-4 py-3 font-semibold text-gray-600">Marketplace</th>
                            <th className="text-right px-4 py-3 font-semibold text-gray-600">Vendedores</th>
                            <th className="text-right px-4 py-3 font-semibold text-gray-600">Vendas Mercado</th>
                            <th className="text-right px-4 py-3 font-semibold text-gray-600">Preco Medio</th>
                            <th className="text-right px-4 py-3 font-semibold text-gray-600">Fat. Mercado</th>
                            <th className="text-right px-4 py-3 font-semibold text-purple-700 bg-purple-50">Minha Meta (15%)</th>
                            <th className="text-right px-4 py-3 font-semibold text-yellow-700 bg-yellow-50">Comprar (60d)</th>
                            <th className="text-right px-4 py-3 font-semibold text-green-700 bg-green-50">Preco Ideal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mktStats.map((m, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${m.plataforma === 'Mercado Livre' ? 'bg-yellow-100 text-yellow-700' : m.plataforma === 'Shopee' ? 'bg-orange-100 text-orange-700' : m.plataforma === 'Amazon' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{m.plataforma}</span></td>
                              <td className="px-4 py-3 text-right">{m.sellers}</td>
                              <td className="px-4 py-3 text-right font-medium">{m.totalVendas.toLocaleString('pt-BR')} un/mes</td>
                              <td className="px-4 py-3 text-right">R$ {m.avgPreco.toFixed(2)}</td>
                              <td className="px-4 py-3 text-right text-gray-600">R$ {m.totalFat.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                              <td className="px-4 py-3 text-right font-bold text-purple-700 bg-purple-50">{m.myShare.toLocaleString('pt-BR')} un/mes</td>
                              <td className="px-4 py-3 text-right font-bold text-yellow-700 bg-yellow-50">{m.myBuy.toLocaleString('pt-BR')} un</td>
                              <td className="px-4 py-3 text-right font-bold text-green-700 bg-green-50">R$ {m.precoIdeal.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-100 font-bold">
                            <td className="px-4 py-3">TOTAL</td>
                            <td className="px-4 py-3 text-right">{rItems.length}</td>
                            <td className="px-4 py-3 text-right">{totalMercado.toLocaleString('pt-BR')} un/mes</td>
                            <td className="px-4 py-3 text-right">R$ {avgPrecoGeral.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right">R$ {totalFatMercado.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                            <td className="px-4 py-3 text-right text-purple-700 bg-purple-50">{myShareTotal.toLocaleString('pt-BR')} un/mes</td>
                            <td className="px-4 py-3 text-right text-yellow-700 bg-yellow-50">{myBuyTotal.toLocaleString('pt-BR')} un</td>
                            <td className="px-4 py-3 text-right text-green-700 bg-green-50">R$ {weightedIdeal.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Seller details */}
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Detalhamento por Vendedor ({rItems.length} concorrentes)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="text-left px-3 py-2 font-semibold text-gray-600">Vendedor</th>
                            <th className="text-left px-3 py-2 font-semibold text-gray-600">Marketplace</th>
                            <th className="text-right px-3 py-2 font-semibold text-gray-600">Vendas/Mes</th>
                            <th className="text-right px-3 py-2 font-semibold text-gray-600">Preco</th>
                            <th className="text-right px-3 py-2 font-semibold text-gray-600">Fat. 30d</th>
                            <th className="text-right px-3 py-2 font-semibold text-gray-600">Visitas</th>
                            <th className="text-right px-3 py-2 font-semibold text-gray-600">Conv.%</th>
                            <th className="text-right px-3 py-2 font-semibold text-gray-600">Share%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rItems.sort((a, b) => (b.media_vendas_mes || 0) - (a.media_vendas_mes || 0)).map((item, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-700 max-w-[180px] truncate">{item.fornecedor || item.produto}</td>
                              <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded text-xs font-medium ${item.plataforma === 'Mercado Livre' ? 'bg-yellow-100 text-yellow-700' : item.plataforma === 'Shopee' ? 'bg-orange-100 text-orange-700' : item.plataforma === 'Amazon' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{item.plataforma === 'Mercado Livre' ? 'ML' : item.plataforma}</span></td>
                              <td className="px-3 py-2 text-right font-medium">{item.media_vendas_mes || 0}</td>
                              <td className="px-3 py-2 text-right">R$ {Number(item.preco_venda || 0).toFixed(2)}</td>
                              <td className="px-3 py-2 text-right text-gray-600">{item.faturamento_30d ? `R$ ${Number(item.faturamento_30d).toLocaleString('pt-BR')}` : '-'}</td>
                              <td className="px-3 py-2 text-right text-gray-600">{item.visitas ? Number(item.visitas).toLocaleString('pt-BR') : '-'}</td>
                              <td className="px-3 py-2 text-right text-gray-600">{item.conversao ? `${Number(item.conversao).toFixed(1)}%` : '-'}</td>
                              <td className="px-3 py-2 text-right text-gray-600">{item.share_mercado ? `${Number(item.share_mercado).toFixed(1)}%` : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })() : (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Buscar produto ou fornecedor..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#6B1B8E] focus:border-transparent" />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#6B1B8E]">
                <option value="todos">Todos Status</option>
                {statusOpts.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {grupos.length > 0 && (
                <select value={filterGrupo} onChange={e => setFilterGrupo(e.target.value)} className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#6B1B8E]">
                  <option value="todos">Todos Grupos</option>
                  {grupos.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              )}
            </div>

            {/* ML Upload hint */}
            {activeSubTab === 'ml' && filtered.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <Upload size={40} className="mx-auto text-yellow-500 mb-3" />
                <h3 className="text-lg font-semibold text-yellow-800">Importar dados do Nubimetrics</h3>
                <p className="text-sm text-yellow-600 mt-1 mb-4">Exporte o historico de vendas dos concorrentes do Nubimetrics (.xlsx ou .csv) e importe aqui.<br/>O sistema detecta automaticamente as colunas e extrapola vendas diarias para media mensal (30 dias).</p>
                <label className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors cursor-pointer font-medium">
                  <Upload size={18} /> Selecionar arquivo Excel/CSV
                  <input type="file" accept=".csv,.txt,.xlsx,.xls" onChange={handleCsvUpload} className="hidden" />
                </label>
              </div>
            )}

            {/* Table */}
            {filtered.length === 0 && activeSubTab !== 'ml' ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
                <Compass size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Nenhuma oportunidade em {activeSubTab === 'shopee' ? 'Shopee' : activeSubTab === 'amazon' ? 'Amazon' : 'nenhuma plataforma'}</h3>
                <p className="text-sm text-gray-400 mt-1">Clique em "Nova Oportunidade" para adicionar manualmente</p>
              </div>
            ) : filtered.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Produto</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Fornecedor</th>
                        {activeSubTab === 'todos' && <th className="text-left px-4 py-3 font-semibold text-gray-600">Plataforma</th>}
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Preco Venda</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Vendas/Mes</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Fat. 30d</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Visitas</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Conv.%</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Share%</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Preco Ideal</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Margem</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(item => {
                        const margem = calcMargem(item);
                        const fat = calcFaturamento(item);
                        return (
                          <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-800 max-w-[250px] truncate" title={item.produto}>{item.produto}</td>
                            <td className="px-4 py-3 text-gray-600">{item.fornecedor || '-'}</td>
                            {activeSubTab === 'todos' && <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${item.plataforma === 'Mercado Livre' ? 'bg-yellow-100 text-yellow-700' : item.plataforma === 'Shopee' ? 'bg-orange-100 text-orange-700' : item.plataforma === 'Amazon' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{item.plataforma || '-'}</span></td>}
                            <td className="px-4 py-3 text-right font-medium">{item.preco_venda ? `R$ ${Number(item.preco_venda).toFixed(2)}` : '-'}</td>
                            <td className="px-4 py-3 text-right">{item.media_vendas_mes || '-'}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{item.faturamento_30d ? `R$ ${Number(item.faturamento_30d).toLocaleString('pt-BR')}` : '-'}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{item.visitas ? Number(item.visitas).toLocaleString('pt-BR') : '-'}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{item.conversao ? `${Number(item.conversao).toFixed(1)}%` : '-'}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{item.share_mercado ? `${Number(item.share_mercado).toFixed(1)}%` : '-'}</td>
                            <td className="px-4 py-3 text-right font-medium">{item.preco_ideal_pagar ? `R$ ${Number(item.preco_ideal_pagar).toFixed(2)}` : '-'}</td>
                            <td className={`px-4 py-3 text-right font-bold ${margem && Number(margem) >= 40 ? 'text-green-600' : margem && Number(margem) >= 25 ? 'text-yellow-600' : margem ? 'text-red-600' : 'text-gray-400'}`}>{margem ? `${margem}%` : '-'}</td>
                            <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(item.status)}`}>{getStatusLabel(item.status)}</span></td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-blue-600 transition-colors" title="Editar"><Edit2 size={14} /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors" title="Remover"><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* CSV Preview Modal */}
        {csvPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Preview Importacao Nubimetrics</h3>
                    <p className="text-sm text-gray-500">{csvPreview.fileName} - {csvPreview.data.length} vendedores encontrados (de {csvPreview.totalRows} linhas)</p>
                    {csvPreview.grupo && <p className="text-xs text-purple-600 font-medium mt-1">Grupo: {csvPreview.grupo}</p>}
                  </div>
                  <button onClick={() => setCsvPreview(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                {csvPreview.isSummary ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 mb-3">
                    <strong>Formato resumo (30 dias):</strong> Dados ja consolidados por vendedor. Inclui visitas, conversao e share de mercado.
                  </div>
                ) : csvPreview.periodDays && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 mb-3">
                    <strong>Periodo detectado:</strong> {csvPreview.periodDays} dias de dados. Vendas extrapoladas para 30 dias (x{csvPreview.extrapolationFactor}).
                  </div>
                )}
                <div className="overflow-x-auto max-h-[400px] border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr className="border-b">
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">Produto</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">Vendedor</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-600">Preco</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-600">Vendas/Mes</th>
                        {csvPreview.isSummary && <th className="text-right px-3 py-2 font-semibold text-gray-600">Fat. R$</th>}
                        {csvPreview.isSummary && <th className="text-right px-3 py-2 font-semibold text-gray-600">Visitas</th>}
                        {csvPreview.isSummary && <th className="text-right px-3 py-2 font-semibold text-gray-600">Conv.%</th>}
                        {csvPreview.isSummary && <th className="text-right px-3 py-2 font-semibold text-gray-600">Share%</th>}
                        <th className="text-right px-3 py-2 font-semibold text-gray-600">Preco Ideal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.data.slice(0, 50).map((row, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2 max-w-[200px] truncate" title={row.produto}>{row.produto}</td>
                          <td className="px-3 py-2 text-gray-600 max-w-[150px] truncate">{row.fornecedor || '-'}</td>
                          <td className="px-3 py-2 text-right">R$ {row.preco_venda.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-medium">{row.media_vendas_mes}</td>
                          {csvPreview.isSummary && <td className="px-3 py-2 text-right text-gray-600">R$ {row.faturamento_30d?.toLocaleString('pt-BR')}</td>}
                          {csvPreview.isSummary && <td className="px-3 py-2 text-right text-gray-600">{row.visitas?.toLocaleString('pt-BR')}</td>}
                          {csvPreview.isSummary && <td className="px-3 py-2 text-right text-gray-600">{row.conversao?.toFixed(1)}%</td>}
                          {csvPreview.isSummary && <td className="px-3 py-2 text-right text-gray-600">{row.share_mercado?.toFixed(1)}%</td>}
                          <td className="px-3 py-2 text-right text-green-700 font-medium">R$ {calcPrecoIdeal(row.preco_venda, 'Mercado Livre')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvPreview.data.length > 50 && <p className="text-center text-gray-400 text-sm py-2">... e mais {csvPreview.data.length - 50} produtos</p>}
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setCsvPreview(null)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">Cancelar</button>
                  <button onClick={handleImportCsv} disabled={importing} className="flex-1 px-4 py-2.5 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 disabled:opacity-50 font-medium">
                    {importing ? 'Importando...' : `Importar ${csvPreview.data.length} produtos`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-800">{editingItem ? 'Editar Oportunidade' : 'Nova Oportunidade'}</h3>
                  <button onClick={() => { setShowForm(false); setEditingItem(null); setFormData({ ...emptyForm }); }} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Produto *</label>
                    <input type="text" value={formData.produto} onChange={e => setFormData({ ...formData, produto: e.target.value })} placeholder="Ex: Kit 6 Tacas Cristal" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#6B1B8E] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Fornecedor</label>
                    <input type="text" value={formData.fornecedor} onChange={e => setFormData({ ...formData, fornecedor: e.target.value })} placeholder="Ex: Importadora XYZ" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#6B1B8E] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Plataforma</label>
                    <select value={formData.plataforma} onChange={e => setFormData({ ...formData, plataforma: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#6B1B8E]">
                      <option value="">Selecionar...</option>
                      {plataformas.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Preco de Venda (R$)</label>
                      <input type="number" step="0.01" value={formData.preco_venda} onChange={e => setFormData({ ...formData, preco_venda: e.target.value })} placeholder="0.00" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#6B1B8E] focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Media Vendas/Mes</label>
                      <input type="number" value={formData.media_vendas_mes} onChange={e => setFormData({ ...formData, media_vendas_mes: e.target.value })} placeholder="0" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#6B1B8E] focus:border-transparent" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Faturamento 30d (R$)</label>
                      <input type="number" step="0.01" value={formData.faturamento_30d} onChange={e => setFormData({ ...formData, faturamento_30d: e.target.value })} placeholder="0.00" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#6B1B8E] focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Visitas</label>
                      <input type="number" value={formData.visitas} onChange={e => setFormData({ ...formData, visitas: e.target.value })} placeholder="0" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#6B1B8E] focus:border-transparent" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Conversao (%)</label>
                      <input type="number" step="0.1" value={formData.conversao} onChange={e => setFormData({ ...formData, conversao: e.target.value })} placeholder="0.0" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#6B1B8E] focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Share Mercado (%)</label>
                      <input type="number" step="0.1" value={formData.share_mercado} onChange={e => setFormData({ ...formData, share_mercado: e.target.value })} placeholder="0.0" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#6B1B8E] focus:border-transparent" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Preco Ideal a Pagar (R$)</label>
                    <div className="flex gap-2 items-center">
                      <input type="number" step="0.01" value={formData.preco_ideal_pagar} onChange={e => setFormData({ ...formData, preco_ideal_pagar: e.target.value })} placeholder="0.00" className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#6B1B8E] focus:border-transparent" />
                      {formData.preco_venda && formData.plataforma && (
                        <button type="button" onClick={() => setFormData({ ...formData, preco_ideal_pagar: calcPrecoIdeal(Number(formData.preco_venda), formData.plataforma) })} className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 whitespace-nowrap" title="Calcula automaticamente com margem 30%">Auto</button>
                      )}
                    </div>
                    {formData.preco_venda && formData.preco_ideal_pagar && (
                      <p className={`text-xs mt-1 font-medium ${((formData.preco_venda - formData.preco_ideal_pagar) / formData.preco_venda * 100) >= 40 ? 'text-green-600' : ((formData.preco_venda - formData.preco_ideal_pagar) / formData.preco_venda * 100) >= 25 ? 'text-yellow-600' : 'text-red-600'}`}>
                        Margem estimada: {((formData.preco_venda - formData.preco_ideal_pagar) / formData.preco_venda * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Link de Referencia</label>
                    <input type="url" value={formData.link_referencia} onChange={e => setFormData({ ...formData, link_referencia: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#6B1B8E] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#6B1B8E]">
                      {statusOpts.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Observacoes</label>
                    <textarea value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} rows={3} placeholder="Notas sobre o produto, concorrencia, diferenciais..." className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#6B1B8E] focus:border-transparent" />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => { setShowForm(false); setEditingItem(null); setFormData({ ...emptyForm }); }} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
                  <button onClick={handleSave} disabled={!formData.produto} className="flex-1 px-4 py-2.5 bg-[#6B1B8E] text-white rounded-xl hover:bg-[#5a1578] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Salvar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Route renderer
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'academy': return <AcademyView />;
      case 'recebimento': return <RecebimentoView />;
      case 'aguamarinha': return <AguaMarinhaView />;
      case 'vendedor': return <VendedorView />;
      case 'analytics': return <AnalyticsView />;
      case 'times': return <TimesView />;
      case 'pedidos': return <PedidoFornecedorView />;
      case 'marketing': return <MarketingView />;
      case 'gestao_anuncios': return <GestaoAnunciosView />;
      case 'oportunidades': return <OportunidadesView />;
      case 'fulfillment': return <FulfillmentView />;
      case 'precificacao': return <PrecificacaoView />;
      case 'analisevendas': return <AnaliseVendasView />;
      case 'admin': return <AdminPanel />;
      default: return <DashboardView />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#6B1B8E] rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse">
            <Package className="text-[#F4B942] w-8 h-8" />
          </div>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  // Check profile approval status
  if (profile) {
    // Usuarios sem permissao veem mensagem simples
    if (profile.role !== 'admin' && profile.role !== 'approved') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
            <Package className="w-12 h-12 text-[#6B1B8E] mx-auto" />
            <h2 className="text-xl font-bold text-gray-800">Acesso em configuracao</h2>
            <p className="text-gray-600 text-sm">Suas permissoes estao sendo configuradas pelo administrador.</p>
            <button onClick={async () => { await supabase.auth.signOut(); setUser(null); }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg transition-colors">
              Sair
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-[#F4B942] selection:text-[#6B1B8E]">
      <Sidebar />

      <main className={`transition-all duration-300 ${isSidebarOpen ? 'pl-64' : 'pl-20'}`}>
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-800 capitalize">{activeTab.replace('aguamarinha', 'Agua Marinha').replace('gestao_anuncios', 'Gestao de Produtos Parados').replace('oportunidades', 'Oportunidades').replace('analisevendas', 'Analise de Vendas')}</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
              <Search size={18} className="text-gray-400" />
              <input type="text" placeholder="Buscar no portal..." className="bg-transparent outline-none text-sm w-40" />
            </div>

            <div className="flex items-center gap-3 border-l pl-6 border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800">{profile?.full_name || user.email?.split('@')[0] || 'Usuario'}</p>
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                  {profile?.role === 'admin' ? 'ADMIN' : 'USER'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6B1B8E] to-[#F4B942] p-0.5 shadow-md">
                <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center font-black text-[#6B1B8E]">
                  {(profile?.full_name || user.email)?.charAt(0).toUpperCase() || 'A'}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1400px] mx-auto">
          {renderContent()}
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
