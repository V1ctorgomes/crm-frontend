'use client';

import { useState } from 'react';
import { useArquivosDelete } from './use-arquivos-delete';
import { useArquivosFolders } from './use-arquivos-folders';
import { useArquivosUpload } from './use-arquivos-upload';

export function useArquivosPage() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const onFetchError = () => showFeedback('error', 'Erro ao carregar arquivos da nuvem.');
  const folders = useArquivosFolders(onFetchError);
  const fetchWithFeedback = folders.fetchFolders;

  const upload = useArquivosUpload(folders.selectedTicket, fetchWithFeedback, showFeedback);
  const deletions = useArquivosDelete(
    fetchWithFeedback,
    showFeedback,
    folders.selectedTicket,
    () => folders.setSelectedTicket(null),
  );

  return {
    toast,
    setToast,
    ...deletions,
    ...folders,
    ...upload,
    handleDeleteTicket: deletions.handleDeleteTicket,
  };
}
