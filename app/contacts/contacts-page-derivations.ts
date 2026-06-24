import type { Contact } from '@/components/contacts/ContactsTable';
import type { ContactsListSection } from '@/components/contacts/ContactsSectionTabs';
import { isWhatsAppGroupJid, normalizeContactKind, type ContactKind } from '@/lib/contact-kind';
import type { Company } from '@/lib/companies';

export const CONTACTS_PAGE_SIZE = 8;

export function computeKindCounts(contacts: Contact[]) {
  let customer = 0;
  let internal = 0;
  let unknown = 0;
  let groups = 0;
  for (const c of contacts) {
    if (isWhatsAppGroupJid(c.number)) {
      groups += 1;
      continue;
    }
    const k = normalizeContactKind(c.contactKind);
    if (k === 'CUSTOMER') customer += 1;
    else if (k === 'INTERNAL') internal += 1;
    else unknown += 1;
  }
  return { customer, internal, unknown, groups };
}

export function filterContactsInSection(contacts: Contact[], listSection: ContactsListSection) {
  if (listSection === 'companies') return [] as Contact[];
  if (listSection === 'groups') {
    return contacts.filter((c) => isWhatsAppGroupJid(c.number));
  }
  const want: ContactKind =
    listSection === 'customer' ? 'CUSTOMER' : listSection === 'internal' ? 'INTERNAL' : 'UNKNOWN';
  return contacts.filter(
    (c) => !isWhatsAppGroupJid(c.number) && normalizeContactKind(c.contactKind) === want,
  );
}

export function filterContactsBySearch(contacts: Contact[], searchTerm: string) {
  return contacts.filter(
    (c) =>
      (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.number.includes(searchTerm) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );
}

export function filterCompaniesBySearch(companies: Company[], searchTerm: string) {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return companies;
  return companies.filter(
    (c) =>
      c.legalName.toLowerCase().includes(term) ||
      (c.tradeName || '').toLowerCase().includes(term) ||
      c.cnpj.replace(/\D/g, '').includes(term.replace(/\D/g, '')),
  );
}

export function paginateRows<T>(rows: T[], page: number, pageSize: number) {
  const start = page * pageSize;
  return rows.slice(start, start + pageSize);
}

export function resolveLinkedCompaniesForEditing(editingContact: Contact | null, companies: Company[]) {
  if (!editingContact) return [];
  const fromContact = editingContact.companies || [];
  return fromContact.map((c) => companies.find((x) => x.id === c.id) || c);
}
