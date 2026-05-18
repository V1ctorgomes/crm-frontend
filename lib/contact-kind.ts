export type ContactKind = 'UNKNOWN' | 'CUSTOMER' | 'INTERNAL';

export const CONTACT_KIND_OPTIONS: { value: ContactKind; label: string }[] = [
  { value: 'UNKNOWN', label: 'Por classificar' },
  { value: 'CUSTOMER', label: 'Cliente' },
  { value: 'INTERNAL', label: 'Colaborador' },
];

export function contactKindLabel(kind: ContactKind | string | undefined | null): string {
  const k = normalizeContactKind(kind);
  return CONTACT_KIND_OPTIONS.find((o) => o.value === k)?.label ?? 'Por classificar';
}

export function normalizeContactKind(v: unknown): ContactKind {
  const s = String(v ?? '').toUpperCase();
  if (s === 'CUSTOMER' || s === 'INTERNAL' || s === 'UNKNOWN') return s;
  return 'UNKNOWN';
}

/** JID de grupo WhatsApp (termina em `@g.us`). */
export function isWhatsAppGroupJid(number: string | undefined | null): boolean {
  return String(number ?? '').trim().toLowerCase().endsWith('@g.us');
}
