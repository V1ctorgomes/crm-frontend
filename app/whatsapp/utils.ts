import type { Dispatch, SetStateAction } from 'react';
import type { Contact, Message } from '@/components/whatsapp/types';
import { normalizeContactKind } from '@/lib/contact-kind';

/**
 * Preferir AAC em MP4 quando existir: reproduz no Safari/iOS e no CRM; WebM costuma ficar «mudo» no Safari.
 * Depois WebM/Opus (Chrome, Firefox, Edge).
 */
export function pickAudioRecordingMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = [
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
  ];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
}

export function audioFileExtensionFromMime(blobType: string): string {
  const t = blobType.toLowerCase();
  if (t.includes('mp4')) return 'm4a';
  if (t.includes('ogg')) return 'ogg';
  return 'webm';
}

/** Converte uma linha vinda da API `/whatsapp/contacts` no `Contact` que a UI usa. */
export function mapWhatsappContactApiRow(c: Record<string, unknown>): Contact {
  const lastMessageTime = c.lastMessageTime
    ? new Date(String(c.lastMessageTime)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const base = c as unknown as Contact;
  return {
    ...base,
    lastMessageTime,
    contactKind: normalizeContactKind(c.contactKind),
  };
}

/** Segundo visto na UI pouco depois do servidor aceitar (não há ACK de leitura do destinatário na API). */
export const WHATSAPP_DELIVERED_TICK_DELAY_MS = 480;

export function scheduleMessageDeliveredUi(
  setChatHistory: Dispatch<SetStateAction<Record<string, Message[]>>>,
  contactNumber: string,
  id: string | number,
) {
  window.setTimeout(() => {
    setChatHistory((prev) => ({
      ...prev,
      [contactNumber]: (prev[contactNumber] || []).map((m) =>
        String(m.id) === String(id) ? { ...m, sendStatus: 'delivered' as const } : m,
      ),
    }));
  }, WHATSAPP_DELIVERED_TICK_DELAY_MS);
}
