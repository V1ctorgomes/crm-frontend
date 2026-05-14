import React from 'react';
import Image from 'next/image';
import type { LoginFormMode } from './use-login-form';

const TITLES: Record<LoginFormMode, string> = {
  login: 'Bem-vindo de volta',
  register: 'Pedir acesso',
  forgot: 'Esqueci a palavra-passe',
};

const SUBTITLES: Record<LoginFormMode, string> = {
  login: 'Insira as suas credenciais corporativas para acessar a plataforma.',
  register: 'Crie a sua conta como usuario de atendimento. Um administrador terá de aprovar antes de poder iniciar sessão.',
  forgot: 'Indique o e-mail da sua conta. Um administrador criará uma nova palavra-passe na área de usuarios (sem e-mail automático).',
};

/** Logo + título + subtítulo, partilhados pelos três modos do ecrã de login. */
export function LoginFormHeader({ mode }: { mode: LoginFormMode }) {
  return (
    <>
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
        <h1 className="text-3xl font-bold tracking-tight text-brand-950">{TITLES[mode]}</h1>
        <p className="text-sm text-brand-800/80 font-medium">{SUBTITLES[mode]}</p>
      </div>
    </>
  );
}
