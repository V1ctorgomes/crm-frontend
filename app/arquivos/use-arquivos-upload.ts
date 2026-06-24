'use client';

import { useRef, useState } from 'react';
import type { TicketFolder } from '@/components/arquivos/types';
import { apiRequest } from '@/lib/api-client';

export function useArquivosUpload(
  selectedTicket: TicketFolder | null,
  fetchFolders: () => Promise<void>,
  showFeedback: (type: 'success' | 'error', message: string) => void,
) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showFeedback('error', 'Arquivo muito grande (máx 15MB).');
      return;
    }
    setPendingFile(file);
    setFileDescription('');
  };

  const confirmUpload = async () => {
    if (!pendingFile || !selectedTicket) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', pendingFile);
    if (fileDescription.trim()) formData.append('description', fileDescription.trim());

    try {
      await apiRequest(`/tickets/${selectedTicket.id}/files`, {
        method: 'POST',
        body: formData,
      });

      setPendingFile(null);
      setFileDescription('');
      await fetchFolders();
      showFeedback('success', 'Arquivo anexado com sucesso!');
    } catch {
      showFeedback('error', 'Erro de conexão ao enviar.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const cancelUpload = () => {
    setPendingFile(null);
    setFileDescription('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return {
    pendingFile,
    setPendingFile,
    fileDescription,
    setFileDescription,
    isUploading,
    fileInputRef,
    handleFileSelect,
    cancelUpload,
    confirmUpload,
  };
}
