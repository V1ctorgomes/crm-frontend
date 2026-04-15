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
      {/* Header Mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-2xl text-slate-600">
          <i className="bi bi-list"></i>
        </button>
        <span className="font-bold text-[#1FA84A]">Suporte Imagem</span>
      </div>

      {/* Sidebar (Desktop recolhível & Mobile) */}
      <aside 
        className={`group flex flex-col z-50 transition-all duration-300 ease-in-out bg-white border-r border-slate-200 fixed md:relative h-full
          ${isMobileMenuOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full'} 
          md:translate-x-0 md:w-[84px] hover:md:w-[260px] shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center h-[80px] px-4 shrink-0 overflow-hidden border-b border-slate-50 md:border-none mt-2 md:mt-0">
          <div className="w-11 h-11 rounded-xl bg-[#1FA84A] flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">SI</div>
          <span className="font-bold text-xl text-slate-800 ml-4 whitespace-nowrap transition-opacity duration-300 md:opacity-0 group-hover:md:opacity-100">
            Suporte Imagem
          </span>
        </div>

        {/* Links (flex-1 empurra o Sair para o fundo) */}
        <nav className="flex-1 flex flex-col gap-2 px-3 mt-4 overflow-hidden">
          
          <Link href="/dashboard" className={`flex items-center h-12 rounded-xl transition-colors overflow-hidden ${isActive('/dashboard') ? 'bg-[#e8f6ea] text-[#1FA84A]' : 'hover:bg-slate-50 text-slate-500'}`}>
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              <i className="bi bi-grid text-xl"></i>
            </div>
            <span className={`font-medium whitespace-nowrap transition-opacity duration-300 md:opacity-0 group-hover:md:opacity-100 ${isActive('/dashboard') ? 'font-bold' : ''}`}>
              Visão Geral
            </span>
          </Link>

          <Link href="/whatsapp" className={`flex items-center h-12 rounded-xl transition-colors overflow-hidden ${isActive('/whatsapp') ? 'bg-[#e8f6ea] text-[#1FA84A]' : 'hover:bg-slate-50 text-slate-500'}`}>
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              <i className="bi bi-chat-left-text text-xl"></i>
            </div>
            <span className={`font-medium whitespace-nowrap transition-opacity duration-300 md:opacity-0 group-hover:md:opacity-100 ${isActive('/whatsapp') ? 'font-bold' : ''}`}>
              WhatsApp
            </span>
          </Link>

        </nav>

        {/* Botão Sair no fundo */}
        <div className="p-3 shrink-0 mb-2">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center h-12 rounded-xl text-red-500 hover:bg-red-50 transition-colors overflow-hidden"
          >
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              <i className="bi bi-box-arrow-right text-xl"></i>
            </div>
            <span className="font-medium whitespace-nowrap transition-opacity duration-300 md:opacity-0 group-hover:md:opacity-100">
              Sair
            </span>
          </button>
        </div>
      </aside>

      {/* Overlay Escuro para o Mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
    </>
  );
}