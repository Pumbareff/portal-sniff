import React from 'react';
import { Bell, ShieldAlert, Clock, TrendingDown, RefreshCw, CheckCircle } from 'lucide-react';
import { DEFESA_COLORS, NOTIF_TYPES } from './defesaTheme';

const C = DEFESA_COLORS;

const ICON_MAP = {
  novo_invasor: ShieldAlert,
  prazo: Clock,
  queda_preco: TrendingDown,
  reincidente: RefreshCw,
  acao_concluida: CheckCircle,
};

export default function DefesaNotificacoes({ data }) {
  const { notificacoes, kpis, markNotifRead } = data;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Bell size={20} style={{ color: C.gold }} />
          <h2 className="text-xl font-extrabold" style={{ color: C.text }}>Notificacoes</h2>
        </div>
        <p className="text-xs mt-1" style={{ color: C.textMuted }}>{kpis.notifNaoLidas} notificacoes nao lidas</p>
      </div>

      {/* Notification Feed */}
      <div className="rounded-xl p-4" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
        <div className="space-y-1">
          {notificacoes.map(n => {
            const nt = NOTIF_TYPES[n.tipo] || NOTIF_TYPES.novo_invasor;
            const Icon = ICON_MAP[n.tipo] || ShieldAlert;
            return (
              <div
                key={n.id}
                onClick={() => !n.lida && markNotifRead(n.id)}
                className="flex items-start gap-4 p-4 rounded-lg transition-colors cursor-pointer"
                style={{
                  background: n.lida ? 'transparent' : 'rgba(244,185,66,0.03)',
                  borderBottom: `1px solid ${C.border}`,
                  opacity: n.lida ? 0.6 : 1,
                }}
              >
                <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: nt.bg }}>
                  <Icon size={16} style={{ color: nt.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold" style={{ color: C.text }}>{n.titulo}</div>
                  <div className="text-xs mt-0.5 leading-relaxed" style={{ color: C.textMuted }}>{n.mensagem}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: nt.bg, color: nt.color, border: `1px solid ${nt.color}40` }}>{nt.label}</span>
                    <span className="text-[10px]" style={{ color: C.textDim }}>
                      {n.created_at ? new Date(n.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {notificacoes.length === 0 && (
            <div className="text-sm text-center py-12" style={{ color: C.textDim }}>Nenhuma notificacao</div>
          )}
        </div>
      </div>
    </div>
  );
}
