'use client';

import { useCallback, useRef, useState } from 'react';
import type { Contact, Message } from '@/components/whatsapp/types';
import { apiRequest } from '@/lib/api-client';
import { scheduleMessageDeliveredUi } from './utils';

interface Args {
  activeContact: Contact | null;
  selectedInstance: string;
  setChatHistory: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  showFeedback: (type: 'success' | 'error', msg: string) => void;
}

function resolveInstance(c: Contact | null, selectedInstance: string) {
  return c?.instanceName || (selectedInstance !== 'ALL' ? selectedInstance : undefined);
}

/**
 * Texto, mídia directa, pré-visualização de ficheiro, cancelamento de upload em curso,
 * e optimismo no histórico + lista de contactos.
 */
export function useWhatsappMessaging({
  activeContact,
  selectedInstance,
  chatHistoryRef,
  setChatHistory,
  setContacts,
  showFeedback,
}: Args) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
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
    setInputText('');
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

      setContacts((prev) => {
        const idx = prev.findIndex((c) => c.number === targetNumber);
        const updated = [...prev];
        if (idx !== -1) {
          let fallbackText = 'Documento';
          if (file.type.startsWith('image/')) fallbackText = 'Imagem';
          else if (file.type.startsWith('video/')) fallbackText = 'Vídeo';
          else if (file.type.startsWith('audio/')) fallbackText = 'Áudio';
          updated[idx].lastMessage = caption || fallbackText;
          updated[idx].lastMessageTime = timeNow;
          if (targetInstance) updated[idx].instanceName = targetInstance;
          const item = updated.splice(idx, 1)[0];
          updated.unshift(item);
        }
        return updated;
      });

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
    [activeContact, selectedInstance, setChatHistory, setContacts, showFeedback],
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

  const handleSendMessage = useCallback(
    async (e?: React.FormEvent, opts?: { isRecording?: boolean }) => {
      if (e) e.preventDefault();
      if (opts?.isRecording || isSending || !activeContact) return;
      const textToSend = inputText;
      const preview = previewFile;
      if (!textToSend.trim() && !preview) return;

      const targetNumber = activeContact.number;
      const targetInstance = resolveInstance(activeContact, selectedInstance);

      if (preview) {
        setInputText('');
        setPreviewFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setPreviewUrl((url) => {
          if (url) URL.revokeObjectURL(url);
          return null;
        });
        await sendDirectMedia(preview, textToSend);
        return;
      }

      const now = new Date();
      const timeNow = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const sentAtIso = now.toISOString();
      setIsSending(true);
      const tempId = Date.now();
      const optimisticMsg: Message = {
        id: tempId,
        text: textToSend,
        type: 'sent',
        time: timeNow,
        sentAt: sentAtIso,
        fromMe: true,
        senderNumber: targetNumber,
        sendStatus: 'sending',
      };

      setChatHistory((prev) => ({ ...prev, [targetNumber]: [...(prev[targetNumber] || []), optimisticMsg] }));

      setContacts((prev) => {
        const idx = prev.findIndex((c) => c.number === targetNumber);
        const updated = [...prev];
        if (idx !== -1) {
          updated[idx].lastMessage = textToSend;
          updated[idx].lastMessageTime = timeNow;
          if (targetInstance) updated[idx].instanceName = targetInstance;
          const item = updated.splice(idx, 1)[0];
          updated.unshift(item);
        }
        return updated;
      });

      setInputText('');

      try {
        const res = await apiRequest<{ messageId?: string }>('/whatsapp/send', {
          method: 'POST',
          body: JSON.stringify({ number: targetNumber, text: textToSend, instanceName: targetInstance }),
        });
        const newId = res?.messageId ?? tempId;
        setChatHistory((prev) => ({
          ...prev,
          [targetNumber]: (prev[targetNumber] || []).map((m) =>
            m.id === tempId
              ? { ...m, ...(res?.messageId ? { id: res.messageId } : {}), sendStatus: 'sent' as const }
              : m,
          ),
        }));
        scheduleMessageDeliveredUi(setChatHistory, targetNumber, newId);
      } catch {
        showFeedback('error', 'Erro de conexão.');
        setChatHistory((prev) => ({
          ...prev,
          [targetNumber]: (prev[targetNumber] || []).filter((m) => m.id !== tempId),
        }));
      } finally {
        setIsSending(false);
      }
    },
    [
      activeContact,
      inputText,
      isSending,
      previewFile,
      selectedInstance,
      sendDirectMedia,
      setChatHistory,
      setContacts,
      showFeedback,
    ],
  );

  return {
    inputText,
    setInputText,
    isSending,
    previewFile,
    previewUrl,
    fileInputRef,
    handleFileUpload,
    cancelPreview,
    sendDirectMedia,
    handleSendMessage,
    cancelMediaSend,
  } as const;
}
