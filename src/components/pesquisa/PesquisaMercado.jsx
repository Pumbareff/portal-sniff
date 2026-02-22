import React, { useState } from 'react';
import { Microscope, LayoutDashboard, Users, Eye, DollarSign, TrendingUp, Target, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { PESQUISA_COLORS } from './pesquisaTheme';
import usePesquisaData from './usePesquisaData';
import PesquisaDashboard from './PesquisaDashboard';
import PesquisaCompradores from './PesquisaCompradores';
import PesquisaConcorrencia from './PesquisaConcorrencia';
import PesquisaElasticidade from './PesquisaElasticidade';
import PesquisaDemanda from './PesquisaDemanda';
import PesquisaOportunidades from './PesquisaOportunidades';
import PesquisaRelatorios from './PesquisaRelatorios';

const ICON_MAP = { LayoutDashboard, Users, Eye, DollarSign, TrendingUp, Target, FileText };

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'compradores', label: 'Compradores', icon: 'Users' },
  { id: 'concorrencia', label: 'Concorrencia', icon: 'Eye' },
  { id: 'elasticidade', label: 'Elasticidade', icon: 'DollarSign' },
  { id: 'demanda', label: 'Demanda', icon: 'TrendingUp' },
  { id: 'oportunidades', label: 'Oportunidades', icon: 'Target' },
  { id: 'relatorios', label: 'Relatorios', icon: 'FileText' },
];

export default function PesquisaMercado({ user, profile, supabase }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const data = usePesquisaData(supabase);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <PesquisaDashboard data={data} />;
      case 'compradores': return <PesquisaCompradores data={data} />;
      case 'concorrencia': return <PesquisaConcorrencia data={data} />;
      case 'elasticidade': return <PesquisaElasticidade data={data} />;
      case 'demanda': return <PesquisaDemanda data={data} />;
      case 'oportunidades': return <PesquisaOportunidades data={data} />;
      case 'relatorios': return <PesquisaRelatorios data={data} />;
      default: return <PesquisaDashboard data={data} />;
    }
  };

  const C = PESQUISA_COLORS;

  return (
    <div className="flex min-h-[calc(100vh-120px)] rounded-2xl overflow-hidden" style={{ background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col shrink-0 transition-all duration-300"
        style={{ width: collapsed ? 60 : 200, background: C.bgSidebar, borderRight: `1px solid ${C.border}` }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-5" style={{ borderBottom: `1px solid ${C.border}` }}>
          <Microscope size={22} style={{ color: C.accent }} />
          {!collapsed && (
            <div>
              <div className="text-sm font-bold" style={{ color: C.accent }}>Pesquisa</div>
              <div className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: C.textMuted }}>DE MERCADO</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2">
          {NAV_ITEMS.map(item => {
            const Icon = ICON_MAP[item.icon];
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-all relative"
                style={{
                  color: isActive ? C.accent : C.textMuted,
                  background: isActive ? 'rgba(0,212,170,0.08)' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  borderLeft: isActive ? `3px solid ${C.accent}` : '3px solid transparent',
                }}
              >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Mock indicator */}
        {data.usingMock && !collapsed && (
          <div className="mx-3 mb-2 px-2 py-1 rounded text-[10px] text-center" style={{ background: `${C.yellow}15`, color: C.yellow }}>
            Dados de demonstracao
          </div>
        )}

        {/* Collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center py-3 transition-colors"
          style={{ borderTop: `1px solid ${C.border}`, color: C.textDim }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6" style={{ color: C.text }}>
        {data.loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: C.accent, borderTopColor: 'transparent' }} />
          </div>
        ) : renderView()}
      </main>
    </div>
  );
}
