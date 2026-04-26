'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  Users, 
  MessageCircle, 
  FolderOpen, 
  Settings,
  LogOut,
  Building2
} from 'lucide-react';

const mainMenuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Kanban', icon: KanbanSquare, path: '/solicitacoes' },
  { name: 'Contactos', icon: Users, path: '/contacts' },
  { name: 'WhatsApp', icon: MessageCircle, path: '/whatsapp' },
  { name: 'Arquivos', icon: FolderOpen, path: '/arquivos' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen hidden md:flex shrink-0">
      
      {/* Logótipo / Cabeçalho do Menu */}
      <div className="h-[88px] flex items-center px-6 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-sm">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">
            Workspace
          </span>
        </div>
      </div>

      {/* Navegação Principal */}
      <div className="flex-1 py-6 px-4 flex flex-col gap-1 overflow-y-auto no-scrollbar">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">
          Menu Principal
        </div>
        
        {mainMenuItems.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
          const Icon = item.icon;
          
          return (
            <Link key={item.path} href={item.path}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 font-semibold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}>
                <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-blue-600' : 'text-slate-400'}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-sm">{item.name}</span>
              </div>
            </Link>
          );
        })}

        <div className="mt-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">
          Administração
        </div>
        
        <Link href="/configuracoes">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
            pathname === '/configuracoes' 
              ? 'bg-blue-50 text-blue-700 font-semibold' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}>
            <Settings className={`w-[18px] h-[18px] ${pathname === '/configuracoes' ? 'text-blue-600' : 'text-slate-400'}`} strokeWidth={pathname === '/configuracoes' ? 2.5 : 2} />
            <span className="text-sm">Configurações</span>
          </div>
        </Link>
      </div>

      {/* Perfil de Utilizador com Foto Real */}
      <div className="p-4 border-t border-slate-100 shrink-0 mb-2">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            
            {/* BOLINHA COM A FOTO */}
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0 relative">
              <img 
                src="https://github.com/shadcn.png" 
                alt="Foto de perfil de Paulo Victor" 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-slate-900 truncate">Paulo Victor</span>
              <span className="text-[11px] font-medium text-slate-500 truncate">Administrador</span>
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-red-50 transition-colors group-hover:text-red-500 text-slate-400">
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
      
    </aside>
  );
}