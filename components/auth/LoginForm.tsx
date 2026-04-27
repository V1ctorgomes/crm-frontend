'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export function LoginForm() {
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
    <div className="w-full lg:w-1/2 flex flex-col px-8 sm:px-16 md:px-24 lg:px-32 py-12 justify-center relative">
      <div className="w-full max-w-[420px] mx-auto flex flex-col">
        
        {/* Logo Atualizado para logoBar.png */}
        <div className="mb-10">
          <Image 
            src="/logoBar.png" 
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
  );
}