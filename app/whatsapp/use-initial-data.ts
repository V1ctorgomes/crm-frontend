'use client';

import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { apiRequest } from '@/lib/api-client';
import type { Contact, Stage } from '@/components/whatsapp/types';
import type { TicketCatalogOptions } from '@/lib/ticket-catalog-types';
import { mapWhatsappContactApiRow } from './utils';

interface UseInitialDataArgs {
  setContacts: Dispatch<SetStateAction<Contact[]>>;
  setActiveContact: Dispatch<SetStateAction<Contact | null>>;
  setStages: Dispatch<SetStateAction<Stage[]>>;
  setTicketCatalog: Dispatch<SetStateAction<TicketCatalogOptions | null>>;
  setCrmCustomers: Dispatch<SetStateAction<any[]>>;
  setInstances: Dispatch<SetStateAction<any[]>>;
  setHasInstances: Dispatch<SetStateAction<boolean | null>>;
}

/**
 * Faz o fetch inicial (utilizador, contactos, fases, catálogo, clientes, instâncias)
 * e tenta restaurar o último contacto aberto a partir de `localStorage`.
 */
export function useInitialWhatsappData({
  setContacts,
  setActiveContact,
  setStages,
  setTicketCatalog,
  setCrmCustomers,
  setInstances,
  setHasInstances,
}: UseInitialDataArgs) {
  useEffect(() => {
    const run = async () => {
      try {
        const [me, contactsData, stagesData, catData, customersData] = await Promise.all([
          apiRequest<{ id?: string }>('/users/me').catch(() => null),
          apiRequest<unknown[]>('/whatsapp/contacts').catch(() => [] as unknown[]),
          apiRequest<Stage[]>('/tickets/stages').catch(() => [] as Stage[]),
          apiRequest<TicketCatalogOptions>('/ticket-catalog').catch(() => null),
          apiRequest<any[]>('/customers').catch(() => [] as any[]),
        ]);

        const rawList = Array.isArray(contactsData) ? contactsData : [];
        const formattedContacts = rawList.map((c) => mapWhatsappContactApiRow(c as Record<string, unknown>));
        setContacts(formattedContacts);

        const savedNumber = localStorage.getItem('lastActiveContact');
        if (savedNumber) {
          const foundContact = formattedContacts.find((c: Contact) => c.number === savedNumber);
          if (foundContact) setActiveContact(foundContact);
        }

        setStages(stagesData ?? []);
        setTicketCatalog(catData ?? null);
        setCrmCustomers(customersData ?? []);

        if (me?.id) {
          const fetchedInstances =
            (await apiRequest<any[]>(`/instances/user/${me.id}`).catch(() => [] as any[])) ?? [];
          const connected = fetchedInstances.filter((i: any) => i.status === 'connected');
          setInstances(connected);
          setHasInstances(connected.length > 0);
        } else {
          setHasInstances(false);
        }
      } catch {
        setHasInstances(false);
      }
    };
    void run();
    // intencionalmente sem deps: corre apenas uma vez ao montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
