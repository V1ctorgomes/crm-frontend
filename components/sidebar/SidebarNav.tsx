'use client';

import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SidebarNavItem {
  name: string;
  icon: LucideIcon;
  path: string;
}

interface SidebarNavProps {
  menuSection: string;
  menuItems: SidebarNavItem[];
  isActive: (path: string) => boolean;
  whatsappUnreadTotal: number;
  solicitacoesRemindersGreen: number;
  solicitacoesRemindersRed: number;
}

export function SidebarNav({
  menuSection,
  menuItems,
  isActive,
  whatsappUnreadTotal,
  solicitacoesRemindersGreen,
  solicitacoesRemindersRed,
}: SidebarNavProps) {
  return (
    <div className="flex-1 py-6 px-4 flex flex-col gap-1.5 overflow-y-auto no-scrollbar">
      <div className="mb-3 px-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{menuSection}</div>
        <Link href="/inicio" className="mt-1.5 flex items-center gap-2 text-xs font-medium text-brand-600 hover:text-brand-800">
          <LayoutGrid className="h-3.5 w-3.5" />
          Trocar área
        </Link>
      </div>

      {menuItems.map((item) => {
        const active = isActive(item.path);
        const Icon = item.icon;

        return (
          <Link key={item.path} href={item.path}>
            <div
              className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-brand-950 font-medium'
              }`}
            >
              <Icon
                className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-brand-600' : 'text-slate-400'}`}
                strokeWidth={active ? 2.5 : 2}
              />
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
  );
}
