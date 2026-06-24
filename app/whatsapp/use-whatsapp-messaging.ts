'use client';

import { useState } from 'react';
import type { Contact, Message } from '@/components/whatsapp/types';
import { useWhatsappMedia } from './use-whatsapp-media';
import { useWhatsappSend } from './use-whatsapp-send';

interface Args {
  activeContact: Contact | null;
  selectedInstance: string;
  setChatHistory: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  showFeedback: (type: 'success' | 'error', msg: string) => void;
}

/**
 * Texto, mídia directa, pré-visualização de ficheiro, cancelamento de upload em curso,
 * e optimismo no histórico + lista de contactos.
 */
export function useWhatsappMessaging({
  activeContact,
  selectedInstance,
  setChatHistory,
  setContacts,
  showFeedback,
}: Args) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const media = useWhatsappMedia({
    activeContact,
    selectedInstance,
    setChatHistory,
    setContacts,
    showFeedback,
    setIsSending,
  });

  const send = useWhatsappSend({
    activeContact,
    selectedInstance,
    setChatHistory,
    setContacts,
    showFeedback,
    inputText,
    setInputText,
    isSending,
    setIsSending,
    previewFile: media.previewFile,
    sendDirectMedia: media.sendDirectMedia,
    cancelPreview: media.cancelPreview,
    fileInputRef: media.fileInputRef,
    setPreviewFile: media.setPreviewFile,
    setPreviewUrl: media.setPreviewUrl,
  });

  return {
    inputText,
    setInputText,
    isSending,
    previewFile: media.previewFile,
    previewUrl: media.previewUrl,
    fileInputRef: media.fileInputRef,
    handleFileUpload: media.handleFileUpload,
    cancelPreview: media.cancelPreview,
    sendDirectMedia: media.sendDirectMedia,
    handleSendMessage: send.handleSendMessage,
    cancelMediaSend: media.cancelMediaSend,
  } as const;
}
