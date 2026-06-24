'use client';

import { useCallback, useRef, useState } from 'react';
import type { Message } from '@/components/whatsapp/types';
import { apiRequest } from '@/lib/api-client';
import { scheduleMessageDeliveredUi } from './utils';
import { bumpContactInList, resolveInstance, type WhatsappMessagingArgs } from './whatsapp-messaging-shared';

interface MediaHookArgs extends WhatsappMessagingArgs {
  setIsSending: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useWhatsappMedia({
  activeContact,
  selectedInstance,
  setChatHistory,
  setContacts,
  showFeedback,
  setIsSending,
}: MediaHookArgs) {
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingMediaAbortRef = useRef<AbortController | null>(null);
  const pendingMediaTempIdRef = useRef<number | null>(null);

  const cancelMediaSend = useCallback((messageId: string | number) => {
    if (pendingMediaTempIdRef.current !== null && pendingMediaTempIdRef.current === messageId) {
      pendingMediaAbortRef.current?.abort();
    }
  }, []);

  const cancelPreview = useCallback(() => {
    setPreviewUrl((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
    setPreviewFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const sendDirectMedia = useCallback(
    async (file: File, caption: string) => {
      if (!activeContact) return;
      const targetNumber = activeContact.number;
      const targetInstance = resolveInstance(activeContact, selectedInstance);
      const now = new Date();
      const timeNow = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const sentAtIso = now.toISOString();
      setIsSending(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('number', targetNumber);
      formData.append('caption', caption);
      if (targetInstance) formData.append('instanceName', targetInstance);

      const tempId = Date.now();
      const tempUrl = URL.createObjectURL(file);
      const optimisticMsg: Message = {
        id: tempId,
        text: caption || '',
        type: 'sent',
        time: timeNow,
        sentAt: sentAtIso,
        fromMe: true,
        senderNumber: targetNumber,
        isMedia: true,
        mediaData: tempUrl,
        mimeType: file.type,
        fileName: file.name,
        sendStatus: 'sending',
      };

      setChatHistory((prev) => ({ ...prev, [targetNumber]: [...(prev[targetNumber] || []), optimisticMsg] }));

      let fallbackText = 'Documento';
      if (file.type.startsWith('image/')) fallbackText = 'Imagem';
      else if (file.type.startsWith('video/')) fallbackText = 'Vídeo';
      else if (file.type.startsWith('audio/')) fallbackText = 'Áudio';
      bumpContactInList(setContacts, targetNumber, caption || fallbackText, timeNow, targetInstance);

      const ac = new AbortController();
      pendingMediaAbortRef.current = ac;
      pendingMediaTempIdRef.current = tempId;

      try {
        const savedData = await apiRequest<{
          messageId?: string;
          id?: string;
          mediaData?: string;
        }>('/whatsapp/send-media', { method: 'POST', body: formData, signal: ac.signal });
        if (!savedData?.mediaData) throw new Error('Resposta inválida do servidor.');
        const newId = savedData.messageId || savedData.id || tempId;
        setChatHistory((prev) => ({
          ...prev,
          [targetNumber]: (prev[targetNumber] || []).map((msg) => {
            if (msg.id !== tempId) return msg;
            if (typeof msg.mediaData === 'string' && msg.mediaData.startsWith('blob:')) {
              URL.revokeObjectURL(msg.mediaData);
            }
            return { ...msg, id: newId, mediaData: savedData.mediaData, sendStatus: 'sent' };
          }),
        }));
        scheduleMessageDeliveredUi(setChatHistory, targetNumber, newId);
      } catch (error) {
        const aborted =
          (typeof error === 'object' &&
            error !== null &&
            ((error as { name?: string }).name === 'AbortError' ||
              String((error as Error).message || '').includes('aborted'))) ||
          (error instanceof DOMException && error.name === 'AbortError');
        if (!aborted) {
          showFeedback('error', error instanceof Error ? error.message : 'Erro ao enviar arquivo.');
        }
        setChatHistory((prev) => {
          const list = prev[targetNumber] || [];
          const doomed = list.find((m) => m.id === tempId);
          if (doomed && typeof doomed.mediaData === 'string' && doomed.mediaData.startsWith('blob:')) {
            URL.revokeObjectURL(doomed.mediaData);
          }
          return { ...prev, [targetNumber]: list.filter((m) => m.id !== tempId) };
        });
      } finally {
        if (pendingMediaTempIdRef.current === tempId) pendingMediaTempIdRef.current = null;
        if (pendingMediaAbortRef.current === ac) pendingMediaAbortRef.current = null;
        setIsSending(false);
      }
    },
    [activeContact, selectedInstance, setChatHistory, setContacts, setIsSending, showFeedback],
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !activeContact) return;
      if (file.size > 15 * 1024 * 1024) {
        showFeedback('error', 'Arquivo muito grande (máx 15MB).');
        return;
      }
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      setPreviewFile(file);
    },
    [activeContact, showFeedback],
  );

  return {
    previewFile,
    previewUrl,
    fileInputRef,
    handleFileUpload,
    cancelPreview,
    sendDirectMedia,
    cancelMediaSend,
    setPreviewFile,
    setPreviewUrl,
  } as const;
}
