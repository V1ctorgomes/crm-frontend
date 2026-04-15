'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname?.includes(path);

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    localStorage.removeItem('lastActiveContact');
    router.replace('/login');
  };

  return (
    <>
      {/* Header Mobile (Visível apenas em telemóveis) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40 shadow-sm">
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-2xl text-slate-600 p-2">
          <i className="bi bi-list"></i>
        </button>
        <span className="font-bold text-[#1FA84A] text-lg">Suporte Imagem</span>
        <div className="w-8"></div> {/* Spacer para centrar o título */}
      </div>

      {/* Sidebar FIXA */}
      <aside 
        className={`fixed md:relative top-0 left-0 h-full w-[260px] bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 shrink-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0`}
      >
        {/* Logo / Header da Sidebar */}
        <div className="h-[80px] flex items-center px-6 border-b border-slate-100 shrink-0 mt-4 md:mt-0">
          <div className="w-10 h-10 rounded-xl bg-[#1FA84A] flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            SI
          </div>
          <span className="font-bold text-[17px] text-slate-800 ml-3 truncate">
            Suporte Imagem
          </span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden ml-auto text-2xl text-slate-500">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Links de Navegação (O flex-1 empurra o botão Sair para o fundo) */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          <Link 
            href="/dashboard" 
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors ${
              isActive('/dashboard') ? 'bg-[#e8f6ea] text-[#1FA84A] font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'
            }`}
          >
            <i className="bi bi-grid text-[20px]"></i>
            <span className="text-[15px]">Visão Geral</span>
          </Link>

          <Link 
            href="/whatsapp" 
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors ${
              isActive('/whatsapp') ? 'bg-[#e8f6ea] text-[#1FA84A] font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'
            }`}
          >
            <i className="bi bi-chat-left-text text-[20px]"></i>
            <span className="text-[15px]">WhatsApp</span>
          </Link>
        </nav>

        {/* Botão Sair (Fixo no fundo) */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-medium text-[15px]"
          >
            <i className="bi bi-box-arrow-right text-[20px]"></i>
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* Overlay Escuro para fechar o menu no Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </>
  );
}