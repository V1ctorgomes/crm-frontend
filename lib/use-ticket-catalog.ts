'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import type { TicketCatalogOptions } from '@/lib/ticket-catalog-types';

/**
 * Faz fetch ao catálogo de OS (`/ticket-catalog`) e expõe um estado de carregamento
 * e o flag `ready` (true sse existir pelo menos um item em cada lista). Usado por
 * todos os ecrãs que renderizam os 4 selects de catálogo.
 */
export function useTicketCatalog() {
  const [catalog, setCatalog] = useState<TicketCatalogOptions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = (await apiRequest('/ticket-catalog')) as TicketCatalogOptions;
        if (!cancelled) setCatalog(data);
      } catch {
        if (!cancelled) setCatalog(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = Boolean(
    catalog &&
      catalog.MARCA.length > 0 &&
      catalog.MODELO.length > 0 &&
      catalog.CUSTOMER_TYPE.length > 0 &&
      catalog.TICKET_TYPE.length > 0,
  );

  return { catalog, loading, ready } as const;
}
