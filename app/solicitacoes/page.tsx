'use client';

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
import { useSolicitacoesBoard } from './use-solicitacoes-board';

export default function SolicitacoesPage() {
  const b = useSolicitacoesBoard();

  return (
    <div className="flex h-screen overflow-hidden bg-brand-canvas font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full relative overflow-hidden">
        {b.toast && (
          <Toast
            type={b.toast.type}
            message={b.toast.message}
            onDismiss={() => b.setToast(null)}
          />
        )}

        <KanbanHeader
          searchTerm={b.searchTerm}
          setSearchTerm={b.setSearchTerm}
          pendingTasks={b.tasksDueToday}
          onTaskClick={(ticket) => {
            b.setActiveTicket(ticket);
            b.setInitialTab('tasks');
          }}
          onOpenArchive={() => b.setIsArchivedModalOpen(true)}
          onOpenStageManager={() => b.setIsStageManagerOpen(true)}
          onOpenNewTicket={() => b.setIsNewTicketModalOpen(true)}
        />

        <KanbanBoard
          isLoading={b.isLoading}
          filteredStages={b.filteredStages}
          searchTerm={b.searchTerm}
          reminderGreenByTicketId={b.greenByTicketId}
          reminderRedByTicketId={b.redByTicketId}
          onDragStart={b.handleDragStart}
          onDragOver={b.handleDragOver}
          onDrop={b.handleDrop}
          onTicketClick={(ticket) => {
            b.setActiveTicket(ticket);
            b.setInitialTab('tasks');
          }}
        />
      </main>

      {b.isNewTicketModalOpen && (
        <NewTicketModal
          contacts={b.contacts}
          stages={b.stages}
          baseUrl={b.baseUrl}
          onClose={() => b.setIsNewTicketModalOpen(false)}
          onSuccess={() => {
            b.setIsNewTicketModalOpen(false);
            void b.fetchBoardData();
          }}
          showFeedback={b.showFeedback}
        />
      )}

      {b.activeTicket && (
        <TicketDetailsModal
          ticket={b.activeTicket}
          baseUrl={b.baseUrl}
          initialTab={b.initialTab}
          onClose={() => b.setActiveTicket(null)}
          onTicketUpdated={b.handleTicketUpdated}
          onCloseTicketRequest={() => b.setIsCloseModalOpen(true)}
          showFeedback={b.showFeedback}
          setConfirmModal={b.setConfirmModal}
        />
      )}

      {b.isCloseModalOpen && (
        <CloseTicketModal
          onClose={() => b.setIsCloseModalOpen(false)}
          onConfirm={b.handleCloseTicketConfirm}
        />
      )}

      {b.isStageManagerOpen && (
        <StageManagerModal
          baseUrl={b.baseUrl}
          onClose={() => b.setIsStageManagerOpen(false)}
          onStagesChanged={b.fetchBoardData}
          showFeedback={b.showFeedback}
          setConfirmModal={b.setConfirmModal}
        />
      )}

      {b.isArchivedModalOpen && (
        <ArchivedTicketsModal
          baseUrl={b.baseUrl}
          onClose={() => b.setIsArchivedModalOpen(false)}
          onRestoreSuccess={b.fetchBoardData}
          showFeedback={b.showFeedback}
        />
      )}

      {b.confirmModal && (
        <ConfirmModal
          title={b.confirmModal.title}
          message={b.confirmModal.message}
          onConfirm={b.confirmModal.onConfirm}
          onClose={b.confirmModal.onClose}
        />
      )}
    </div>
  );
}
