'use client';

import { useState } from 'react';
import { apiDelete } from '@/lib/api-client';

type ConfirmModal = {
  title: string;
  message: string;
  onConfirm: (deleteReason?: string) => void | Promise<void>;
};

export function useArquivosDelete(
  fetchFolders: () => Promise<void>,
  showFeedback: (type: 'success' | 'error', message: string) => void,
  selectedTicket: { id: string } | null,
  setSelectedTicket: (t: null) => void,
) {
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null);

  const handleDeleteFile = async (fileId: string) => {
    setConfirmModal({
      title: 'Apagar Arquivo?',
      message: 'Tem a certeza que deseja apagar este ficheiro? Ação irreversível.',
      onConfirm: async (deleteReason?: string) => {
        try {
          await apiDelete(`/tickets/files/${fileId}`, deleteReason);
          await fetchFolders();
          showFeedback('success', 'Ficheiro apagado com sucesso.');
        } catch {
          showFeedback('error', 'Erro de conexão.');
        }
        setConfirmModal(null);
      },
    });
  };

  const handleDeleteTicket = async (ticketId: string) => {
    setConfirmModal({
      title: 'Excluir Solicitação?',
      message:
        '⚠️ Tem a certeza que deseja EXCLUIR PERMANENTEMENTE esta solicitação e todos os seus ficheiros? Esta ação não pode ser desfeita.',
      onConfirm: async (deleteReason?: string) => {
        try {
          await apiDelete(`/tickets/${ticketId}`, deleteReason);
          if (selectedTicket?.id === ticketId) setSelectedTicket(null);
          await fetchFolders();
          showFeedback('success', 'OS excluída com sucesso.');
        } catch {
          showFeedback('error', 'Erro de conexão ao excluir.');
        }
        setConfirmModal(null);
      },
    });
  };

  return {
    confirmModal,
    setConfirmModal,
    handleDeleteFile,
    handleDeleteTicket,
  };
}
