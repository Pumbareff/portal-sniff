import React, { useState, useEffect, useMemo } from 'react';
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
  RefreshCw
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

// Cores Oficiais
const COLORS = {
  purple: '#6B1B8E',
  gold: '#F4B942',
  lightPurple: '#F3E8FF',
  darkPurple: '#4A1063'
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

  // Check auth on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
        const response = await fetch('/api/create-user', {
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
        pedidos: false
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
        precificacao: formData.get('precificacao') === 'on',
        dashboard_am: formData.get('dashboard_am') === 'on',
        defesa: formData.get('defesa') === 'on',
        checklist: formData.get('checklist') === 'on',
        preco: formData.get('preco') === 'on',
        tracker: formData.get('tracker') === 'on',
        sobre_am: formData.get('sobre_am') === 'on'
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
                    {['dashboard', 'academy', 'recebimento', 'precificacao', 'agua_marinha', 'vendedor', 'times', 'sku', 'pedidos'].map(perm => (
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
    const baseNavItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
      { id: 'academy', label: 'Sniff Academy', icon: GraduationCap, permission: 'academy' },
      { id: 'recebimento', label: 'Recebimento', icon: Package, permission: 'recebimento' },
      { id: 'aguamarinha', label: 'Agua Marinha', icon: Droplets, permission: 'agua_marinha' },
      { id: 'vendedor', label: 'Area Vendedor', icon: ClipboardList, permission: 'vendedor' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, permission: 'analytics' },
      { id: 'times', label: 'Gestao de Times', icon: Users, permission: 'times' },
      { id: 'pedidos', label: 'Pedidos Fornecedor', icon: Truck, permission: 'pedidos' },
      { id: 'precificacao', label: 'Precificacao', icon: DollarSign, permission: 'precificacao' },
    ];

    // Add admin panel if user is admin
    if (profile?.role === 'admin') {
      baseNavItems.push({ id: 'admin', label: 'Admin', icon: ShieldCheck, permission: 'admin' });
    }

    // Filter nav items based on permissions
    const navItems = profile?.role === 'admin'
      ? baseNavItems
      : baseNavItems.filter(item => {
          if (item.id === 'admin') return false;
          return profile?.permissions?.[item.permission] === true;
        });

    return (
      <aside className={`fixed left-0 top-0 h-full bg-[#6B1B8E] text-white transition-all duration-300 z-50 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="min-w-[40px] h-10 bg-[#F4B942] rounded-lg flex items-center justify-center font-bold text-[#6B1B8E]">S</div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight">SNIFF</span>}
        </div>

        <nav className="mt-6 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                activeTab === item.id
                ? 'bg-[#F4B942] text-[#6B1B8E] shadow-lg'
                : 'hover:bg-[#4A1063] text-purple-100'
              }`}
            >
              <item.icon size={22} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 w-full px-3">
          <button
            onClick={async () => { await supabase.auth.signOut(); setUser(null); }}
            className="w-full flex items-center gap-4 p-3 text-purple-300 hover:text-white hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut size={22} />
            {isSidebarOpen && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </aside>
    );
  };

  // 1. Dashboard Module
  const DashboardView = () => {
    const [comForm, setComForm] = useState({ title: '', message: '', priority: 'info' });
    const [dataForm, setDataForm] = useState({ title: '', description: '', date: '', category: 'evento' });

    const handleAddComunicado = async () => {
      if (!comForm.title || !comForm.message) return;
      const { data } = await supabase.from('comunicados').insert([{ ...comForm, author: profile?.full_name || 'Admin', user_id: user.id }]).select();
      if (data) { setComunicados(prev => [data[0], ...prev]); setShowComunicadoModal(false); setComForm({ title: '', message: '', priority: 'info' }); }
    };

    const handleAddData = async () => {
      if (!dataForm.title || !dataForm.date) return;
      const { data } = await supabase.from('datas_importantes').insert([{ ...dataForm, user_id: user.id }]).select();
      if (data) { setDatasImportantes(prev => [...prev, data[0]].sort((a,b) => new Date(a.date) - new Date(b.date))); setShowDataModal(false); setDataForm({ title: '', description: '', date: '', category: 'evento' }); }
    };

    const daysUntil = (dateStr) => { const d = Math.ceil((new Date(dateStr) - new Date()) / 86400000); return d; };
    const priorityStyles = { urgente: 'bg-red-100 text-red-700 border-red-200', importante: 'bg-yellow-100 text-yellow-700 border-yellow-200', info: 'bg-gray-100 text-gray-600 border-gray-200' };
    const catStyles = { feriado: 'bg-red-100 text-red-700', meta: 'bg-purple-100 text-purple-700', evento: 'bg-blue-100 text-blue-700', deadline: 'bg-orange-100 text-orange-700' };

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Vendas Total', value: 'R$ 1.242.000', icon: DollarSign, color: 'text-green-600', trend: '+12%' },
            { label: 'Meta Mensal', value: '85%', icon: Target, color: 'text-blue-600', trend: '+5%' },
            { label: 'Novos Pedidos', value: '1,420', icon: Package, color: 'text-purple-600', trend: '+18%' },
            { label: 'SLA Entrega', value: '98.2%', icon: CheckCircle2, color: 'text-orange-600', trend: '+0.5%' },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl bg-gray-50 ${kpi.color}`}><kpi.icon size={24} /></div>
                <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">{kpi.trend}</span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 font-medium">{kpi.label}</p>
                <h3 className="text-2xl font-bold text-gray-800">{kpi.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-6 text-gray-800">Performance de Vendas vs Meta</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs><linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6B1B8E" stopOpacity={0.1}/><stop offset="95%" stopColor="#6B1B8E" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="vendas" stroke="#6B1B8E" strokeWidth={3} fillOpacity={1} fill="url(#colorVendas)" />
                  <Line type="monotone" dataKey="meta" stroke="#F4B942" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-[#6B1B8E] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Award className="text-[#F4B942]" /> Reconhecimento</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#F4B942] border-4 border-purple-400 p-1"><div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#6B1B8E] font-bold text-xl">RP</div></div>
                  <div><p className="text-xs text-purple-200">Vendedor do Mes</p><p className="font-bold text-lg text-[#F4B942]">Ricardo Pereira</p><p className="text-xs text-purple-100">Regional Sul - R$ 450k</p></div>
                </div>
                <div className="h-px bg-purple-500/50" />
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 border-4 border-white/10 p-1"><div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#6B1B8E] font-bold text-xl">AM</div></div>
                  <div><p className="text-xs text-purple-200">Colaborador Destaque</p><p className="font-bold text-lg">Ana Martins</p><p className="text-xs text-purple-100">Logistica - Eficiencia 100%</p></div>
                </div>
              </div>
              <button className="mt-8 w-full bg-[#F4B942] text-[#6B1B8E] py-2 rounded-xl font-bold text-sm hover:brightness-110 transition-all">Ver Todos os Rankings</button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Comunicados + Datas Importantes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Comunicados */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Megaphone size={20} className="text-[#6B1B8E]" /> Comunicados</h3>
              <button onClick={() => setShowComunicadoModal(true)} className="flex items-center gap-1 bg-[#6B1B8E] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#4A1063] transition-colors"><Plus size={14} /> Novo</button>
            </div>
            {comunicados.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Nenhum comunicado ainda.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {comunicados.slice(0, 5).map(c => (
                  <div key={c.id} className={`p-3 rounded-xl border ${priorityStyles[c.priority] || priorityStyles.info}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${priorityStyles[c.priority]}`}>{c.priority}</span>
                          <h4 className="font-bold text-sm">{c.title}</h4>
                        </div>
                        <p className="text-xs mt-1 opacity-80">{c.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[10px] opacity-60">
                      <span>{c.author}</span>
                      <span>•</span>
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
              <button onClick={() => setShowDataModal(true)} className="flex items-center gap-1 bg-[#6B1B8E] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#4A1063] transition-colors"><Plus size={14} /> Adicionar</button>
            </div>
            {datasImportantes.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Nenhuma data cadastrada.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {datasImportantes.filter(d => daysUntil(d.date) >= 0).map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50">
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowComunicadoModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">Novo Comunicado</h3>
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
                <button onClick={() => setShowComunicadoModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50">Cancelar</button>
                <button onClick={handleAddComunicado} className="flex-1 py-2 bg-[#6B1B8E] text-white rounded-lg text-sm font-bold hover:bg-[#4A1063]">Publicar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Data Importante */}
        {showDataModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDataModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">Adicionar Data Importante</h3>
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
                <button onClick={() => setShowDataModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50">Cancelar</button>
                <button onClick={handleAddData} className="flex-1 py-2 bg-[#6B1B8E] text-white rounded-lg text-sm font-bold hover:bg-[#4A1063]">Salvar</button>
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
        const { error } = await supabase.from('recebimentos').update(payload).eq('id', editingId);
        if (!error) {
          setRecebimentos(prev => prev.map(r => r.id === editingId ? { ...r, ...payload } : r));
        }
      } else {
        const { data, error } = await supabase.from('recebimentos').insert([payload]).select();
        if (data) setRecebimentos(prev => [data[0], ...prev]);
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
                      <td className="px-6 py-3">{rec.data_recebimento ? new Date(rec.data_recebimento).toLocaleDateString('pt-BR') : (extra.data ? new Date(extra.data).toLocaleDateString('pt-BR') : new Date(rec.created_at).toLocaleDateString('pt-BR'))}</td>
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
          return (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="text-green-500" /> Defesa de Catalogo</h3>
                <button onClick={() => setShowDefesaModal(true)} className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700"><Flag size={14} /> Registrar Invasao</button>
              </div>
              {/* Status filter */}
              <div className="flex gap-2">
                {['todos', 'pendente', 'denunciado', 'resolvido'].map(f => (
                  <button key={f} onClick={() => setDefesaFilter(f)} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${defesaFilter === f ? 'bg-[#6B1B8E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
                ))}
              </div>
              {/* Table */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className="text-left p-3 text-xs font-bold text-gray-500">Data</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-500">Produto</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-500">Tipo</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-500">Invasor</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-500">Status</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-500">Acoes</th>
                  </tr></thead>
                  <tbody>
                    {amDefesa.filter(d => defesaFilter === 'todos' || d.status === defesaFilter).map(d => (
                      <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="p-3 text-xs text-gray-500">{new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="p-3 font-bold text-xs">{d.produto_nome}<br/><span className="text-gray-400 font-normal">{d.codigo_mlc}</span></td>
                        <td className="p-3 text-xs">{tipoLabels[d.tipo] || d.tipo}</td>
                        <td className="p-3 text-xs">{d.nome_invasor || '-'}</td>
                        <td className="p-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${defesaStatusColors[d.status]}`}>{d.status}</span></td>
                        <td className="p-3">
                          {d.status === 'pendente' && <button onClick={() => updateDefesaStatus(d.id, 'denunciado')} className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200">Denunciar</button>}
                          {d.status === 'denunciado' && <button onClick={() => updateDefesaStatus(d.id, 'resolvido')} className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">Resolver</button>}
                        </td>
                      </tr>
                    ))}
                    {amDefesa.filter(d => defesaFilter === 'todos' || d.status === defesaFilter).length === 0 && (
                      <tr><td colSpan={6} className="p-8 text-center text-gray-400 text-sm">Nenhuma invasao registrada.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Modal Defesa */}
              {showDefesaModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDefesaModal(false)}>
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold mb-4">Registrar Invasao</h3>
                    <div className="space-y-3">
                      <select value={defesaForm.produto_nome} onChange={e => setDefesaForm({...defesaForm, produto_nome: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                        <option value="">Selecione o produto</option>
                        {amProdutos.map(p => <option key={p.id} value={p.nome}>{p.nome} ({p.mlc})</option>)}
                      </select>
                      <input placeholder="Codigo MLC do anuncio invasor" value={defesaForm.codigo_mlc} onChange={e => setDefesaForm({...defesaForm, codigo_mlc: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                      <select value={defesaForm.tipo} onChange={e => setDefesaForm({...defesaForm, tipo: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                        <option value="vendedor_novo">Vendedor Novo</option>
                        <option value="titulo_alterado">Titulo Alterado</option>
                        <option value="marca_alterada">Marca Alterada</option>
                        <option value="info_alterada">Info Alterada</option>
                      </select>
                      <input placeholder="Nome do Invasor" value={defesaForm.nome_invasor} onChange={e => setDefesaForm({...defesaForm, nome_invasor: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                      <textarea placeholder="Descricao" rows={2} value={defesaForm.descricao} onChange={e => setDefesaForm({...defesaForm, descricao: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => setShowDefesaModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50">Cancelar</button>
                      <button onClick={handleAddDefesa} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700">Registrar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );

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
    const [showForm, setShowForm] = useState(false);
    const [activeFilter, setActiveFilter] = useState('todos');
    const [respondingTo, setRespondingTo] = useState(null);
    const [viewingDetail, setViewingDetail] = useState(null);
    const [dbReady, setDbReady] = useState(true);
    const emptyItem = { sku: '', produto: '', quantidade: '', preco_unitario: '', peso_unitario: '' };
    const [formData, setFormData] = useState({
      fornecedor: '', items: [{ ...emptyItem }],
      prazo_entrega: '', observacoes: ''
    });
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

    // Multi-item helpers
    const addItem = () => setFormData({ ...formData, items: [...formData.items, { ...emptyItem }] });
    const removeItem = (idx) => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== idx) });
    const updateItem = (idx, field, value) => {
      const newItems = [...formData.items];
      newItems[idx] = { ...newItems[idx], [field]: value };
      setFormData({ ...formData, items: newItems });
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

    const handleCreatePedido = async () => {
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
          return;
        }
      } catch (e) {
        console.error('DB error:', e);
        alert('Erro de conexao com banco de dados.');
        return;
      }
      setFormData({ fornecedor: '', items: [{ ...emptyItem }], prazo_entrega: '', observacoes: '' });
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
                        <button onClick={() => setViewingDetail(p)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100" title="Ver Detalhes"><Eye size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Order Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-bold text-gray-800">Nova Ordem de Compra</h3>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor *</label>
                  <input type="text" value={formData.fornecedor} onChange={e => setFormData({ ...formData, fornecedor: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200" placeholder="Nome do fornecedor" />
                </div>

                {/* Items (Multi-SKU) */}
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

                {/* Totals */}
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
                  <input type="date" value={formData.prazo_entrega} onChange={e => setFormData({ ...formData, prazo_entrega: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observacoes</label>
                  <textarea value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200" rows={2} placeholder="Observacoes adicionais..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancelar</button>
                <button onClick={handleCreatePedido} disabled={!formData.fornecedor || !formData.items[0]?.produto || !formData.items[0]?.quantidade} className="px-4 py-2 text-white rounded-xl disabled:opacity-50" style={{ backgroundColor: COLORS.purple }}>Criar Ordem</button>
              </div>
            </div>
          </div>
        )}

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

  // 7. Precificacao Calculator
  const PrecificacaoView = () => {
    const [custo, setCusto] = useState('');
    const [activeMarketplace, setActiveMarketplace] = useState('mercadolivre');

    // Default marketplace configurations
    const defaultConfigs = {
      mercadolivre: { nome: 'Mercado Livre', cor: '#FFE600', imposto: 11, comissao: 11.5, freteBaixo: 6.50, freteAlto: 20.00, limiarFrete: 79 },
      shopee: { nome: 'Shopee', cor: '#EE4D2D', imposto: 11, comissao: 14, freteBaixo: 5.00, freteAlto: 15.00, limiarFrete: 49 },
      amazon: { nome: 'Amazon', cor: '#FF9900', imposto: 11, comissao: 15, freteBaixo: 8.00, freteAlto: 22.00, limiarFrete: 99 },
      tiktok: { nome: 'TikTok Shop', cor: '#000000', imposto: 11, comissao: 8, freteBaixo: 5.00, freteAlto: 12.00, limiarFrete: 59 },
      temu: { nome: 'Temu', cor: '#F54B24', imposto: 11, comissao: 12, freteBaixo: 0, freteAlto: 0, limiarFrete: 0 },
    };

    // Load from localStorage or use defaults
    const [marketplaceConfigs, setMarketplaceConfigs] = useState(() => {
      const saved = localStorage.getItem('portal-sniff-marketplace-configs');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return defaultConfigs;
        }
      }
      return defaultConfigs;
    });

    // Save to localStorage whenever configs change
    useEffect(() => {
      localStorage.setItem('portal-sniff-marketplace-configs', JSON.stringify(marketplaceConfigs));
    }, [marketplaceConfigs]);

    const config = marketplaceConfigs[activeMarketplace];

    const updateConfig = (field, value) => {
      setMarketplaceConfigs(prev => ({
        ...prev,
        [activeMarketplace]: { ...prev[activeMarketplace], [field]: Number(value) }
      }));
    };

    const calcPreco = (mcAlvo) => {
      if (!custo || Number(custo) <= 0) return null;
      const c = Number(custo);
      const divisor = 1 - (config.imposto / 100) - (config.comissao / 100) - (mcAlvo / 100);
      if (divisor <= 0) return null;

      let pvBaixo = (c + config.freteBaixo) / divisor;
      let pvAlto = (c + config.freteAlto) / divisor;

      let pv, freteUsado;
      if (config.limiarFrete === 0 || pvBaixo >= config.limiarFrete) {
        pv = pvAlto;
        freteUsado = config.freteAlto;
      } else {
        pv = pvBaixo;
        freteUsado = config.freteBaixo;
      }

      const impostoVal = pv * (config.imposto / 100);
      const comissaoVal = pv * (config.comissao / 100);
      const mc = pv - impostoVal - comissaoVal - freteUsado - c;
      const mcPct = (mc / pv) * 100;

      return { pv, frete: freteUsado, impostoVal, comissaoVal, mc, mcPct };
    };

    const faixas = [
      { nome: 'Entrada', mcMin: 5, mcMax: 10, mcMid: 7.5, cor: 'blue', desc: 'Ganhar Buy Box, lancar produto' },
      { nome: 'Briga', mcMin: 10, mcMax: 15, mcMid: 12.5, cor: 'yellow', desc: 'Competir no dia a dia' },
      { nome: 'Estavel', mcMin: 20, mcMax: 30, mcMid: 25, cor: 'green', desc: 'Preco saudavel, boa margem' },
    ];

    const resultados = faixas.map(f => {
      const min = calcPreco(f.mcMin);
      const mid = calcPreco(f.mcMid);
      const max = calcPreco(f.mcMax);
      return { ...f, min, mid, max };
    });

    const fmt = (v) => v != null ? `R$ ${v.toFixed(2).replace('.', ',')}` : '-';
    const fmtPct = (v) => v != null ? `${v.toFixed(1)}%` : '-';

    const corMap = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800', gradient: 'from-blue-500 to-blue-600' },
      yellow: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', gradient: 'from-amber-500 to-amber-600' },
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800', gradient: 'from-green-500 to-green-600' },
    };

    return (
      <div className="space-y-6">
        {/* Header with Marketplace Tabs */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-black text-[#6B1B8E] mb-1">Calculadora de Precificacao</h2>
          <p className="text-sm text-gray-500 mb-4">Simples Nacional - Selecione o marketplace</p>

          {/* Marketplace Tabs */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(marketplaceConfigs).map(([key, mp]) => (
              <button
                key={key}
                onClick={() => setActiveMarketplace(key)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeMarketplace === key
                    ? 'text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={activeMarketplace === key ? { backgroundColor: mp.cor } : {}}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: mp.cor }}></span>
                {mp.nome}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Custo do Produto - destaque */}
          <div className="p-6 rounded-2xl shadow-sm text-white" style={{ background: `linear-gradient(135deg, ${config.cor}dd, ${config.cor}99)` }}>
            <label className="block text-xs uppercase font-bold tracking-wider opacity-80 mb-2">Custo do Produto (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={custo}
              onChange={e => setCusto(e.target.value)}
              placeholder="Ex: 20.00"
              className="w-full px-4 py-3 rounded-xl text-2xl font-black text-gray-800 bg-white outline-none focus:ring-2 focus:ring-white/50"
            />
            <p className="text-xs mt-2 opacity-80">Calculando para: <strong>{config.nome}</strong></p>
          </div>

          {/* Parametros editaveis do Marketplace */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Parametros {config.nome}</h3>
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: config.cor }}></span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Imposto %</label>
                <input type="number" step="0.1" value={config.imposto} onChange={e => updateConfig('imposto', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-200 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Comissao %</label>
                <input type="number" step="0.1" value={config.comissao} onChange={e => updateConfig('comissao', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-200 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Frete Baixo (R$)</label>
                <input type="number" step="0.01" value={config.freteBaixo} onChange={e => updateConfig('freteBaixo', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-200 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Frete Alto (R$)</label>
                <input type="number" step="0.01" value={config.freteAlto} onChange={e => updateConfig('freteAlto', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-200 outline-none" />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Limiar Frete Gratis (R$)</label>
              <input type="number" step="1" value={config.limiarFrete} onChange={e => updateConfig('limiarFrete', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-200 outline-none" />
              <p className="text-[10px] text-gray-400 mt-1">0 = sem frete gratis (usa sempre frete alto)</p>
            </div>
          </div>
        </div>

        {/* Resultado - 3 cards */}
        {custo && Number(custo) > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resultados.map(r => {
              const cores = corMap[r.cor];
              return (
                <div key={r.nome} className={`${cores.bg} border ${cores.border} rounded-2xl overflow-hidden`}>
                  {/* Header com gradiente */}
                  <div className={`bg-gradient-to-r ${cores.gradient} px-6 py-4 text-white`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-lg">{r.nome}</h3>
                      <span className="text-xs opacity-80">MC {r.mcMin}-{r.mcMax}%</span>
                    </div>
                    <p className="text-xs opacity-80 mt-1">{r.desc}</p>
                  </div>

                  {/* Preco principal (ponto medio) */}
                  <div className="px-6 py-5">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Preco Sugerido</p>
                    <p className={`text-3xl font-black ${cores.text}`}>{r.mid ? fmt(r.mid.pv) : '-'}</p>
                    {r.mid && (
                      <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-bold ${cores.badge}`}>
                        MC: {fmtPct(r.mid.mcPct)}
                      </span>
                    )}
                  </div>

                  {/* Faixa min-max */}
                  <div className="px-6 pb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span>Faixa de preco:</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                      <span>{r.min ? fmt(r.min.pv) : '-'}</span>
                      <span className="text-gray-300">—</span>
                      <span>{r.max ? fmt(r.max.pv) : '-'}</span>
                    </div>
                  </div>

                  {/* Breakdown */}
                  {r.mid && (
                    <div className="px-6 pb-5 space-y-2">
                      <div className="h-px bg-gray-200 mb-3"></div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Custo</span>
                        <span className="font-bold">{fmt(Number(custo))}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Imposto ({config.imposto}%)</span>
                        <span className="font-bold text-red-500">- {fmt(r.mid.impostoVal)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Comissao ({config.comissao}%)</span>
                        <span className="font-bold text-red-500">- {fmt(r.mid.comissaoVal)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Frete</span>
                        <span className="font-bold text-red-500">- {fmt(r.mid.frete)}</span>
                      </div>
                      <div className="h-px bg-gray-200 my-1"></div>
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-gray-700">Margem (R$)</span>
                        <span className={`font-black ${cores.text}`}>{fmt(r.mid.mc)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
            <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 font-bold">Insira o custo do produto para ver os precos calculados</p>
          </div>
        )}

        {/* Info box */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h4 className="font-bold text-gray-800 mb-3">Como funciona</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <p className="font-bold text-blue-600 mb-1">Entrada (5-10%)</p>
              <p>Preco agressivo para ganhar Buy Box e lancar produtos novos. Margem minima.</p>
            </div>
            <div>
              <p className="font-bold text-amber-600 mb-1">Briga (10-15%)</p>
              <p>Preco competitivo para o dia a dia. Equilibrio entre volume e margem.</p>
            </div>
            <div>
              <p className="font-bold text-green-600 mb-1">Estavel (20-30%)</p>
              <p>Preco saudavel com boa margem de contribuicao. Ideal para produtos consolidados.</p>
            </div>
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

    // NO auto-fetch on mount - user must click button

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

        {/* Empty State - before first search */}
        {!hasSearched && !loading && (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
            <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-600 mb-2">Selecione os filtros e clique em Buscar</h3>
            <p className="text-sm text-gray-400">Escolha o periodo, marketplace e empresa para visualizar os dados de faturamento.</p>
          </div>
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
      case 'precificacao': return <PrecificacaoView />;
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
            <h1 className="text-xl font-bold text-gray-800 capitalize">{activeTab.replace('aguamarinha', 'Agua Marinha')}</h1>
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
