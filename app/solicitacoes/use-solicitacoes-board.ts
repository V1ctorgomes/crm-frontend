'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Contact, Stage, Ticket } from '@/components/solicitacoes/types';
import { apiRequest, getApiBaseUrl } from '@/lib/api-client';
import {
  broadcastReminderBadgeFromStages,
  computeReminderGreenRedByTicketId,
  extractTasksDueCalendarToday,
  SOLICITACOES_BOARD_SYNC_EVENT,
} from '@/lib/solicitacoes-reminders';

export type ConfirmModalState = {
  title: string;
  message: string;
  onConfirm: (deleteReason?: string) => void | Promise<void>;
  onClose: () => void;
} | null;

export function useSolicitacoesBoard() {
  const baseUrl = useMemo(() => getApiBaseUrl(), []);
  const [stages, setStages] = useState<Stage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [initialTab, setInitialTab] = useState<'tasks' | 'notes' | 'files'>('tasks');
  const [isStageManagerOpen, setIsStageManagerOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(null);

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

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

  const handleTicketUpdated = useCallback(async () => {
    const boardData = await fetchBoardData();
    if (activeTicket && boardData) {
      for (const stage of boardData) {
        const found = stage.tickets.find((t: Ticket) => t.id === activeTicket.id);
        if (found) {
          setActiveTicket(found);
          return;
        }
      }
    }
  }, [activeTicket, fetchBoardData]);

  const handleDragStart = useCallback((e: React.DragEvent, ticketId: string, sourceStageId: string) => {
    e.dataTransfer.setData('ticketId', ticketId);
    e.dataTransfer.setData('sourceStageId', sourceStageId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetStageId: string) => {
      e.preventDefault();
      const ticketId = e.dataTransfer.getData('ticketId');
      const sourceStageId = e.dataTransfer.getData('sourceStageId');
      if (sourceStageId === targetStageId) return;

      setStages((prev) => {
        const newStages = [...prev];
        const sourceStage = newStages.find((s) => s.id === sourceStageId);
        const targetStage = newStages.find((s) => s.id === targetStageId);
        if (sourceStage && targetStage) {
          const ticketIndex = sourceStage.tickets.findIndex((t) => t.id === ticketId);
          if (ticketIndex !== -1) {
            const [ticket] = sourceStage.tickets.splice(ticketIndex, 1);
            targetStage.tickets.unshift(ticket);
          }
        }
        return newStages;
      });

      try {
        await apiRequest(`/tickets/${ticketId}/stage`, {
          method: 'PUT',
          body: JSON.stringify({ stageId: targetStageId }),
        });
      } catch {
        void fetchBoardData();
      }
    },
    [fetchBoardData],
  );

  const handleCloseTicketConfirm = useCallback(
    async (resolution: 'SUCCESS' | 'CANCELLED', reason: string) => {
      if (!activeTicket) return;
      try {
        await apiRequest(`/tickets/${activeTicket.id}/archive`, {
          method: 'PUT',
          body: JSON.stringify({ isArchived: true, resolution, resolutionReason: reason }),
        });
        setActiveTicket(null);
        setIsCloseModalOpen(false);
        await fetchBoardData();
        showFeedback('success', 'OS encerrada e enviada para o Histórico.');
      } catch {
        showFeedback('error', 'Erro ao encerrar OS.');
      }
    },
    [activeTicket, fetchBoardData, showFeedback],
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
    contacts,
    isLoading,
    searchTerm,
    setSearchTerm,
    isNewTicketModalOpen,
    setIsNewTicketModalOpen,
    activeTicket,
    setActiveTicket,
    initialTab,
    setInitialTab,
    isStageManagerOpen,
    setIsStageManagerOpen,
    isCloseModalOpen,
    setIsCloseModalOpen,
    isArchivedModalOpen,
    setIsArchivedModalOpen,
    toast,
    setToast,
    confirmModal,
    setConfirmModal,
    showFeedback,
    fetchBoardData,
    tasksDueToday,
    greenByTicketId,
    redByTicketId,
    handleTicketUpdated,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleCloseTicketConfirm,
    filteredStages,
  };
}

export type SolicitacoesBoardViewModel = ReturnType<typeof useSolicitacoesBoard>;
