import React from 'react';
import { Building2, UserRound, Users, CircleHelp, MessagesSquare } from 'lucide-react';

export type ContactsListSection = 'customer' | 'internal' | 'unknown' | 'groups' | 'companies';

interface ContactsSectionTabsProps {
  value: ContactsListSection;
  onChange: (section: ContactsListSection) => void;
  customerCount: number;
  internalCount: number;
  unknownCount: number;
  groupsCount: number;
  companiesCount: number;
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

export function ContactsSectionTabs({
  value,
  onChange,
  customerCount,
  internalCount,
  unknownCount,
  groupsCount,
  companiesCount,
}: ContactsSectionTabsProps) {
  const tabs: {
    id: ContactsListSection;
    label: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
    {
      id: 'customer',
      label: 'Clientes',
      icon: <UserRound className="h-4 w-4 shrink-0" />,
      count: customerCount,
    },
    {
      id: 'internal',
      label: 'Colaboradores',
      icon: <Users className="h-4 w-4 shrink-0" />,
      count: internalCount,
    },
    {
      id: 'unknown',
      label: 'Sem classificar',
      icon: <CircleHelp className="h-4 w-4 shrink-0" />,
      count: unknownCount,
    },
    {
      id: 'groups',
      label: 'Grupos',
      icon: <MessagesSquare className="h-4 w-4 shrink-0" />,
      count: groupsCount,
    },
    {
      id: 'companies',
      label: 'Empresas',
      icon: <Building2 className="h-4 w-4 shrink-0" />,
      count: companiesCount,
    },
  ];

  return (
    <nav
      className="mx-6 md:mx-8 mb-6 flex flex-wrap gap-1 rounded-xl border border-slate-200/90 bg-white/90 p-1 shadow-sm"
      aria-label="Secções de contatos"
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
