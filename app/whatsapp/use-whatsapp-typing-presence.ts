'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { Contact } from '@/components/whatsapp/types';
import { apiRequest } from '@/lib/api-client';

/** Renova o «digitando…» antes de expirar na Evolution (~5,5 s por pulso). */
const REFRESH_MS = 4000;
/** Sem teclas neste tempo → deixa de sinalizar. */
const IDLE_MS = 2800;

function resolveInstance(c: Contact | null, selectedInstance: string) {
  return c?.instanceName || (selectedInstance !== 'ALL' ? selectedInstance : undefined);
}

type Args = {
  activeContact: Contact | null;
  selectedInstance: string;
  inputText: string;
  isRecording: boolean;
  isSending: boolean;
};

/**
 * Envia «digitando…» / «a gravar…» para o WhatsApp do contacto enquanto o atendente escreve,
 * como no app nativo — não só no clique em Enviar.
 */
export function useWhatsappTypingPresence({
  activeContact,
  selectedInstance,
  inputText,
  isRecording,
  isSending,
}: Args) {
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    idleTimerRef.current = null;
    refreshTimerRef.current = null;
    recordingTimerRef.current = null;
    activeRef.current = false;
  }, []);

  const pulsePresence = useCallback(
    async (presence: 'composing' | 'recording') => {
      if (!activeContact) return;
      try {
        await apiRequest('/whatsapp/presence', {
          method: 'POST',
          body: JSON.stringify({
            number: activeContact.number,
            presence,
            instanceName: resolveInstance(activeContact, selectedInstance),
          }),
        });
      } catch {
        /* falha silenciosa — não bloquear o chat */
      }
    },
    [activeContact, selectedInstance],
  );

  const stopComposing = useCallback(() => {
    clearTimers();
  }, [clearTimers]);

  const bumpIdle = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      stopComposing();
    }, IDLE_MS);
  }, [stopComposing]);

  const startComposing = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    void pulsePresence('composing');
    refreshTimerRef.current = setInterval(() => {
      void pulsePresence('composing');
    }, REFRESH_MS);
  }, [pulsePresence]);

  // Gravação de áudio → «a gravar áudio…»
  useEffect(() => {
    if (!activeContact || isSending || !isRecording) {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      return;
    }
    stopComposing();
    void pulsePresence('recording');
    recordingTimerRef.current = setInterval(() => {
      void pulsePresence('recording');
    }, REFRESH_MS);
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    };
  }, [activeContact, isRecording, isSending, pulsePresence, stopComposing]);

  // Texto no campo → «digitando…»
  useEffect(() => {
    if (!activeContact || isSending || isRecording) {
      stopComposing();
      return;
    }

    const trimmed = inputText.trim();
    if (!trimmed) {
      stopComposing();
      return;
    }

    if (!activeRef.current) {
      startComposing();
    }
    bumpIdle();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [
    inputText,
    activeContact,
    isSending,
    isRecording,
    startComposing,
    bumpIdle,
    stopComposing,
  ]);

  useEffect(() => {
    return () => stopComposing();
  }, [activeContact?.number, stopComposing]);
}
