'use client';

import { useCallback } from 'react';
import type { Contact } from '@/components/whatsapp/types';

interface Args {
  contacts: Contact[];
  selectedInstance: string;
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  setActiveContact: React.Dispatch<React.SetStateAction<Contact | null>>;
  setCustomerSearch: React.Dispatch<React.SetStateAction<string>>;
}

/** Inicia ou reabre conversa a partir da lista CRM / contactos inactivos. */
export function useWhatsappStartChat({ contacts, selectedInstance, setContacts, setActiveContact, setCustomerSearch }: Args) {
  return useCallback(
    (contact: { number: string; name: string; email?: string; cnpj?: string }) => {
      const existing = contacts.find((c) => c.number === contact.number);
      const targetInstance = selectedInstance !== 'ALL' ? selectedInstance : undefined;
      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (existing) {
        setContacts((prev) =>
          prev.map((c) =>
            c.number === contact.number
              ? { ...c, lastMessage: 'Nova Conversa', lastMessageTime: timeNow }
              : c,
          ),
        );
        setActiveContact({ ...existing, lastMessage: 'Nova Conversa' });
      } else {
        const newContact: Contact = {
          number: contact.number,
          name: contact.name,
          lastMessage: 'Nova Conversa',
          lastMessageTime: timeNow,
          email: contact.email,
          cnpj: contact.cnpj,
          instanceName: targetInstance,
          contactKind: 'UNKNOWN',
        };
        setContacts((prev) => [newContact, ...prev]);
        setActiveContact(newContact);
      }
      setCustomerSearch('');
    },
    [contacts, selectedInstance, setContacts, setActiveContact, setCustomerSearch],
  );
}
