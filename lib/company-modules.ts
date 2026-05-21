import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  KanbanSquare,
  Contact,
  Users,
  MessageCircle,
  FolderOpen,
  Code,
  LineChart,
  Package,
  ArrowLeftRight,
  Boxes,
} from 'lucide-react';

export type CompanyModuleId = 'comercial' | 'estoque';

export type ModuleMenuItem = {
  name: string;
  icon: LucideIcon;
  path: string;
};

export type CompanyModuleDef = {
  id: CompanyModuleId;
  name: string;
  shortName: string;
  description: string;
  defaultPath: string;
  accentClass: string;
  menuSection: string;
  menuItems: ModuleMenuItem[];
};

const comercialMenu: ModuleMenuItem[] = [
  { name: 'Visão Geral', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Contatos', icon: Contact, path: '/contacts' },
  { name: 'Equipe', icon: Users, path: '/usuarios' },
  { name: 'Produtividade', icon: LineChart, path: '/produtividade' },
  { name: 'Solicitações', icon: KanbanSquare, path: '/solicitacoes' },
  { name: 'WhatsApp', icon: MessageCircle, path: '/whatsapp' },
  { name: 'Arquivos', icon: FolderOpen, path: '/arquivos' },
  { name: 'Developer', icon: Code, path: '/developer' },
];

const estoqueMenu: ModuleMenuItem[] = [
  { name: 'Visão Geral', icon: LayoutDashboard, path: '/estoque/dashboard' },
  { name: 'Produtos', icon: Package, path: '/estoque/produtos' },
  { name: 'Movimentações', icon: ArrowLeftRight, path: '/estoque/movimentacoes' },
  { name: 'Inventário', icon: Boxes, path: '/estoque/inventario' },
];

export const COMPANY_MODULES: Record<CompanyModuleId, CompanyModuleDef> = {
  comercial: {
    id: 'comercial',
    name: 'Comercial',
    shortName: 'Comercial',
    description: 'CRM, atendimento, WhatsApp, solicitações e equipa.',
    defaultPath: '/dashboard',
    accentClass: 'from-brand-600 to-brand-800',
    menuSection: 'Comercial',
    menuItems: comercialMenu,
  },
  estoque: {
    id: 'estoque',
    name: 'Estoque',
    shortName: 'Estoque',
    description: 'Produtos, movimentações e inventário da empresa.',
    defaultPath: '/estoque/dashboard',
    accentClass: 'from-emerald-600 to-teal-800',
    menuSection: 'Estoque',
    menuItems: estoqueMenu,
  },
};

export const MODULE_PICKER_ORDER: CompanyModuleId[] = ['comercial', 'estoque'];

export const COMERCIAL_ROUTE_PREFIXES = [
  '/dashboard',
  '/contacts',
  '/solicitacoes',
  '/whatsapp',
  '/arquivos',
  '/configuracoes',
  '/usuarios',
  '/developer',
  '/produtividade',
];

export const ESTOQUE_ROUTE_PREFIXES = ['/estoque'];

export function isComercialAppPath(pathname: string): boolean {
  return COMERCIAL_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isEstoqueAppPath(pathname: string): boolean {
  return ESTOQUE_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isModuleScopedAppPath(pathname: string): boolean {
  return isComercialAppPath(pathname) || isEstoqueAppPath(pathname);
}

export function filterMenuByRole(
  items: ModuleMenuItem[],
  role: string | undefined,
): ModuleMenuItem[] {
  if (!role || role === 'USER') {
    return items.filter(
      (i) => i.path !== '/usuarios' && i.path !== '/developer' && i.path !== '/produtividade',
    );
  }
  if (role === 'ADMIN') {
    return items.filter((i) => i.path !== '/developer');
  }
  if (role === 'DEVELOPER') {
    return items.filter(
      (i) => i.path === '/usuarios' || i.path === '/developer' || i.path === '/produtividade',
    );
  }
  return items;
}

export function modulesForRole(role: string | undefined): CompanyModuleId[] {
  if (role === 'DEVELOPER') return [];
  return MODULE_PICKER_ORDER;
}
