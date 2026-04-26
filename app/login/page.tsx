'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Credenciais inválidas. Verifique o seu e-mail e palavra-passe.');
      }

      if (data.access_token) {
        // Guarda o cookie de forma segura
        document.cookie = `token=${data.access_token}; path=/; max-age=28800; SameSite=Lax`;
        
        // Redireciona para o Dashboard
        router.replace('/dashboard');
        router.refresh();
      } else {
        throw new Error('Token não recebido pelo servidor.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* LADO ESQUERDO: Formulário de Login */}
      <div className="w-full lg:w-1/2 flex flex-col px-8 sm:px-16 md:px-24 lg:px-32 py-12 justify-center relative">
        
        <div className="w-full max-w-[420px] mx-auto flex flex-col">
          
          {/* Logo */}
          <div className="mb-10">
            <Image 
              src="/logo.png" 
              alt="Logo do CRM" 
              width={160} 
              height={45} 
              priority 
              className="object-contain" 
            />
          </div>

          {/* Cabeçalho */}
          <div className="flex flex-col space-y-2 mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Bem-vindo de volta
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Insira as suas credenciais corporativas para aceder à plataforma.
            </p>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 animate-in fade-in duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0 mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="email">
                E-mail Corporativo
              </label>
              <input
                id="email"
                type="email"
                className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="exemplo@suempresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                  Palavra-passe
                </label>
                <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                  Esqueceu-se?
                </a>
              </div>
              <input
                id="password"
                type="password"
                className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-mono transition-colors placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-8 text-sm font-medium text-white transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  A autenticar...
                </>
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Rodapé de Segurança */}
          <div className="mt-8 flex items-center justify-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-medium">Acesso seguro e encriptado</span>
          </div>
        </div>
      </div>

      {/* LADO DIREITO: Banner Institucional (Visível apenas em Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900 items-center justify-center">
        {/* Fundo com Gradiente Sofisticado */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-slate-900 to-slate-900 z-0"></div>
        
        {/* Padrões Geométricos Suaves ao Fundo */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[80px] z-0"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[100px] z-0"></div>

        {/* Conteúdo Institucional */}
        <div className="relative z-10 flex flex-col p-16 max-w-2xl">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-8 shadow-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 20.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
          </div>
          
          <h2 className="text-4xl font-bold text-white leading-tight mb-6">
            Acelere a sua operação e unifique o atendimento ao cliente.
          </h2>
          
          <p className="text-lg text-blue-100/80 font-medium leading-relaxed max-w-lg">
            O nosso CRM consolida a sua gestão de processos, base de dados e WhatsApp numa interface rápida, moderna e intuitiva.
          </p>

          <div className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-blue-100 flex items-center justify-center font-bold text-xs text-blue-800">A</div>
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-emerald-100 flex items-center justify-center font-bold text-xs text-emerald-800">B</div>
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-purple-100 flex items-center justify-center font-bold text-xs text-purple-800">C</div>
            </div>
            <p className="text-sm font-medium text-blue-200">Junte-se à sua equipa.</p>
          </div>
        </div>
      </div>
      
    </div>
  );
}