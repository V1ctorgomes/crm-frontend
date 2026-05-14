import React from 'react';
import { Loader2, KeyRound } from 'lucide-react';
import type { LoginFormBag } from './use-login-form';

/** Formulário «Esqueci a palavra-passe» — sem e-mail automático: pede a um admin. */
export function LoginFormForgot({ bag }: { bag: LoginFormBag }) {
  const { email, setEmail, isLoading, handleForgotPassword, switchToLogin } = bag;
  return (
    <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-brand-900" htmlFor="forgot-email">
          E-mail da conta
        </label>
        <input
          id="forgot-email"
          type="email"
          className="flex h-11 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-ink transition-colors placeholder:text-brand-800/40 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          placeholder="exemplo@suporteimagem.com.br"
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
  );
}
