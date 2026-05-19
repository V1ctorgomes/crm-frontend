'use client';

import React, { useState } from 'react';
import type { Ticket } from './types';
import { TicketSidebarHeader } from './ticket-details/TicketSidebarHeader';
import { TicketSidebarInfo } from './ticket-details/TicketSidebarInfo';
import { TicketSidebarEditForm } from './ticket-details/TicketSidebarEditForm';
import { TicketTabsNav, type TicketDetailsTab } from './ticket-details/TicketTabsNav';
import { TicketTasksTab } from './ticket-details/TicketTasksTab';
import { TicketNotesTab } from './ticket-details/TicketNotesTab';
import { TicketFilesTab } from './ticket-details/TicketFilesTab';
import { useTicketEditForm } from './ticket-details/use-ticket-edit-form';

interface TicketDetailsModalProps {
  ticket: Ticket;
  baseUrl: string;
  initialTab?: TicketDetailsTab;
  onClose: () => void;
  onTicketUpdated: () => void;
  onCloseTicketRequest: () => void;
  showFeedback: (type: 'success' | 'error', msg: string) => void;
  setConfirmModal: (modal: any) => void;
}

/**
 * Modal de detalhes da OS — orquestra a coluna lateral (info/edição) e as três abas
 * (Lembretes/Notas/Anexos). Lógica de cada bloco vive em `./ticket-details/*`.
 */
export function TicketDetailsModal({ 
  ticket,
  initialTab = 'tasks',
  onClose,
  onTicketUpdated,
  onCloseTicketRequest,
  showFeedback,
  setConfirmModal,
}: TicketDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TicketDetailsTab>(initialTab);
  const editBag = useTicketEditForm({ ticket, onTicketUpdated, showFeedback });

  const tabsProps = { ticket, onTicketUpdated, showFeedback, setConfirmModal };

  return (
    <div
      className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-5xl h-[85vh] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Lateral: dados do cliente e da OS */}
        <div className="w-full md:w-[300px] bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 min-h-0 max-h-[min(44vh,380px)] md:max-h-none">
          <TicketSidebarHeader ticket={ticket} />

          <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-5 min-h-0">
            {!editBag.editing ? (
              <TicketSidebarInfo ticket={ticket} onEdit={editBag.startEditing} />
            ) : (
              <TicketSidebarEditForm bag={editBag} />
            )}
          </div>

          <div className="p-4 border-t border-slate-200 bg-white shrink-0">
            {!ticket.isArchived ? (
              <button
                type="button"
                onClick={onCloseTicketRequest}
                className="w-full flex items-center justify-center gap-2 text-white bg-brand-600 hover:bg-brand-700 py-2.5 rounded-md text-sm font-medium transition-colors"
              >
                Encerrar Solicitação
             </button>
            ) : (
              <p className="text-center text-xs text-slate-500">Solicitação encerrada — edição não disponível.</p>
            )}
          </div>
        </div>

        {/* Painel Principal (Abas) */}
        <div className="flex-1 flex flex-col bg-white w-full overflow-hidden">
          <TicketTabsNav ticket={ticket} active={activeTab} onChange={setActiveTab} onClose={onClose} />

          {activeTab === 'tasks' ? (
            <TicketTasksTab {...tabsProps} />
          ) : activeTab === 'notes' ? (
            <TicketNotesTab {...tabsProps} />
          ) : (
            <TicketFilesTab {...tabsProps} />
          )}
        </div>
      </div>
    </div>
  );
}
