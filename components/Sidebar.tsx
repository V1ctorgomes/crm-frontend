'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Settings,
  LogOut,
  Building2
} from 'lucide-react';

// CACHE GLOBAL: Evita que a foto e o nome pisquem ao trocar de página
let globalUserCache: any = null;

// Menu com todas as páginas restauradas na ordem original
const mainMenuItems = [
  { name: 'Visão Geral', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Contactos', icon: Contact, path: '/contacts' },
  { name: 'Equipa', icon: Users, path: '/usuarios' },
  { name: 'Solicitações', icon: KanbanSquare, path: '/solicitacoes' },
  { name: 'WhatsApp', icon: MessageCircle, path: '/whatsapp' },
  { name: 'Arquivos', icon: FolderOpen, path: '/arquivos' },
  { name: 'Developer', icon: Code, path: '/developer' },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  // Inicializa o estado diretamente com o cache (se existir). Zero piscadas na navegação.
  const [currentUser, setCurrentUser] = useState<any>(globalUserCache);
  
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  const isActive = (path: string) => pathname?.includes(path);

  const handleLogout = () => {
    // Limpa os caches no logout
    globalUserCache = null;
    localStorage.removeItem('crm_user_cache');
    localStorage.removeItem('lastActiveContact');
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.replace('/login');
  };

  useEffect(() => {
    // 1. Tenta carregar do localStorage para uma abertura de site instantânea
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

    // 2. Faz o fetch em background para garantir que a foto ou nome não foram alterados noutro local
    fetch(`${baseUrl}/users`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const user = data[0];
          // Só atualiza o estado e o storage se os dados forem novos (evita re-renders desnecessários)
          if (JSON.stringify(globalUserCache) !== JSON.stringify(user)) {
            globalUserCache = user;
            setCurrentUser(user);
            if (typeof window !== 'undefined') {
              localStorage.setItem('crm_user_cache', JSON.stringify(user));
            }
          }
        }
      })
      .catch(err => console.error("Erro ao carregar utilizador:", err));
  }, [baseUrl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* HEADER MOBILE */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40 shadow-sm">
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-2xl text-slate-600 p-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
        </button>
        <img src="/logo.png" alt="Logo" className="h-8 object-contain" />
        <div className="w-8"></div>
      </div>

      {/* ASIDE (MENU LATERAL) */}
      <aside className={`fixed md:relative top-0 left-0 h-full w-[260px] bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 shrink-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="h-[80px] flex items-center px-6 border-b border-slate-100 shrink-0 mt-4 md:mt-0">
          <img src="/logo.png" alt="Logo" className="h-10 object-contain" />
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden ml-auto text-2xl text-slate-500 hover:text-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1.5 no-scrollbar">
          
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">
            Menu Principal
          </div>

          {mainMenuItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            
            return (
              <Link key={item.path} href={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'}`}>
                <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[14px]">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* ÁREA DO PERFIL / RODAPÉ */}
        <div className="p-4 border-t border-slate-100 shrink-0 relative" ref={profileMenuRef}>
          
          {/* Popup Menu Profile */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-bottom-2">
              <Link 
                href="/configuracoes" 
                onClick={() => setIsProfileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <Settings className="w-[18px] h-[18px] text-slate-400" />
                Configurações
              </Link>
              
              <div className="h-[1px] bg-slate-100 my-1 w-full"></div>
              
              <button 
                onClick={handleLogout} 
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
              >
                <LogOut className="w-[18px] h-[18px]" />
                Sair da Conta
              </button>
            </div>
          )}

          {/* Profile Toggle Button */}
          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 ${isProfileMenuOpen ? 'bg-slate-100 shadow-inner' : 'hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}
          >
            <div className="flex items-center gap-3 overflow-hidden w-full">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0 overflow-hidden shadow-sm">
                {currentUser?.profilePictureUrl ? (
                  <img src={currentUser.profilePictureUrl} alt="Perfil" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  (currentUser?.name || 'U').substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex flex-col text-left overflow-hidden w-full">
                <span className="text-sm font-bold text-slate-800 truncate">{currentUser?.name || 'Utilizador'}</span>
                <span className="text-[11px] font-medium text-slate-500 truncate">{currentUser?.role === 'ADMIN' ? 'Administrador' : 'Equipa'}</span>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-[14px] h-[14px] text-slate-400 shrink-0 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </aside>

      {/* OVERLAY MOBILE */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
    </>
  );
}