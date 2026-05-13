import type { Message } from '@/components/whatsapp/types';

export const WHATSAPP_HISTORY_PAGE_SIZE = 80;

export function normalizeWhatsappHistoryResponse(data: unknown): {
  rows: Record<string, unknown>[];
  hasMoreOlder: boolean;
} {
  if (Array.isArray(data)) {
    return { rows: data as Record<string, unknown>[], hasMoreOlder: false };
  }
  if (data && typeof data === 'object' && 'messages' in (data as object)) {
    const o = data as { messages?: unknown; hasMoreOlder?: unknown };
    const rows = Array.isArray(o.messages) ? (o.messages as Record<string, unknown>[]) : [];
    return { rows, hasMoreOlder: Boolean(o.hasMoreOlder) };
  }
  return { rows: [], hasMoreOlder: false };
}

export function mapApiRowToMessage(m: Record<string, unknown>): Message {
  const ts = m.timestamp ? new Date(String(m.timestamp)) : new Date();
  const fromMe = m.type === 'sent';
  return {
    id: m.id as string,
    text: String(m.text ?? ''),
    type: m.type === 'sent' ? 'sent' : 'received',
    time: ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    sentAt: ts.toISOString(),
    fromMe,
    senderNumber: String(m.contactNumber ?? ''),
    isMedia: Boolean(m.isMedia),
    mediaData: m.mediaData ? String(m.mediaData) : undefined,
    mimeType: m.mimeType ? String(m.mimeType) : undefined,
    fileName: m.fileName ? String(m.fileName) : undefined,
    sendStatus: fromMe ? ('delivered' as const) : undefined,
  };
}
