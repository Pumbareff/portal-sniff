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
  Trash2
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [amSubTab, setAmSubTab] = useState('dashboard-am');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // States para Academy
  const [courses, setCourses] = useState([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

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

  // Load courses from Supabase
  useEffect(() => {
    if (user) {
      supabase.from('courses').select('*').then(({ data }) => {
        if (data && data.length > 0) {
          setCourses(data);
        } else {
          // Fallback mock data if table empty
          setCourses([
            { id: 1, title: 'Introdução ao Varejo', area: 'Vendas', status: 'Ativo' },
            { id: 2, title: 'Logística Sniff', area: 'Operações', status: 'Ativo' },
            { id: 3, title: 'Cultura Corporativa', area: 'RH', status: 'Ativo' }
          ]);
        }
      });
    }
  }, [user]);

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

  // Componentes de Login
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
        setError(authError.message);
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
          </form>
        </div>
      </div>
    );
  };

  // Componente Sidebar
  const Sidebar = () => {
    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'academy', label: 'Sniff Academy', icon: GraduationCap },
      { id: 'recebimento', label: 'Recebimento', icon: Package },
      { id: 'aguamarinha', label: 'Agua Marinha', icon: Droplets },
      { id: 'times', label: 'Times', icon: Users },
      { id: 'sku', label: 'SKU Viability', icon: BarChart3 },
      { id: 'pedidos', label: 'Pedidos Fornecedor', icon: Truck },
      { id: 'config', label: 'Configurações', icon: Settings },
    ];

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
  const DashboardView = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Vendas Total', value: 'R$ 1.242.000', icon: DollarSign, color: 'text-green-600', trend: '+12%' },
          { label: 'Meta Mensal', value: '85%', icon: Target, color: 'text-blue-600', trend: '+5%' },
          { label: 'Novos Pedidos', value: '1,420', icon: Package, color: 'text-purple-600', trend: '+18%' },
          { label: 'SLA Entrega', value: '98.2%', icon: CheckCircle2, color: 'text-orange-600', trend: '+0.5%' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-xl bg-gray-50 ${kpi.color}`}>
                <kpi.icon size={24} />
              </div>
              <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">{kpi.trend}</span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500 font-medium">{kpi.label}</p>
              <h3 className="text-2xl font-bold text-gray-800">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6 text-gray-800">Performance de Vendas vs Meta</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6B1B8E" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6B1B8E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Award className="text-[#F4B942]" /> Reconhecimento
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#F4B942] border-4 border-purple-400 p-1">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#6B1B8E] font-bold text-xl">
                    RP
                  </div>
                </div>
                <div>
                  <p className="text-xs text-purple-200">Vendedor do Mês</p>
                  <p className="font-bold text-lg text-[#F4B942]">Ricardo Pereira</p>
                  <p className="text-xs text-purple-100">Regional Sul • R$ 450k</p>
                </div>
              </div>
              <div className="h-px bg-purple-500/50" />
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 border-4 border-white/10 p-1">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#6B1B8E] font-bold text-xl">
                    AM
                  </div>
                </div>
                <div>
                  <p className="text-xs text-purple-200">Colaborador Destaque</p>
                  <p className="font-bold text-lg">Ana Martins</p>
                  <p className="text-xs text-purple-100">Logística • Eficiência 100%</p>
                </div>
              </div>
            </div>
            <button className="mt-8 w-full bg-[#F4B942] text-[#6B1B8E] py-2 rounded-xl font-bold text-sm hover:brightness-110 transition-all">
              Ver Todos os Rankings
            </button>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );

  // 2. Academy Module
  const AcademyView = () => {
    const handleSaveCourse = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const newCourse = {
        id: editingCourse?.id || Date.now(),
        title: formData.get('title'),
        area: formData.get('area'),
        status: 'Ativo'
      };

      if (editingCourse) {
        await supabase.from('courses').update(newCourse).eq('id', editingCourse.id);
        setCourses(courses.map(c => c.id === editingCourse.id ? newCourse : c));
      } else {
        await supabase.from('courses').insert([newCourse]);
        setCourses([...courses, newCourse]);
      }
      setShowCourseModal(false);
      setEditingCourse(null);
    };

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purple-50 text-[#6B1B8E] rounded-xl">
                  <GraduationCap size={24} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingCourse(course); setShowCourseModal(true); }} className="p-2 text-gray-400 hover:text-[#6B1B8E]"><Edit2 size={18}/></button>
                  <button onClick={async () => { await supabase.from('courses').delete().eq('id', course.id); setCourses(courses.filter(c => c.id !== course.id)); }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              </div>
              <h4 className="font-bold text-gray-800 mb-1">{course.title}</h4>
              <p className="text-sm text-gray-500 mb-4">{course.area}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2 py-1 bg-green-50 text-green-600 rounded-full">{course.status}</span>
                <button className="text-[#6B1B8E] text-sm font-bold flex items-center gap-1 hover:underline">Acessar <ChevronRight size={16}/></button>
              </div>
            </div>
          ))}
        </div>

        {showCourseModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{editingCourse ? 'Editar Curso' : 'Novo Curso'}</h3>
                <button onClick={() => setShowCourseModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
              </div>
              <form onSubmit={handleSaveCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título do Curso</label>
                  <input name="title" defaultValue={editingCourse?.title} required className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#6B1B8E]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área / Categoria</label>
                  <select name="area" defaultValue={editingCourse?.area} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#6B1B8E]">
                    <option>Vendas</option>
                    <option>Logística</option>
                    <option>RH</option>
                    <option>Tecnologia</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-[#6B1B8E] text-white py-3 rounded-xl font-bold shadow-md hover:bg-[#4A1063] transition-all">
                  {editingCourse ? 'Salvar Alterações' : 'Criar Curso'}
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
    const [subView, setSubView] = useState('list');
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setSubView('list')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subView === 'list' ? 'bg-white text-[#6B1B8E] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Listagem
          </button>
          <button
            onClick={() => setSubView('analytics')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subView === 'analytics' ? 'bg-white text-[#6B1B8E] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Analytics
          </button>
        </div>

        {subView === 'list' ? (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
                <tr>
                  <th className="px-6 py-4">ID Carga</th>
                  <th className="px-6 py-4">Fornecedor</th>
                  <th className="px-6 py-4">Quantidade</th>
                  <th className="px-6 py-4">Data Chegada</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {[1,2,3,4,5].map(i => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">#RX-202{i}</td>
                    <td className="px-6 py-4">Logística Brasil SA</td>
                    <td className="px-6 py-4">1.250 caixas</td>
                    <td className="px-6 py-4">28 Mai 2025</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-yellow-50 text-yellow-600 rounded-full text-xs font-bold">Em Conferência</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-[#6B1B8E]">30.253</h3>
                  <p className="text-sm text-gray-500 uppercase font-bold tracking-wider">Caixas Recebidas em 2025</p>
                </div>
                <div className="p-3 rounded-full bg-[#F4B942]/20">
                  <TrendingUp size={24} className="text-[#F4B942]" />
                </div>
              </div>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={boxesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="caixas" fill="#6B1B8E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
              <h4 className="font-bold text-gray-800 mb-4">Meta de Produtividade</h4>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                    Eficiência de Descarga
                  </span>
                  <span className="text-xs font-semibold inline-block text-purple-600">92%</span>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-100">
                  <div style={{ width: "92%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#6B1B8E]"></div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4 italic">
                "O volume de 2025 já supera em 15% o mesmo período do ano anterior, mantendo a meta de excelência operacional."
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 4. Agua Marinha Module
  const AguaMarinhaView = () => {
    const renderSubContent = () => {
      switch (amSubTab) {
        case 'dashboard-am':
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
              <div className="bg-white p-6 rounded-2xl border border-gray-100">
                <h3 className="font-bold mb-4">Volume Água Marinha</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <Tooltip />
                      <Line type="monotone" dataKey="vendas" stroke="#6B1B8E" strokeWidth={3} dot={{fill: '#F4B942'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100">
                <h3 className="font-bold mb-4">Market Share Local</h3>
                <div className="h-[200px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[{name: 'AM', value: 45}, {name: 'Outros', value: 55}]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        <Cell fill="#6B1B8E" />
                        <Cell fill="#F4B942" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        case 'defesa':
          return (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="text-green-500"/> Defesa de Catálogo</h3>
              <p className="text-gray-600">Diretrizes estratégicas para manutenção de SKUs premium e defesa de posicionamento em gôndola.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Item A', 'Item B', 'Item C'].map(item => (
                  <div key={item} className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                    <p className="font-bold text-[#6B1B8E]">{item}</p>
                    <p className="text-xs text-gray-500">Share Requerido: 12%</p>
                  </div>
                ))}
              </div>
            </div>
          );
        case 'checklist':
          return (
            <div className="bg-white p-8 rounded-2xl border border-gray-100">
              <h3 className="text-xl font-bold mb-6">Checklist de Ataque</h3>
              <div className="space-y-4">
                {[
                  'Verificar ruptura no PDV',
                  'Auditoria de Preços Concorrência',
                  'Validação de Merchandising',
                  'Treinamento de Equipe Regional'
                ].map((task, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-all border-b border-gray-50">
                    <div className="w-6 h-6 border-2 border-[#F4B942] rounded flex items-center justify-center">
                      <div className="w-3 h-3 bg-[#6B1B8E] rounded-sm" />
                    </div>
                    <span className="font-medium text-gray-700">{task}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        case 'preco':
          return (
            <div className="bg-white p-8 rounded-2xl border border-gray-100">
              <h3 className="text-xl font-bold mb-6">Estratégia de Preço</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-xs text-gray-400 uppercase">
                    <tr>
                      <th className="pb-4">Segmento</th>
                      <th className="pb-4">Preço Alvo</th>
                      <th className="pb-4">Elasticidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr><td className="py-4">Premium</td><td className="py-4 font-bold">R$ 49,90</td><td className="py-4 text-red-500">Baixa</td></tr>
                    <tr><td className="py-4">Volume</td><td className="py-4 font-bold">R$ 29,90</td><td className="py-4 text-green-500">Alta</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        case 'tracker':
          return (
            <div className="bg-white p-8 rounded-2xl border border-gray-100">
              <h3 className="text-xl font-bold mb-6">Tracker Clips</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] p-6 bg-gradient-to-br from-[#6B1B8E] to-[#4A1063] text-white rounded-2xl">
                  <p className="text-xs uppercase opacity-70">Total Ativos</p>
                  <p className="text-3xl font-black">1.120</p>
                </div>
                <div className="flex-1 min-w-[200px] p-6 bg-[#F4B942] text-[#6B1B8E] rounded-2xl">
                  <p className="text-xs uppercase opacity-70">Novos no Mês</p>
                  <p className="text-3xl font-black">+42</p>
                </div>
              </div>
            </div>
          );
        case 'sobre-am':
          return (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 max-w-2xl">
              <h3 className="text-xl font-bold mb-4">Sobre o Projeto</h3>
              <p className="text-gray-600 leading-relaxed">
                O módulo Agua Marinha é o braço tático do Grupo Sniff focado em inteligência competitiva e penetração de mercado.
                Através deste portal, consolidamos todas as ações ofensivas e defensivas para garantir a liderança do grupo nos
                territórios prioritários.
              </p>
            </div>
          );
        default: return null;
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
          {[
            { id: 'dashboard-am', label: 'Dashboard AM', icon: LayoutDashboard },
            { id: 'defesa', label: 'Defesa Catálogo', icon: ShieldCheck },
            { id: 'checklist', label: 'Checklist Ataque', icon: CheckCircle2 },
            { id: 'preco', label: 'Estratégia Preço', icon: DollarSign },
            { id: 'tracker', label: 'Tracker Clips', icon: BarChart3 },
            { id: 'sobre-am', label: 'Sobre', icon: Info },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setAmSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                amSubTab === tab.id
                ? 'bg-white text-[#6B1B8E] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
        {renderSubContent()}
      </div>
    );
  };

  // 5. Generic View for placeholder modules
  const GenericView = ({ title }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
        <Settings size={40} />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <p className="text-gray-500">Módulo em desenvolvimento para a fase 2 do portal.</p>
      </div>
    </div>
  );

  // Route renderer
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'academy': return <AcademyView />;
      case 'recebimento': return <RecebimentoView />;
      case 'aguamarinha': return <AguaMarinhaView />;
      case 'times': return <GenericView title="Gestão de Times" />;
      case 'sku': return <GenericView title="SKU Viability" />;
      case 'pedidos': return <GenericView title="Pedidos Fornecedor" />;
      case 'config': return <GenericView title="Configurações do Sistema" />;
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
                <p className="text-sm font-bold text-gray-800">{user.email?.split('@')[0] || 'Admin Sniff'}</p>
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Acesso Root</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6B1B8E] to-[#F4B942] p-0.5 shadow-md">
                <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center font-black text-[#6B1B8E]">
                  {user.email?.charAt(0).toUpperCase() || 'A'}
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
