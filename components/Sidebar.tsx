// components/Sidebar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname(); // Descobre em que página estamos!
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    localStorage.removeItem('lastActiveContact');
    router.replace('/login');
  };

  // Função para saber qual botão deve ficar verde
  const isActive = (path: string) => pathname?.includes(path);

  return (
    <>
      {/* Header Mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-2xl text-slate-600">
          <i className="bi bi-list"></i>
        </button>
        <span className="font-bold text-[#1FA84A]">Suporte Imagem</span>
      </div>

      {/* Sidebar Inteligente */}
      <aside 
        className={`dash-sidebar group flex flex-col z-50 transition-all duration-300 ease-in-out overflow-hidden bg-white border-r border-slate-200 fixed md:relative h-full
          ${isMobileMenuOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full'} 
          md:translate-x-0 md:!w-[84px] hover:md:!w-[260px]`}
      >
        <div className="flex justify-between items-center mb-10 overflow-hidden whitespace-nowrap p-4 mt-2 md:mt-0">
          <div className="logo-container mb-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#1FA84A] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">SI</div>
            <span className="font-bold text-lg text-slate-800 transition-opacity duration-300 md:opacity-0 group-hover:md:opacity-100">
              Suporte Imagem
            </span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-2xl text-slate-500">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <nav className="dash-nav overflow-hidden flex flex-col gap-2 px-2">
          
          <Link 
            href="/dashboard" 
            className={`dash-nav-item flex items-center whitespace-nowrap p-3 rounded-xl transition-colors ${
              isActive('/dashboard') 
                ? 'bg-[#e8f6ea] text-[#1FA84A] font-bold' 
                : 'hover:bg-slate-50 text-slate-500 font-medium'
            }`}
          >
            <i className="bi bi-grid text-xl shrink-0 ml-1"></i>
            <span className="ml-4 transition-opacity duration-300 md:opacity-0 group-hover:md:opacity-100">
              Visão Geral
            </span>
          </Link>
          
          <Link 
            href="/whatsapp" 
            className={`dash-nav-item flex items-center whitespace-nowrap p-3 rounded-xl transition-colors ${
              isActive('/whatsapp') 
                ? 'bg-[#e8f6ea] text-[#1FA84A] font-bold' 
                : 'hover:bg-slate-50 text-slate-500 font-medium'
            }`}
          >
            <i className="bi bi-chat-left-text text-xl shrink-0 ml-1"></i>
            <span className="ml-4 transition-opacity duration-300 md:opacity-0 group-hover:md:opacity-100">
              WhatsApp
            </span>
          </Link>

        </nav>

        <button onClick={handleLogout} className="logout-btn mt-auto flex items-center whitespace-nowrap overflow-hidden p-4 text-red-500 hover:bg-red-50 transition-colors m-2 rounded-xl">
          <i className="bi bi-box-arrow-right text-xl shrink-0 ml-1"></i>
          <span className="ml-4 transition-opacity duration-300 md:opacity-0 group-hover:md:opacity-100 font-medium">
            Sair
          </span>
        </button>
      </aside>

      {/* Overlay Escuro para o Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </>
  );
}