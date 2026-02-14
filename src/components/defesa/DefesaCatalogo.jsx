import React, { useState } from 'react';
import { Shield, LayoutDashboard, Package, ClipboardList, BarChart3, Bell, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFESA_COLORS } from './defesaTheme';
import useDefesaData from './useDefesaData';
import DefesaDashboard from './DefesaDashboard';
import DefesaProdutos from './DefesaProdutos';
import DefesaAcoes from './DefesaAcoes';
import DefesaRelatorios from './DefesaRelatorios';
import DefesaNotificacoes from './DefesaNotificacoes';
import DefesaUsuarios from './DefesaUsuarios';

const ICON_MAP = { LayoutDashboard, Package, ClipboardList, BarChart3, Bell, Users };

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'produtos', label: 'Produtos', icon: 'Package' },
  { id: 'acoes', label: 'Acoes de Defesa', icon: 'ClipboardList' },
  { id: 'relatorios', label: 'Relatorios', icon: 'BarChart3' },
  { id: 'notificacoes', label: 'Notificacoes', icon: 'Bell' },
  { id: 'usuarios', label: 'Usuarios', icon: 'Users' },
];

export default function DefesaCatalogo({ user, profile, supabase }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const data = useDefesaData(supabase, user);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DefesaDashboard data={data} />;
      case 'produtos': return <DefesaProdutos data={data} supabase={supabase} />;
      case 'acoes': return <DefesaAcoes data={data} />;
      case 'relatorios': return <DefesaRelatorios data={data} />;
      case 'notificacoes': return <DefesaNotificacoes data={data} />;
      case 'usuarios': return <DefesaUsuarios data={data} user={user} profile={profile} />;
      default: return <DefesaDashboard data={data} />;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-120px)] rounded-2xl overflow-hidden" style={{ background: DEFESA_COLORS.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col shrink-0 transition-all duration-300"
        style={{ width: collapsed ? 60 : 200, background: DEFESA_COLORS.bgSidebar, borderRight: `1px solid ${DEFESA_COLORS.border}` }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-5" style={{ borderBottom: `1px solid ${DEFESA_COLORS.border}` }}>
          <Shield size={22} style={{ color: DEFESA_COLORS.gold }} />
          {!collapsed && (
            <div>
              <div className="text-sm font-bold" style={{ color: DEFESA_COLORS.gold }}>Guardiao</div>
              <div className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: DEFESA_COLORS.textMuted }}>DE CATALOGO</div>
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
                  color: isActive ? DEFESA_COLORS.gold : DEFESA_COLORS.textMuted,
                  background: isActive ? 'rgba(244,185,66,0.08)' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  borderLeft: isActive ? `3px solid ${DEFESA_COLORS.gold}` : '3px solid transparent',
                }}
              >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center py-3 transition-colors"
          style={{ borderTop: `1px solid ${DEFESA_COLORS.border}`, color: DEFESA_COLORS.textDim }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6" style={{ color: DEFESA_COLORS.text }}>
        {data.loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: DEFESA_COLORS.gold, borderTopColor: 'transparent' }} />
          </div>
        ) : renderView()}
      </main>
    </div>
  );
}
