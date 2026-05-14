import React from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import type { LoginFormBag } from './use-login-form';

/** Formulário de pedido de acesso (regista conta pendente de aprovação). */
export function LoginFormRegister({ bag }: { bag: LoginFormBag }) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    registerName,
    setRegisterName,
    registerPassword2,
    setRegisterPassword2,
    isLoading,
    handleRegister,
    switchToLogin,
  } = bag;

  return (
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
          placeholder="exemplo@suporteimagem.com.br"
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
  );
}
