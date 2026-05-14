'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLoginForm } from './use-login-form';
import { LoginFormAlerts } from './LoginFormAlerts';
import { LoginFormHeader } from './LoginFormHeader';
import { LoginFormSignIn } from './LoginFormSignIn';
import { LoginFormRegister } from './LoginFormRegister';
import { LoginFormForgot } from './LoginFormForgot';

/** Painel direito do ecrã de login: orquestra estado + apresenta o formulário do modo activo. */
export function LoginForm() {
  const bag = useLoginForm();

  return (
    <div className="w-full lg:w-1/2 flex flex-col px-8 sm:px-16 md:px-24 lg:px-32 py-12 justify-center relative bg-gradient-to-br from-white via-brand-canvas to-brand-50/60">
      <div className="w-full max-w-[420px] mx-auto flex flex-col">
        <LoginFormHeader mode={bag.mode} />

        <LoginFormAlerts
          error={bag.error}
          registerSuccess={bag.registerSuccess}
          forgotSuccess={bag.forgotSuccess}
        />

        {bag.mode === 'login' ? (
          <LoginFormSignIn bag={bag} />
        ) : bag.mode === 'register' ? (
          <LoginFormRegister bag={bag} />
        ) : (
          <LoginFormForgot bag={bag} />
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-brand-700/50">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-medium">Acesso seguro e encriptado</span>
        </div>
      </div>
    </div>
  );
}
