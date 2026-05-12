'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { Toast } from '@/components/ui/toast';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { KanbanHeader } from '@/components/solicitacoes/KanbanHeader';
import { KanbanBoard } from '@/components/solicitacoes/KanbanBoard';
import { NewTicketModal } from '@/components/solicitacoes/NewTicketModal';
import { TicketDetailsModal } from '@/components/solicitacoes/TicketDetailsModal';
import { CloseTicketModal } from '@/components/solicitacoes/CloseTicketModal';
import { StageManagerModal } from '@/components/solicitacoes/StageManagerModal';
import { ArchivedTicketsModal } from '@/components/solicitacoes/ArchivedTicketsModal';
import { Contact, Stage, Ticket } from '@/components/solicitacoes/types';
import { apiRequest } from '@/lib/api-client';
import {
  broadcastReminderBadgeFromStages,
  computeReminderGreenRedByTicketId,
  extractTasksDueCalendarToday,
  SOLICITACOES_BOARD_SYNC_EVENT,
} from '@/lib/solicitacoes-reminders';

export default function SolicitacoesPage() {
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

  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void; onClose: () => void; } | null>(null);

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const fetchBoardData = async () => {
    try {
      const data = await apiRequest('/tickets/board');
      setStages(data);
      return data;
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  const fetchContactsData = async () => {
    try {
      const data = await apiRequest('/whatsapp/contacts');
      setContacts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchContactsData(),
      fetchBoardData(),
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleTicketUpdated = async () => {
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
  };

  const handleDragStart = (e: React.DragEvent, ticketId: string, sourceStageId: string) => {
    e.dataTransfer.setData('ticketId', ticketId);
    e.dataTransfer.setData('sourceStageId', sourceStageId);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
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
    } catch (err) {
      fetchBoardData();
    }
  };

  const handleCloseTicketConfirm = async (resolution: 'SUCCESS' | 'CANCELLED', reason: string) => {
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
    } catch (err) {
      showFeedback('error', 'Erro ao encerrar OS.');
    }
  };

  const filteredStages = stages.map((stage) => ({
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
  }));

  return (
    <div className="flex h-screen overflow-hidden bg-brand-canvas font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden">
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onDismiss={() => setToast(null)}
          />
        )}

        <KanbanHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          pendingTasks={tasksDueToday}
          onTaskClick={(ticket) => {
            setActiveTicket(ticket);
            setInitialTab('tasks');
          }}
          onOpenArchive={() => setIsArchivedModalOpen(true)}
          onOpenStageManager={() => setIsStageManagerOpen(true)}
          onOpenNewTicket={() => setIsNewTicketModalOpen(true)}
        />

        <KanbanBoard
          isLoading={isLoading}
          filteredStages={filteredStages}
          searchTerm={searchTerm}
          reminderGreenByTicketId={greenByTicketId}
          reminderRedByTicketId={redByTicketId}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onTicketClick={(ticket) => {
            setActiveTicket(ticket);
            setInitialTab('tasks');
          }}
        />
      </main>

      {isNewTicketModalOpen && (
        <NewTicketModal
          contacts={contacts}
          stages={stages}
          baseUrl={baseUrl}
          onClose={() => setIsNewTicketModalOpen(false)}
          onSuccess={() => {
            setIsNewTicketModalOpen(false);
            fetchBoardData();
          }}
          showFeedback={showFeedback}
        />
      )}

      {activeTicket && (
        <TicketDetailsModal
          ticket={activeTicket}
          baseUrl={baseUrl}
          initialTab={initialTab}
          onClose={() => setActiveTicket(null)}
          onTicketUpdated={handleTicketUpdated}
          onCloseTicketRequest={() => setIsCloseModalOpen(true)}
          showFeedback={showFeedback}
          setConfirmModal={setConfirmModal}
        />
      )}

      {isCloseModalOpen && (
        <CloseTicketModal onClose={() => setIsCloseModalOpen(false)} onConfirm={handleCloseTicketConfirm} />
      )}

      {isStageManagerOpen && (
        <StageManagerModal
          baseUrl={baseUrl}
          onClose={() => setIsStageManagerOpen(false)}
          onStagesChanged={fetchBoardData}
          showFeedback={showFeedback}
          setConfirmModal={setConfirmModal}
        />
      )}

      {isArchivedModalOpen && (
        <ArchivedTicketsModal
          baseUrl={baseUrl}
          onClose={() => setIsArchivedModalOpen(false)}
          onRestoreSuccess={fetchBoardData}
          showFeedback={showFeedback}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onClose={confirmModal.onClose}
        />
      )}
    </div>
  );
}
