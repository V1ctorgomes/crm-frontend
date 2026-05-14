'use client';

import { useCallback, useState } from 'react';
import type { Contact } from '@/components/whatsapp/types';
import { apiRequest } from '@/lib/api-client';
import type { ContactKind } from '@/lib/contact-kind';

interface Args {
  activeContact: Contact | null;
  setActiveContact: React.Dispatch<React.SetStateAction<Contact | null>>;
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  showFeedback: (type: 'success' | 'error', msg: string) => void;
}

/** PUT de `contactKind` no contacto activo + sincronização na lista local. */
export function useWhatsappContactKind({ activeContact, setActiveContact, setContacts, showFeedback }: Args) {
  const [kindSaving, setKindSaving] = useState(false);

  const updateActiveContactKind = useCallback(
    async (kind: ContactKind) => {
      if (!activeContact) return;
      setKindSaving(true);
      try {
        await apiRequest(`/whatsapp/contacts/${encodeURIComponent(activeContact.number)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactKind: kind }),
        });
        const num = activeContact.number;
        setActiveContact((prev) => (prev && prev.number === num ? { ...prev, contactKind: kind } : prev));
        setContacts((prev) => prev.map((c) => (c.number === num ? { ...c, contactKind: kind } : c)));
        showFeedback('success', 'Classificação guardada.');
      } catch (e: unknown) {
        showFeedback('error', e instanceof Error ? e.message : 'Erro ao guardar.');
      } finally {
        setKindSaving(false);
      }
    },
    [activeContact, setActiveContact, setContacts, showFeedback],
  );

  return { kindSaving, updateActiveContactKind } as const;
}
