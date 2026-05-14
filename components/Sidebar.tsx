'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  Contact,
  Users, 
  MessageCircle, 
  FolderOpen,
  Code,
  LineChart,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { SettingsModal } from '@/components/configuracoes/SettingsModal';
import { apiRequest } from '@/lib/api-client';
import { revokeWebPushSubscription } from '@/lib/web-push-client';
import {
  loadUnreadByContact,
  unreadConversationsCount,
  WHATSAPP_UNREAD_STORAGE_KEY,
} from '@/lib/whatsapp-notifications';
import { REMINDERS_BADGE_EVENT, getLastReminderBadgeSnapshot } from '@/lib/solicitacoes-reminders';

// CACHE GLOBAL: Evita que a foto e o nome pisquem ao trocar de página
let globalUserCache: any = null;

// Lista completa de páginas restaurada com a ordem correta
const mainMenuItems = [
  { name: 'Visão Geral', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Contatos', icon: Contact, path: '/contacts' },
  { name: 'Equipe', icon: Users, path: '/usuarios' },
  { name: 'Produtividade', icon: LineChart, path: '/produtividade' },
  { name: 'Solicitações', icon: KanbanSquare, path: '/solicitacoes' },
  { name: 'WhatsApp', icon: MessageCircle, path: '/whatsapp' },
  { name: 'Arquivos', icon: FolderOpen, path: '/arquivos' },
  { name: 'Developer', icon: Code, path: '/developer' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [whatsappUnreadTotal, setWhatsappUnreadTotal] = useState(0);
  const [solicitacoesRemindersGreen, setSolicitacoesRemindersGreen] = useState(
    () => getLastReminderBadgeSnapshot().greenCount,
  );
  const [solicitacoesRemindersRed, setSolicitacoesRemindersRed] = useState(
    () => getLastReminderBadgeSnapshot().redCount,
  );

  // Estado inicializado com o cache para ser instantâneo
  const [currentUser, setCurrentUser] = useState<any>(globalUserCache);

  const menuItems = useMemo(() => {
    const role = currentUser?.role as string | undefined;
    if (!role || role === 'USER') {
      return mainMenuItems.filter(
        (i) => i.path !== '/usuarios' && i.path !== '/developer' && i.path !== '/produtividade',
      );
    }
    if (role === 'ADMIN') {
      return mainMenuItems.filter((i) => i.path !== '/developer');
    }
    if (role === 'DEVELOPER') {
      return mainMenuItems.filter(
        (i) => i.path === '/usuarios' || i.path === '/developer' || i.path === '/produtividade',
      );
    }
    return mainMenuItems;
  }, [currentUser?.role]);

  const canOpenSettings = currentUser?.role === 'ADMIN' || currentUser?.role === 'USER';

  const isActive = (path: string) => pathname?.includes(path);

  // Lógica de Sair da Conta
  const handleLogout = async () => {
    await revokeWebPushSubscription().catch(() => undefined);
    globalUserCache = null;
    localStorage.removeItem('crm_user_cache');
    localStorage.removeItem('lastActiveContact');
    await apiRequest('/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.replace('/login');
  };

  // Carregar os dados reais do usuario
  useEffect(() => {
    if (!globalUserCache && typeof window !== 'undefined') {
      const stored = localStorage.getItem('crm_user_cache');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          globalUserCache = parsed;
          setCurrentUser(parsed);
        } catch (e) {}
      }
    }

    apiRequest('/users/me')
      .then((user) => {
        if (user && JSON.stringify(globalUserCache) !== JSON.stringify(user)) {
          globalUserCache = user;
          setCurrentUser(user);
          if (typeof window !== 'undefined') {
            localStorage.setItem('crm_user_cache', JSON.stringify(user));
          }
        }
      })
      .catch(err => console.error("Erro ao carregar usuario:", err));
  }, []);

  // Fechar o menu mobile ao trocar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setWhatsappUnreadTotal(unreadConversationsCount(loadUnreadByContact()));

    const onUnread = (e: Event) => {
      const ce = e as CustomEvent<{ unreadConversations?: number; total?: number }>;
      const n = ce.detail?.unreadConversations ?? ce.detail?.total;
      if (typeof n === 'number') setWhatsappUnreadTotal(n);
    };

    const onStorage = (ev: StorageEvent) => {
      if (ev.key !== WHATSAPP_UNREAD_STORAGE_KEY) return;
      if (!ev.newValue) {
        setWhatsappUnreadTotal(0);
        return;
      }
      try {
        const o = JSON.parse(ev.newValue) as Record<string, unknown>;
        if (!o || typeof o !== 'object') {
          setWhatsappUnreadTotal(0);
          return;
        }
        const map: Record<string, number> = {};
        for (const [k, v] of Object.entries(o)) {
          const n = Number(v);
          if (Number.isFinite(n) && n > 0) map[k] = Math.min(n, 999);
        }
        setWhatsappUnreadTotal(unreadConversationsCount(map));
      } catch {
        setWhatsappUnreadTotal(0);
      }
    };

    window.addEventListener('crm-whatsapp-unread', onUnread as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('crm-whatsapp-unread', onUnread as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onReminders = (e: Event) => {
      const ce = e as CustomEvent<{ greenCount?: number; redCount?: number }>;
      if (typeof ce.detail?.greenCount === 'number') setSolicitacoesRemindersGreen(ce.detail.greenCount);
      if (typeof ce.detail?.redCount === 'number') setSolicitacoesRemindersRed(ce.detail.redCount);
    };

    window.addEventListener(REMINDERS_BADGE_EVENT, onReminders as EventListener);
    return () => {
      window.removeEventListener(REMINDERS_BADGE_EVENT, onReminders as EventListener);
    };
  }, []);

  return (
    <>
      {/* CABEÇALHO MOBILE (Visível apenas em ecrãs pequenos) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40 shadow-sm">
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-600 p-2 hover:bg-slate-50 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex min-w-0 max-w-[calc(100vw-7rem)] items-center justify-center gap-2">
          <img src="/icon.png" alt="" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
          <span className="truncate text-sm font-bold tracking-tight text-brand-600 sm:text-base">
            Suporte Imagem
          </span>
        </div>
        <div className="w-10 shrink-0" aria-hidden />
      </div>

      {/* MENU LATERAL (Visível sempre no Desktop, gaveta no Mobile) */}
      <aside className={`fixed md:relative top-0 left-0 h-full w-[260px] bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 shrink-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        
        {/* Marca (igual ao login): ícone + nome */}
        <div className="h-[60px] md:h-[88px] flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 pr-2">
            <img
              src="/icon.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 object-contain"
            />
            <span className="truncate text-lg font-bold tracking-tight text-brand-600">
              Suporte Imagem
            </span>
          </div>
          {/* Botão fechar apenas no mobile */}
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navegação Principal */}
        <div className="flex-1 py-6 px-4 flex flex-col gap-1.5 overflow-y-auto no-scrollbar">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">
            Menu Principal
          </div>
          
          {menuItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  active 
                    ? 'bg-brand-50 text-brand-700 font-semibold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-brand-950 font-medium'
                }`}>
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-brand-600' : 'text-slate-400'}`} strokeWidth={active ? 2.5 : 2} />
                  <span className="text-[14px] flex-1 min-w-0 truncate">{item.name}</span>
                  {item.path === '/whatsapp' && whatsappUnreadTotal > 0 && (
                    <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums shrink-0 leading-none">
                      {whatsappUnreadTotal > 99 ? '99+' : whatsappUnreadTotal}
                    </span>
                  )}
                  {item.path === '/solicitacoes' && (solicitacoesRemindersGreen > 0 || solicitacoesRemindersRed > 0) && (
                    <span className="flex items-center gap-1 shrink-0">
                      {solicitacoesRemindersGreen > 0 && (
                        <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums leading-none">
                          {solicitacoesRemindersGreen > 99 ? '99+' : solicitacoesRemindersGreen}
                        </span>
                      )}
                      {solicitacoesRemindersRed > 0 && (
                        <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums leading-none">
                          {solicitacoesRemindersRed > 99 ? '99+' : solicitacoesRemindersRed}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Perfil de usuario dinâmico (botão de Configurações) */}
        <div className="p-4 border-t border-slate-100 shrink-0 mb-2 md:mb-0">
          <div 
            onClick={() => canOpenSettings && setIsSettingsOpen(true)} 
            className={`flex items-center justify-between p-2 rounded-xl transition-colors group ${
              canOpenSettings ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'
            }`}
            title={canOpenSettings ? 'Abrir Configurações' : undefined}
          >
            <div className="flex items-center gap-3">
              
              {/* Bolinha com a Foto (Real ou Iniciais) */}
              <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center text-brand-600 font-bold shrink-0 relative shadow-sm">
                {currentUser?.profilePictureUrl ? (
                  <img 
                    src={currentUser.profilePictureUrl} 
                    alt="Foto de perfil" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{(currentUser?.name || 'U').substring(0, 2).toUpperCase()}</span>
                )}
              </div>

              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-brand-950 truncate">
                  {currentUser?.name || 'Carregando...'}
                </span>
                <span className="text-[11px] font-medium text-slate-500 truncate">
                  {currentUser?.role === 'ADMIN'
                    ? 'Administrador'
                    : currentUser?.role === 'DEVELOPER'
                      ? 'Developer'
                      : 'Equipe'}
                </span>
              </div>
            </div>
            
            {/* Botão de Logout a funcionar com stopPropagation para não abrir o modal */}
            <button 
              onClick={(e) => { e.stopPropagation(); handleLogout(); }} 
              className="p-2 rounded-lg hover:bg-red-50 transition-colors group-hover:text-red-500 text-slate-400" 
              title="Sair da Conta"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* OVERLAY MOBILE: Fundo escuro quando o menu está aberto em telemóveis */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-brand-950/45 z-40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* MODAL GLOBAL DE CONFIGURAÇÕES */}
      {isSettingsOpen && canOpenSettings && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </>
  );
}