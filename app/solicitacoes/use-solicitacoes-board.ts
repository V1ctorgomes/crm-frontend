'use client';

import { useState, useCallback } from 'react';
import type { Ticket } from '@/components/solicitacoes/types';
import { useSolicitacoesData } from './use-solicitacoes-data';
import { useSolicitacoesActions } from './use-solicitacoes-actions';

export type ConfirmModalState = {
  title: string;
  message: string;
  onConfirm: (deleteReason?: string) => void | Promise<void>;
  onClose: () => void;
} | null;

export function useSolicitacoesBoard() {
  const data = useSolicitacoesData();

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

  const actions = useSolicitacoesActions({
    setStages: data.setStages,
    activeTicket,
    setActiveTicket,
    fetchBoardData: data.fetchBoardData,
    showFeedback,
    setIsCloseModalOpen,
  });

  return {
    baseUrl: data.baseUrl,
    stages: data.stages,
    contacts: data.contacts,
    isLoading: data.isLoading,
    searchTerm: data.searchTerm,
    setSearchTerm: data.setSearchTerm,
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
    fetchBoardData: data.fetchBoardData,
    tasksDueToday: data.tasksDueToday,
    greenByTicketId: data.greenByTicketId,
    redByTicketId: data.redByTicketId,
    handleTicketUpdated: actions.handleTicketUpdated,
    handleDragStart: actions.handleDragStart,
    handleDragOver: actions.handleDragOver,
    handleDrop: actions.handleDrop,
    handleCloseTicketConfirm: actions.handleCloseTicketConfirm,
    filteredStages: data.filteredStages,
  };
}

export type SolicitacoesBoardViewModel = ReturnType<typeof useSolicitacoesBoard>;
