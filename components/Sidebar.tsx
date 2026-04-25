'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profilePictureUrl?: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  // NOVO: Estado para controlar o carregamento do perfil
  const [isUserLoading, setIsUserLoading] = useState(true);

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${baseUrl}/users`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setUser(data[0]);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
      } finally {
        setIsUserLoading(false); // Define que terminou de carregar, independentemente do resultado
      }
    };
    fetchUser();
  }, [baseUrl]);

  const handleLogout = () => {
    // Implementar a lógica real de logout (limpar tokens, cookies, etc.) no futuro
    router.push('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg> },
    { name: 'Base de Dados', path: '/contacts', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> },
    { name: 'Equipa', path: '/usuarios', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg> },
    { name: 'Kanban', path: '/solicitacoes', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg> },
    { name: 'WhatsApp', path: '/whatsapp', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg> },
    { name: 'Arquivos', path: '/arquivos', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg> }
  ];

  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 w-full h-[60px] bg-[#00171f] flex items-center justify-between px-4 z-40 border-b border-white/5">
        <div className="flex items-center">
          <img src="/logoBar.png" alt="Logo" className="h-[20px] object-contain ml-1" />
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
         <div className="md:hidden fixed inset-0 bg-[#00171f]/95 backdrop-blur-sm z-30 pt-[70px] px-4 flex flex-col justify-between pb-6 animate-in slide-in-from-top-4 duration-300">
           <div className="flex flex-col gap-2">
             {navLinks.map((link) => (
               <Link key={link.name} href={link.path} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-[15px] transition-all ${pathname.startsWith(link.path) ? 'bg-[#1FA84A] text-white shadow-md' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                 {link.icon}
                 {link.name}
               </Link>
             ))}
           </div>
           
           <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white border border-white/10">
                 {isUserLoading ? (
                   <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                 ) : user?.profilePictureUrl ? (
                   <img src={user.profilePictureUrl} referrerPolicy="no-referrer" className="w-full h-full rounded-full object-cover" alt="Avatar"/>
                 ) : (
                   (user?.name || '?').substring(0, 2).toUpperCase()
                 )}
               </div>
               <div>
                 {isUserLoading ? (
                   <div className="w-24 h-4 bg-slate-700/50 rounded animate-pulse"></div>
                 ) : (
                   <p className="text-white font-bold text-sm">{user?.name || 'Utilizador'}</p>
                 )}
                 <Link href="/configuracoes" onClick={() => setIsMobileMenuOpen(false)} className="text-[#1FA84A] text-xs font-bold hover:text-white transition-colors">Configurações</Link>
               </div>
             </div>
             <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>
             </button>
           </div>
         </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[260px] bg-[#00171f] flex-col justify-between shrink-0 relative border-r border-[#00171f]">
        <div>
          <div className="h-[90px] flex items-center justify-center px-6 border-b border-white/5 mb-6">
            <img src="/logoBar.png" alt="Logo" className="w-[140px] object-contain" />
          </div>
          <div className="px-4 flex flex-col gap-1.5">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.path} className={`flex items-center gap-3.5 px-4 py-3.5 rounded-[14px] font-bold text-[14px] transition-all group relative overflow-hidden ${pathname.startsWith(link.path) ? 'bg-[#1FA84A] text-white shadow-[0_4px_12px_rgba(31,168,74,0.3)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                {pathname.startsWith(link.path) && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30 rounded-r-md"></div>}
                <div className={`${pathname.startsWith(link.path) ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'}`}>
                   {link.icon}
                </div>
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* PROFILE SECTION DESKTOP */}
        <div className="p-4 mt-auto">
          {/* Menu Popup de Configurações e Logout */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-[90px] left-4 right-4 bg-[#0a232c] border border-white/10 rounded-2xl p-2 shadow-xl animate-in fade-in slide-in-from-bottom-2 z-50">
              <Link href="/configuracoes" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-sm font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                Configurações
              </Link>
              <div className="h-px w-full bg-white/5 my-1"></div>
              <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>
                Encerrar Sessão
              </button>
            </div>
          )}
          
          <div 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`w-full flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${isProfileMenuOpen ? 'bg-white/10 border-white/20' : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'}`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white shrink-0 border border-white/10 overflow-hidden">
                {isUserLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                ) : user?.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="Avatar"/>
                ) : (
                  (user?.name || '?').substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="overflow-hidden">
                {isUserLoading ? (
                   <div className="w-24 h-3.5 bg-slate-700/50 rounded animate-pulse mb-1.5 mt-0.5"></div>
                ) : (
                   <p className="text-white font-bold text-sm truncate w-full">{user?.name || 'Utilizador'}</p>
                )}
                
                {isUserLoading ? (
                   <div className="w-16 h-2.5 bg-slate-700/30 rounded animate-pulse"></div>
                ) : (
                   <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{user?.role === 'ADMIN' ? 'Administrador' : 'Gestor'}</p>
                )}
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          </div>
        </div>
      </aside>

      {/* Overlay invisível para fechar o menu popup quando clicar fora */}
      {isProfileMenuOpen && (
        <div className="fixed inset-0 z-40 hidden md:block" onClick={() => setIsProfileMenuOpen(false)}></div>
      )}
    </>
  );
}