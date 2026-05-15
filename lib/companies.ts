/** Tipo partilhado entre Contatos, WhatsApp e Solicitações. */
export interface Company {
  id: string;
  legalName: string;
  tradeName: string | null;
  cnpj: string;
  contactCount?: number;
}

export function onlyDigits(s: string): string {
  return String(s || '').replace(/\D/g, '');
}

/** Máscara CNPJ: 00.000.000/0000-00 (parcial à medida que se digita). */
export function formatCnpjInput(raw: string): string {
  const d = onlyDigits(raw).slice(0, 14);
  if (d.length === 0) return '';
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Valida CNPJ (14 dígitos e dígitos verificadores). */
export function isValidCnpj(cnpj: string): boolean {
  const n = onlyDigits(cnpj);
  if (n.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(n)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let t = 0;
  for (let i = 0; i < 12; i++) t += parseInt(n.charAt(i), 10) * w1[i];
  let d1 = t % 11 < 2 ? 0 : 11 - (t % 11);
  if (d1 !== parseInt(n.charAt(12), 10)) return false;
  t = 0;
  for (let i = 0; i < 13; i++) t += parseInt(n.charAt(i), 10) * w2[i];
  const d2 = t % 11 < 2 ? 0 : 11 - (t % 11);
  return d2 === parseInt(n.charAt(13), 10);
}

export function describeCompany(c: Pick<Company, 'legalName' | 'tradeName' | 'cnpj'>): string {
  const name = c.tradeName?.trim() || c.legalName;
  return `${name} — ${formatCnpjInput(c.cnpj)}`;
}

export function companyDisplayName(c: Pick<Company, 'legalName' | 'tradeName'>): string {
  return c.tradeName?.trim() || c.legalName;
}

/** Preenche campos de «cliente» do formulário de OS com dados da empresa. */
export function ticketFormFieldsFromCompany(c: Pick<Company, 'legalName' | 'tradeName' | 'cnpj'>): {
  nome: string;
  cpf: string;
} {
  return {
    nome: companyDisplayName(c),
    cpf: formatCnpjInput(c.cnpj),
  };
}

export interface CompanyLinkedContact {
  number: string;
  name: string;
  email: string | null;
  /** CPF do solicitante (campo `cnpj` no contacto quando tem 11 dígitos). */
  cnpj?: string | null;
  profilePictureUrl?: string | null;
}

/** Preenche o campo CPF do solicitante a partir do contacto (só se já for CPF válido). */
export function solicitanteCpfFromContact(doc?: string | null): string {
  const d = onlyDigits(doc || '');
  if (d.length === 11) return formatCpfCnpjInput(d);
  return '';
}

export interface CompanyDetail extends Company {
  contacts: CompanyLinkedContact[];
}
