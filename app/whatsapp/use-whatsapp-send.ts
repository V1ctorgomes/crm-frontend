'use client';

import { useCallback } from 'react';
import type { Message } from '@/components/whatsapp/types';
import { apiRequest } from '@/lib/api-client';
import { scheduleMessageDeliveredUi } from './utils';
import { bumpContactInList, resolveInstance, type WhatsappMessagingArgs } from './whatsapp-messaging-shared';

interface SendHookArgs extends WhatsappMessagingArgs {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  isSending: boolean;
  setIsSending: React.Dispatch<React.SetStateAction<boolean>>;
  previewFile: File | null;
  sendDirectMedia: (file: File, caption: string) => Promise<void>;
  cancelPreview: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setPreviewFile: React.Dispatch<React.SetStateAction<File | null>>;
  setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useWhatsappSend({
  activeContact,
  selectedInstance,
  setChatHistory,
  setContacts,
  showFeedback,
  inputText,
  setInputText,
  isSending,
  setIsSending,
  previewFile,
  sendDirectMedia,
  cancelPreview,
  fileInputRef,
  setPreviewFile,
  setPreviewUrl,
}: SendHookArgs) {
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
      bumpContactInList(setContacts, targetNumber, textToSend, timeNow, targetInstance);
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
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro de conexão.';
        showFeedback('error', msg);
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
      fileInputRef,
      inputText,
      isSending,
      previewFile,
      selectedInstance,
      sendDirectMedia,
      setChatHistory,
      setContacts,
      setInputText,
      setIsSending,
      setPreviewFile,
      setPreviewUrl,
      showFeedback,
    ],
  );

  return { handleSendMessage } as const;
}
