'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, ChevronRight, Code, Users } from 'lucide-react';
import {
  COMPANY_MODULES,
  MODULE_PICKER_ORDER,
  type CompanyModuleId,
} from '@/lib/company-modules';
import { setActiveModuleClient } from '@/lib/active-module';

type Props = {
  userName?: string;
  role?: string;
};

export function ModulePicker({ userName, role }: Props) {
  const router = useRouter();
  const modules = MODULE_PICKER_ORDER;

  const enterModule = (id: CompanyModuleId) => {
    setActiveModuleClient(id);
    router.push(COMPANY_MODULES[id].defaultPath);
  };

  return (
    <div className="min-h-screen bg-brand-canvas font-sans selection:bg-brand-100 selection:text-brand-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10 md:px-10">
        <header className="mb-10 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Suporte Imagem</p>
              <h1 className="text-2xl font-bold text-brand-950 md:text-3xl">Escolha a área de trabalho</h1>
            </div>
          </div>
          {userName && (
            <p className="text-sm text-slate-600">
              Olá, <span className="font-semibold text-brand-950">{userName}</span> — selecione onde deseja atuar.
            </p>
          )}
        </header>

        <div className="grid flex-1 grid-cols-1 gap-5 md:grid-cols-2">
          {modules.map((id) => {
            const mod = COMPANY_MODULES[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => enterModule(id)}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:border-brand-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-600/30"
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${mod.accentClass} text-white shadow-sm`}
                >
                  <Building2 className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold text-brand-950">{mod.name}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{mod.description}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all">
                  Entrar
                  <ChevronRight className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>

        {role === 'DEVELOPER' && (
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/developer"
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Code className="h-5 w-5 text-brand-600" />
              Developer / Provedores
            </Link>
            <Link
              href="/usuarios"
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Users className="h-5 w-5 text-brand-600" />
              Equipa
            </Link>
          </div>
        )}

        {role === 'ADMIN' && (
          <p className="mt-8 text-center text-xs text-slate-500">
            Acesso técnico:{' '}
            <Link href="/developer" className="font-semibold text-brand-600 hover:underline">
              Developer
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
