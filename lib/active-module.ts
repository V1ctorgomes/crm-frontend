import {
  COMPANY_MODULES,
  type CompanyModuleId,
  isComercialAppPath,
  isEstoqueAppPath,
} from './company-modules';

export const MODULE_COOKIE = 'crm_module';
const MODULE_STORAGE_KEY = 'crm_active_module';

export function isCompanyModuleId(v: string | undefined | null): v is CompanyModuleId {
  return v === 'comercial' || v === 'estoque';
}

export function getModuleDefinition(id: CompanyModuleId) {
  return COMPANY_MODULES[id];
}

export function setActiveModuleClient(id: CompanyModuleId): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MODULE_STORAGE_KEY, id);
  const maxAge = 60 * 60 * 24 * 30;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${MODULE_COOKIE}=${id}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

export function readActiveModuleClient(): CompanyModuleId | null {
  if (typeof window === 'undefined') return null;
  const fromStorage = localStorage.getItem(MODULE_STORAGE_KEY);
  if (isCompanyModuleId(fromStorage)) return fromStorage;
  const match = document.cookie.match(new RegExp(`(?:^|; )${MODULE_COOKIE}=([^;]*)`));
  const fromCookie = match?.[1] ? decodeURIComponent(match[1]) : null;
  return isCompanyModuleId(fromCookie) ? fromCookie : null;
}

export function clearActiveModuleClient(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MODULE_STORAGE_KEY);
  document.cookie = `${MODULE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

/** Inferência quando ainda não há cookie (ex.: bookmark directo). */
export function inferModuleFromPath(pathname: string): CompanyModuleId | null {
  if (isEstoqueAppPath(pathname)) return 'estoque';
  if (isComercialAppPath(pathname)) return 'comercial';
  return null;
}

export function pathAllowedForModule(pathname: string, moduleId: CompanyModuleId): boolean {
  if (moduleId === 'estoque') return isEstoqueAppPath(pathname);
  return isComercialAppPath(pathname);
}
