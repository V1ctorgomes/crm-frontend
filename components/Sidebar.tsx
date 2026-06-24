'use client';

import React from 'react';
import { X } from 'lucide-react';
import { SettingsModal } from '@/components/configuracoes/SettingsModal';
import { SidebarMobileHeader } from './sidebar/SidebarMobileHeader';
import { SidebarNav } from './sidebar/SidebarNav';
import { SidebarUserProfile } from './sidebar/SidebarUserProfile';
import { useSidebarState } from './sidebar/use-sidebar-state';

export default function Sidebar() {
  const {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    whatsappUnreadTotal,
    solicitacoesRemindersGreen,
    solicitacoesRemindersRed,
    currentUser,
    moduleDef,
    menuItems,
    canOpenSettings,
    isActive,
    handleLogout,
  } = useSidebarState();

  return (
    <>
      <SidebarMobileHeader onOpen={() => setIsMobileMenuOpen(true)} />

      <aside
        className={`fixed md:relative top-0 left-0 h-full w-[260px] bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 shrink-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="h-[60px] md:h-[88px] flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 pr-2">
            <img src="/icon.png" alt="" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" />
            <span className="truncate text-lg font-bold tracking-tight text-brand-600">Suporte Imagem</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <SidebarNav
          menuSection={moduleDef.menuSection}
          menuItems={menuItems}
          isActive={isActive}
          whatsappUnreadTotal={whatsappUnreadTotal}
          solicitacoesRemindersGreen={solicitacoesRemindersGreen}
          solicitacoesRemindersRed={solicitacoesRemindersRed}
        />

        <SidebarUserProfile
          user={currentUser}
          canOpenSettings={canOpenSettings}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onLogout={handleLogout}
        />
      </aside>

      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-brand-950/45 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {isSettingsOpen && canOpenSettings && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </>
  );
}
