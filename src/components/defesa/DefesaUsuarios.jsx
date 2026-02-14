import React, { useState } from 'react';
import { Users, UserPlus, Link2, Clock, Copy, Trash2, Shield } from 'lucide-react';
import { DEFESA_COLORS } from './defesaTheme';

const C = DEFESA_COLORS;

export default function DefesaUsuarios({ data, user, profile }) {
  const { shareLinks, activityLog, addShareLink, revokeShareLink } = data;
  const [showAddMember, setShowAddMember] = useState(false);

  const activeLinks = shareLinks.filter(l => l.status === 'ativo').length;
  const userName = profile?.name || user?.email?.split('@')[0] || 'Usuario';
  const userEmail = user?.email || '';
  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const copyLink = (code) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users size={20} style={{ color: C.gold }} />
            <h2 className="text-xl font-extrabold" style={{ color: C.text }}>Gestao de Usuarios</h2>
          </div>
          <p className="text-xs mt-1" style={{ color: C.textMuted }}>1 membros &middot; {activeLinks} links ativos</p>
        </div>
        <button onClick={() => setShowAddMember(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold" style={{ background: C.gold, color: '#000' }}>
          <UserPlus size={14} /> Adicionar Membro
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Members + Links */}
        <div className="lg:col-span-2 space-y-4">
          {/* Team Members */}
          <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} style={{ color: C.gold }} />
              <h3 className="text-sm font-bold" style={{ color: C.text }}>Membros da Equipe</h3>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: C.gold, color: '#000' }}>{initials}</div>
                <div>
                  <div className="text-sm font-bold" style={{ color: C.text }}>{userName}</div>
                  <div className="text-xs" style={{ color: C.textDim }}>{userEmail}</div>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full" style={{ background: C.border, color: C.textMuted }}>
                <Shield size={10} /> Administrador
              </span>
            </div>
          </div>

          {/* Share Links */}
          <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Link2 size={16} style={{ color: C.gold }} />
                <h3 className="text-sm font-bold" style={{ color: C.text }}>Links de Compartilhamento</h3>
              </div>
              <button onClick={addShareLink} className="flex items-center gap-1 text-xs font-bold" style={{ color: C.gold }}>
                + Gerar Link
              </button>
            </div>
            <div className="space-y-2">
              {shareLinks.map(link => (
                <div key={link.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-3">
                    <Link2 size={14} style={{ color: C.textDim }} />
                    <div>
                      <div className="text-xs font-mono font-bold" style={{ color: C.textMuted }}>{link.code}</div>
                      <div className="text-[10px]" style={{ color: C.textDim }}>
                        Criado: {link.created_at ? new Date(link.created_at).toLocaleDateString('pt-BR') : '-'}
                        {link.expires_at && ` · Expira: ${new Date(link.expires_at).toLocaleDateString('pt-BR')}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: link.status === 'ativo' ? '#052E16' : '#1E1E1E',
                        color: link.status === 'ativo' ? '#22C55E' : '#94A3B8',
                        border: `1px solid ${link.status === 'ativo' ? '#22C55E40' : '#94A3B840'}`,
                      }}>
                      {link.status === 'ativo' ? 'Ativo' : 'Revogado'}
                    </span>
                    {link.status === 'ativo' && (
                      <>
                        <button onClick={() => copyLink(link.code)} title="Copiar" style={{ color: C.textDim }}><Copy size={14} /></button>
                        <button onClick={() => revokeShareLink(link.id)} title="Revogar" style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {shareLinks.length === 0 && (
                <div className="text-xs text-center py-6" style={{ color: C.textDim }}>Nenhum link gerado</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Activity Log */}
        <div className="rounded-xl p-5" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} style={{ color: C.gold }} />
            <h3 className="text-sm font-bold" style={{ color: C.text }}>Log de Atividades</h3>
          </div>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {activityLog.slice(0, 20).map((log, i) => (
              <div key={i}>
                <div className="text-xs">
                  <span className="font-bold" style={{ color: C.gold }}>{log.user_name || 'Sistema'}</span>
                  {' '}<span style={{ color: C.textMuted }}>{log.action}</span>
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: C.textDim }}>
                  {log.created_at ? new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            ))}
            {activityLog.length === 0 && (
              <div className="text-xs text-center py-8" style={{ color: C.textDim }}>Nenhuma atividade registrada</div>
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal (placeholder) */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAddMember(false)}>
          <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: C.bgCard, border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-3" style={{ color: C.text }}>Adicionar Membro</h3>
            <p className="text-xs mb-4" style={{ color: C.textMuted }}>Convide um membro para acessar o Guardiao de Catalogo.</p>
            <input placeholder="Email do membro" className="w-full px-3 py-2 rounded-lg text-sm mb-4" style={{ background: '#1E293B', border: `1px solid ${C.border}`, color: C.text, outline: 'none' }} />
            <div className="flex gap-2">
              <button onClick={() => setShowAddMember(false)} className="flex-1 py-2 rounded-lg text-sm font-bold" style={{ border: `1px solid ${C.border}`, color: C.textMuted }}>Cancelar</button>
              <button onClick={() => setShowAddMember(false)} className="flex-1 py-2 rounded-lg text-sm font-bold" style={{ background: C.gold, color: '#000' }}>Convidar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
