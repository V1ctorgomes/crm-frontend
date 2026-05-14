import React from 'react';
import { Loader2, ArrowRight, UserPlus } from 'lucide-react';
import type { LoginFormBag } from './use-login-form';

/** Formulário de entrada (e-mail + palavra-passe). */
export function LoginFormSignIn({ bag }: { bag: LoginFormBag }) {
  const { email, setEmail, password, setPassword, isLoading, handleLogin, switchToForgot, switchToRegister } = bag;
  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-5">
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-brand-900" htmlFor="email">
          E-mail Corporativo
        </label>
        <input
          id="email"
          type="email"
          className="flex h-11 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-ink transition-colors placeholder:text-brand-800/40 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="exemplo@suporteimagem.com.br"
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
            Esqueceu?
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
        Pedir acesso (novo usuario)
      </button>
    </form>
  );
}
