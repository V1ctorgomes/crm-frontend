'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ShieldCheck, UserPlus, KeyRound } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { ensureWebPushSubscription } from '@/lib/web-push-client';

type LoginResponse = {
  name?: string;
  role?: string;
};

type RegisterResponse = {
  ok?: boolean;
  message?: string;
};

export function LoginForm() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPassword2, setRegisterPassword2] = useState('');
  const [error, setError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const resetRegisterFields = () => {
    setRegisterName('');
    setRegisterPassword2('');
  };

  const switchToLogin = () => {
    setMode('login');
    setError('');
    setRegisterSuccess('');
    setForgotSuccess('');
    resetRegisterFields();
  };

  const switchToRegister = () => {
    setMode('register');
    setError('');
    setRegisterSuccess('');
    setForgotSuccess('');
    resetRegisterFields();
  };

  const switchToForgot = () => {
    setMode('forgot');
    setError('');
    setRegisterSuccess('');
    setForgotSuccess('');
    setPassword('');
    resetRegisterFields();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRegisterSuccess('');
    setForgotSuccess('');
    setIsLoading(true);

    try {
      const data = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data?.name != null && data?.role != null) {
        const dest = data.role === 'DEVELOPER' ? '/developer' : '/dashboard';
        await ensureWebPushSubscription().catch(() => undefined);
        router.replace(dest);
        router.refresh();
      } else {
        throw new Error('Resposta de login inválida.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRegisterSuccess('');
    setForgotSuccess('');
    if (password !== registerPassword2) {
      setError('As palavras-passe não coincidem.');
      return;
    }
    setIsLoading(true);
    try {
      const data = await apiRequest<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          name: registerName,
        }),
      });
      const msg = data?.message || 'Pedido registado. Aguarde aprovação de um administrador.';
      setRegisterSuccess(msg);
      setPassword('');
      setRegisterPassword2('');
      setRegisterName('');
      setEmail('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRegisterSuccess('');
    setForgotSuccess('');
    setIsLoading(true);
    try {
      const data = await apiRequest<RegisterResponse>('/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setForgotSuccess(data?.message || 'Pedido registado.');
      setEmail('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full lg:w-1/2 flex flex-col px-8 sm:px-16 md:px-24 lg:px-32 py-12 justify-center relative bg-gradient-to-br from-white via-brand-canvas to-brand-50/60">
      <div className="w-full max-w-[420px] mx-auto flex flex-col">
        <div className="mb-10 flex items-center gap-3">
          <Image
            src="/icon.png"
            alt=""
            width={48}
            height={48}
            priority
            unoptimized
            className="h-12 w-12 shrink-0 object-contain"
          />
          <span className="text-xl font-bold tracking-tight text-brand-950 sm:text-2xl">Suporte Imagem</span>
        </div>

        <div className="flex flex-col space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-brand-950">
            {mode === 'login'
              ? 'Bem-vindo de volta'
              : mode === 'register'
                ? 'Pedir acesso'
                : 'Esqueci a palavra-passe'}
          </h1>
          <p className="text-sm text-brand-800/80 font-medium">
            {mode === 'login'
              ? 'Insira as suas credenciais corporativas para aceder à plataforma.'
              : mode === 'register'
                ? 'Crie a sua conta como utilizador de atendimento. Um administrador terá de aprovar antes de poder iniciar sessão.'
                : 'Indique o e-mail da sua conta. Um administrador criará uma nova palavra-passe na área de utilizadores (sem e-mail automático).'}
          </p>
        </div>

        {(registerSuccess || forgotSuccess) && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 animate-in fade-in duration-300">
            <span className="text-sm font-medium leading-relaxed">{registerSuccess || forgotSuccess}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 animate-in fade-in duration-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 shrink-0 mt-0.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-sm font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {mode === 'login' ? (
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
                <button
                  type="button"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
                  onClick={switchToForgot}
                >
                  Esqueceu-se?
                </button>
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

            <button
              type="button"
              onClick={switchToRegister}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Pedir acesso (novo utilizador)
            </button>
          </form>
        ) : mode === 'register' ? (
          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-brand-900" htmlFor="reg-name">
                Nome completo
              </label>
              <input
                id="reg-name"
                type="text"
                className="flex h-11 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-ink transition-colors placeholder:text-brand-800/40 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
                placeholder="O seu nome"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-brand-900" htmlFor="reg-email">
                E-mail
              </label>
              <input
                id="reg-email"
                type="email"
                className="flex h-11 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-ink transition-colors placeholder:text-brand-800/40 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
                placeholder="exemplo@suempresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-brand-900" htmlFor="reg-pass">
                Palavra-passe (mín. 8 caracteres)
              </label>
              <input
                id="reg-pass"
                type="password"
                className="flex h-11 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-ink font-mono transition-colors placeholder:text-brand-800/40 placeholder:font-sans focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-brand-900" htmlFor="reg-pass2">
                Confirmar palavra-passe
              </label>
              <input
                id="reg-pass2"
                type="password"
                className="flex h-11 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-ink font-mono transition-colors placeholder:text-brand-800/40 placeholder:font-sans focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
                placeholder="••••••••"
                value={registerPassword2}
                onChange={(e) => setRegisterPassword2(e.target.value)}
                required
                minLength={8}
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
                  A enviar pedido...
                </>
              ) : (
                <>
                  Enviar pedido de acesso
                  <UserPlus className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={switchToLogin}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline"
            >
              Já tenho conta — voltar ao login
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-brand-900" htmlFor="forgot-email">
                E-mail da conta
              </label>
              <input
                id="forgot-email"
                type="email"
                className="flex h-11 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-ink transition-colors placeholder:text-brand-800/40 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
                placeholder="exemplo@suempresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  A enviar…
                </>
              ) : (
                <>
                  Pedir nova palavra-passe
                  <KeyRound className="w-4 h-4" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={switchToLogin}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline"
            >
              Voltar ao login
            </button>
          </form>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-brand-700/50">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-medium">Acesso seguro e encriptado</span>
        </div>
      </div>
    </div>
  );
}
