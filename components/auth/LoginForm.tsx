'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';

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
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.access_token) {
        document.cookie = `token=${data.access_token}; path=/; max-age=28800; SameSite=Lax`;

        const dest =
          data.role === 'DEVELOPER'
            ? '/developer'
            : '/dashboard';
        router.replace(dest);
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
    <div className="w-full lg:w-1/2 flex flex-col px-8 sm:px-16 md:px-24 lg:px-32 py-12 justify-center relative bg-gradient-to-br from-white via-brand-canvas to-brand-50/60">
      <div className="w-full max-w-[420px] mx-auto flex flex-col">
        
        {/* Logo com carregamento direto (unoptimized) para evitar erros de cache/servidor */}
        <div className="mb-10">
          <Image 
            src="/logoBar.png" 
            alt="Logo do CRM" 
            width={160} 
            height={45} 
            priority
            unoptimized
            className="h-[45px] w-auto object-contain" 
          />
        </div>

        {/* Cabeçalho */}
        <div className="flex flex-col space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-brand-950">
            Bem-vindo de volta
          </h1>
          <p className="text-sm text-brand-800/80 font-medium">
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
            <label className="text-sm font-semibold text-brand-900" htmlFor="email">
              E-mail Corporativo
            </label>
            <input
              id="email"
              type="email"
              className="flex h-11 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-ink transition-colors placeholder:text-brand-800/40 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="exemplo@suempresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-brand-900" htmlFor="password">
                Palavra-passe
              </label>
              <a href="#" className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors">
                Esqueceu-se?
              </a>
            </div>
            <input
              id="password"
              type="password"
              className="flex h-11 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-ink font-mono transition-colors placeholder:text-brand-800/40 placeholder:font-sans focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-8 text-sm font-medium text-white transition-all hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 focus:ring-offset-brand-canvas disabled:pointer-events-none disabled:opacity-70"
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
        <div className="mt-8 flex items-center justify-center gap-2 text-brand-700/50">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-medium">Acesso seguro e encriptado</span>
        </div>
      </div>
    </div>
  );
}