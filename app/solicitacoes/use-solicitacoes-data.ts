'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Contact, Stage } from '@/components/solicitacoes/types';
import { apiRequest, getApiBaseUrl } from '@/lib/api-client';
import {
  broadcastReminderBadgeFromStages,
  computeReminderGreenRedByTicketId,
  extractTasksDueCalendarToday,
  SOLICITACOES_BOARD_SYNC_EVENT,
} from '@/lib/solicitacoes-reminders';

export function useSolicitacoesData() {
  const baseUrl = useMemo(() => getApiBaseUrl(), []);
  const [stages, setStages] = useState<Stage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBoardData = useCallback(async (): Promise<Stage[] | null> => {
    try {
      const data = await apiRequest<Stage[]>('/tickets/board');
      const next = Array.isArray(data) ? data : [];
      setStages(next);
      return next;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, []);

  const fetchContactsData = useCallback(async () => {
    try {
      const data = await apiRequest<Contact[]>('/whatsapp/contacts');
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchContactsData(), fetchBoardData()]);
    setIsLoading(false);
  }, [fetchBoardData, fetchContactsData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    const onBoardSync = (e: Event) => {
      const d = (e as CustomEvent<Stage[]>).detail;
      if (Array.isArray(d)) setStages(d);
    };
    window.addEventListener(SOLICITACOES_BOARD_SYNC_EVENT, onBoardSync as EventListener);
    return () => window.removeEventListener(SOLICITACOES_BOARD_SYNC_EVENT, onBoardSync as EventListener);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    broadcastReminderBadgeFromStages(stages);
  }, [stages, isLoading]);

  const tasksDueToday = useMemo(() => extractTasksDueCalendarToday(stages), [stages]);

  const { greenByTicketId, redByTicketId } = useMemo(
    () => computeReminderGreenRedByTicketId(stages),
    [stages],
  );

  const filteredStages = useMemo(
    () =>
      stages.map((stage) => ({
        ...stage,
        tickets: stage.tickets.filter((t) => {
          if (!searchTerm) return true;
          const lowerSearch = searchTerm.toLowerCase();
          return (
            t.contact?.name?.toLowerCase().includes(lowerSearch) ||
            t.contactNumber.includes(lowerSearch) ||
            t.marca?.toLowerCase().includes(lowerSearch) ||
            t.modelo?.toLowerCase().includes(lowerSearch) ||
            t.customerType?.toLowerCase().includes(lowerSearch) ||
            t.ticketType?.toLowerCase().includes(lowerSearch)
          );
        }),
      })),
    [stages, searchTerm],
  );

  return {
    baseUrl,
    stages,
    setStages,
    contacts,
    isLoading,
    searchTerm,
    setSearchTerm,
    fetchBoardData,
    tasksDueToday,
    greenByTicketId,
    redByTicketId,
    filteredStages,
  };
}
