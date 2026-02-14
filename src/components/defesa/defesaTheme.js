// Guard Catalogo - Theme Constants
// Dark navy + gold theme matching Manus Space design

export const DEFESA_COLORS = {
  bg: '#0B1120',
  bgCard: '#111827',
  bgSidebar: '#0F172A',
  border: '#1E293B',
  borderLight: '#334155',
  gold: '#F4B942',
  goldHover: '#D4A438',
  goldDark: '#B8922E',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  textDim: '#64748B',
  white: '#FFFFFF',
};

export const STATUS_COLORS = {
  pendente: { bg: '#422006', text: '#FDE047', dot: '#EAB308', label: 'PENDENTE' },
  em_andamento: { bg: '#172554', text: '#93C5FD', dot: '#3B82F6', label: 'EM ANDAMENTO' },
  aguardando: { bg: '#431407', text: '#FDBA74', dot: '#F97316', label: 'AGUARDANDO RESPOSTA' },
  concluida: { bg: '#052E16', text: '#86EFAC', dot: '#22C55E', label: 'CONCLUIDA' },
};

export const NOTIF_TYPES = {
  novo_invasor: { icon: 'ShieldAlert', color: '#EF4444', bg: '#7F1D1D', label: 'Novo Invasor' },
  prazo: { icon: 'Clock', color: '#3B82F6', bg: '#1E3A5F', label: 'Prazo' },
  queda_preco: { icon: 'TrendingDown', color: '#F97316', bg: '#431407', label: 'Queda de Preco' },
  reincidente: { icon: 'RefreshCw', color: '#A855F7', bg: '#3B0764', label: 'Reincidencia' },
  acao_concluida: { icon: 'CheckCircle', color: '#22C55E', bg: '#052E16', label: 'Acao Concluida' },
};

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'produtos', label: 'Produtos', icon: 'Package' },
  { id: 'acoes', label: 'Acoes de Defesa', icon: 'ClipboardList' },
  { id: 'relatorios', label: 'Relatorios', icon: 'BarChart3' },
  { id: 'notificacoes', label: 'Notificacoes', icon: 'Bell' },
  { id: 'usuarios', label: 'Usuarios', icon: 'Users' },
];
