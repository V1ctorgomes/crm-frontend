'use client';

import { useMemo } from 'react';
import type { Contact } from '@/components/whatsapp/types';
import { normalizeContactKind, type ContactKind } from '@/lib/contact-kind';

export type CrmCustomerRow = { phone?: string; name: string; email?: string; company?: string };

/**
 * Listas derivadas para a barra lateral: conversas activas filtradas,
 * contactos CRM sem conversa ainda, e merge para «nova conversa».
 */
export function useWhatsappContactLists(
  contacts: Contact[],
  crmCustomers: CrmCustomerRow[],
  selectedInstance: string,
  customerSearch: string,
  contactKindFilter: 'ALL' | ContactKind,
) {
  return useMemo(() => {
    const q = customerSearch.toLowerCase();
    const matchesSearch = (c: Contact) =>
      (c.name || '').toLowerCase().includes(q) || (c.number || '').includes(customerSearch);

    const activeContactsList = contacts.filter(
      (c) =>
        Boolean(c.lastMessage && c.lastMessage.trim() !== '') &&
        (selectedInstance === 'ALL' || c.instanceName === selectedInstance),
    );

    const filteredActiveContacts = activeContactsList
      .filter(matchesSearch)
      .filter((c) => (contactKindFilter === 'ALL' ? true : normalizeContactKind(c.contactKind) === contactKindFilter));

    const inactiveContactsList = contacts.filter(
      (c) =>
        (!c.lastMessage || c.lastMessage.trim() === '') &&
        (selectedInstance === 'ALL' || !c.instanceName || c.instanceName === selectedInstance),
    );

    const availableToChat: Contact[] = [...inactiveContactsList];
    crmCustomers.forEach((cust) => {
      let cleanPhone = cust.phone ? cust.phone.replace(/\D/g, '') : '';
      if (cleanPhone.length === 10 || cleanPhone.length === 11) cleanPhone = `55${cleanPhone}`;
      if (
        cleanPhone &&
        !availableToChat.some((c) => c.number === cleanPhone) &&
        !activeContactsList.some((c) => c.number === cleanPhone)
      ) {
        availableToChat.push({
          number: cleanPhone,
          name: cust.name,
          lastMessage: '',
          lastMessageTime: '',
          email: cust.email,
          cnpj: cust.company,
          instanceName: undefined,
        });
      }
    });

    const filteredNewContacts = availableToChat.filter(matchesSearch);

    return { filteredActiveContacts, filteredNewContacts };
  }, [contacts, crmCustomers, selectedInstance, customerSearch, contactKindFilter]);
}
