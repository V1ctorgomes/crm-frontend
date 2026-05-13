import React from 'react';
import { Users, UserPlus, KeyRound } from 'lucide-react';

export type UsuariosAdminSection = 'users' | 'pending' | 'password';

interface UsuariosSectionTabsProps {
  value: UsuariosAdminSection;
  onChange: (section: UsuariosAdminSection) => void;
  pendingCount: number;
  passwordResetCount: number;
}

function TabCount({ n, inverted }: { n: number; inverted?: boolean }) {
  if (n <= 0) return null;
  return (
    <span
      className={`ml-1.5 inline-flex min-w-[1.125rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
        inverted ? 'bg-white text-brand-700' : 'bg-brand-600 text-white'
      }`}
    >
      {n > 99 ? '99+' : n}
    </span>
  );
}

export function UsuariosSectionTabs({
  value,
  onChange,
  pendingCount,
  passwordResetCount,
}: UsuariosSectionTabsProps) {
  const tabs: {
    id: UsuariosAdminSection;
    label: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
    { id: 'users', label: 'Utilizadores', icon: <Users className="h-4 w-4 shrink-0" />, count: 0 },
    { id: 'pending', label: 'Novos acessos', icon: <UserPlus className="h-4 w-4 shrink-0" />, count: pendingCount },
    {
      id: 'password',
      label: 'Palavra-passe',
      icon: <KeyRound className="h-4 w-4 shrink-0" />,
      count: passwordResetCount,
    },
  ];

  return (
    <nav
      className="mx-6 md:mx-8 mb-6 flex flex-wrap gap-1 rounded-xl border border-slate-200/90 bg-white/90 p-1 shadow-sm"
      aria-label="Secções de utilizadores"
    >
      {tabs.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`inline-flex min-h-[2.5rem] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:flex-none sm:px-4 ${
              active
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-brand-950'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <span className={active ? 'text-white' : 'text-slate-500'}>{t.icon}</span>
            <span className="whitespace-nowrap">{t.label}</span>
            <TabCount n={t.count} inverted={active} />
          </button>
        );
      })}
    </nav>
  );
}
