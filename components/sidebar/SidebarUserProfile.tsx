'use client';

import { LogOut } from 'lucide-react';
import type { SidebarUser } from './sidebar-user-cache';
import { proxiedMediaUrlOrEmpty } from '@/lib/proxied-storage-url';

function roleLabel(role?: string) {
  if (role === 'ADMIN') return 'Administrador';
  if (role === 'DEVELOPER') return 'Developer';
  return 'Equipe';
}

interface SidebarUserProfileProps {
  user: SidebarUser | null;
  canOpenSettings: boolean;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export function SidebarUserProfile({ user, canOpenSettings, onOpenSettings, onLogout }: SidebarUserProfileProps) {
  return (
    <div className="p-4 border-t border-slate-100 shrink-0 mb-2 md:mb-0">
      <div
        onClick={() => canOpenSettings && onOpenSettings()}
        className={`flex items-center justify-between p-2 rounded-xl transition-colors group ${
          canOpenSettings ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'
        }`}
        title={canOpenSettings ? 'Abrir Configurações' : undefined}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center text-brand-600 font-bold shrink-0 relative shadow-sm">
            {user?.profilePictureUrl ? (
              <img
                src={proxiedMediaUrlOrEmpty(user.profilePictureUrl)}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{(user?.name || 'U').substring(0, 2).toUpperCase()}</span>
            )}
          </div>

          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-brand-950 truncate">{user?.name || 'Carregando...'}</span>
            <span className="text-[11px] font-medium text-slate-500 truncate">{roleLabel(user?.role)}</span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onLogout();
          }}
          className="p-2 rounded-lg hover:bg-red-50 transition-colors group-hover:text-red-500 text-slate-400"
          title="Sair da Conta"
        >
          <LogOut className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
}
