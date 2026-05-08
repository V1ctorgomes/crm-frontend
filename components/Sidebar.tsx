'use client';

import React, { useState, useEffect } from 'react';
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
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { SettingsModal } from '@/components/configuracoes/SettingsModal';

// CACHE GLOBAL: Evita que a foto e o nome pisquem ao trocar de página
let globalUserCache: any = null;

// Lista completa de páginas restaurada com a ordem correta
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
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Estado inicializado com o cache para ser instantâneo
  const [currentUser, setCurrentUser] = useState<any>(globalUserCache);
  
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  const isActive = (path: string) => pathname?.includes(path);

  // Lógica de Sair da Conta
  const handleLogout = () => {
    globalUserCache = null;
    localStorage.removeItem('crm_user_cache');
    localStorage.removeItem('lastActiveContact');
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.replace('/login');
  };

  // Carregar os dados reais do Utilizador
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

    fetch(`${baseUrl}/users`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const user = data[0];
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

  // Fechar o menu mobile ao trocar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* CABEÇALHO MOBILE (Visível apenas em ecrãs pequenos) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40 shadow-sm">
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-600 p-2 hover:bg-slate-50 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center">
          <img src="/logoBar.png" alt="Logótipo" className="h-7 object-contain" />
        </div>
        <div className="w-10"></div> {/* Espaçador para centralizar o logo */}
      </div>

      {/* MENU LATERAL (Visível sempre no Desktop, gaveta no Mobile) */}
      <aside className={`fixed md:relative top-0 left-0 h-full w-[260px] bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 shrink-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        
        {/* Logótipo / Cabeçalho do Menu */}
        <div className="h-[60px] md:h-[88px] flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center">
             <img src="/logoBar.png" alt="Logótipo do CRM" className="h-8 object-contain" />
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
          
          {mainMenuItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  active 
                    ? 'bg-blue-50 text-blue-700 font-semibold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}>
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} strokeWidth={active ? 2.5 : 2} />
                  <span className="text-[14px]">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Perfil de Utilizador Dinâmico (Botão de Configurações) */}
        <div className="p-4 border-t border-slate-100 shrink-0 mb-2 md:mb-0">
          <div 
            onClick={() => setIsSettingsOpen(true)} 
            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
            title="Abrir Configurações"
          >
            <div className="flex items-center gap-3">
              
              {/* Bolinha com a Foto (Real ou Iniciais) */}
              <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center text-blue-600 font-bold shrink-0 relative shadow-sm">
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
                <span className="text-sm font-bold text-slate-900 truncate">
                  {currentUser?.name || 'Carregando...'}
                </span>
                <span className="text-[11px] font-medium text-slate-500 truncate">
                  {currentUser?.role === 'ADMIN' ? 'Administrador' : 'Equipa'}
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
        <div className="md:hidden fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* MODAL GLOBAL DE CONFIGURAÇÕES */}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </>
  );
}