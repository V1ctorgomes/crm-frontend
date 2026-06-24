'use client';

import { useCallback } from 'react';
import type { Stage, Ticket } from '@/components/solicitacoes/types';
import { apiRequest } from '@/lib/api-client';
import { validateTicketResolutionReason } from '@/lib/ticket-resolution-validation';

interface ActionsArgs {
  setStages: React.Dispatch<React.SetStateAction<Stage[]>>;
  activeTicket: Ticket | null;
  setActiveTicket: React.Dispatch<React.SetStateAction<Ticket | null>>;
  fetchBoardData: () => Promise<Stage[] | null>;
  showFeedback: (type: 'success' | 'error', message: string) => void;
  setIsCloseModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useSolicitacoesActions({
  setStages,
  activeTicket,
  setActiveTicket,
  fetchBoardData,
  showFeedback,
  setIsCloseModalOpen,
}: ActionsArgs) {
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
  }, [activeTicket, fetchBoardData, setActiveTicket]);

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
    [fetchBoardData, setStages],
  );

  const handleCloseTicketConfirm = useCallback(
    async (resolution: 'SUCCESS' | 'CANCELLED', reason: string) => {
      if (!activeTicket) return;
      const checked = validateTicketResolutionReason(resolution, reason);
      if (!checked.ok) {
        showFeedback('error', checked.message);
        return;
      }
      try {
        await apiRequest(`/tickets/${activeTicket.id}/archive`, {
          method: 'PUT',
          body: JSON.stringify({
            isArchived: true,
            resolution,
            resolutionReason: checked.trimmed,
          }),
        });
        setActiveTicket(null);
        setIsCloseModalOpen(false);
        await fetchBoardData();
        showFeedback('success', 'OS encerrada e enviada para o Histórico.');
      } catch {
        showFeedback('error', 'Erro ao encerrar OS.');
      }
    },
    [activeTicket, fetchBoardData, setActiveTicket, setIsCloseModalOpen, showFeedback],
  );

  return {
    handleTicketUpdated,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleCloseTicketConfirm,
  };
}
