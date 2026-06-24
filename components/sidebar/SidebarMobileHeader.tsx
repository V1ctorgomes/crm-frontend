'use client';

import { Menu } from 'lucide-react';

export function SidebarMobileHeader({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40 shadow-sm">
      <button onClick={onOpen} className="text-slate-600 p-2 hover:bg-slate-50 rounded-lg">
        <Menu className="w-6 h-6" />
      </button>
      <div className="flex min-w-0 max-w-[calc(100vw-7rem)] items-center justify-center gap-2">
        <img src="/icon.png" alt="" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
        <span className="truncate text-sm font-bold tracking-tight text-brand-600 sm:text-base">Suporte Imagem</span>
      </div>
      <div className="w-10 shrink-0" aria-hidden />
    </div>
  );
}
