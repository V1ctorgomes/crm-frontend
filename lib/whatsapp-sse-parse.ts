import type { Message } from '@/components/whatsapp/types';

export type WhatsappIngressDetail = {
  payload: { event?: string; data?: unknown; instance?: string };
  msgData: Record<string, unknown> & {
    key?: { remoteJid?: string; fromMe?: boolean; id?: string; messageTimestamp?: number };
    message?: Record<string, unknown>;
    messageTimestamp?: number;
    timestamp?: number;
    customMedia?: Record<string, unknown>;
    profilePictureUrl?: string;
  };
  contactNumber: string;
  isFromMe: boolean;
  waId: string | number;
  newMessage: Message;
  incomingText: string;
  fallbackSidebarText: string;
  timeNow: string;
  sentAtIso: string;
};

export function tryParseWhatsappSseMessage(raw: string): WhatsappIngressDetail | null {
  try {
    const payload = JSON.parse(raw) as WhatsappIngressDetail['payload'];
    if (
      (payload?.event !== 'messages.upsert' && payload?.event !== 'send.message') ||
      !payload?.data
    ) {
      return null;
    }
    const msgData = payload.data as WhatsappIngressDetail['msgData'];
    const remoteJid = msgData.key?.remoteJid;
    if (!remoteJid || remoteJid.includes('@g.us') || remoteJid === 'status@broadcast') return null;

    const contactNumber = remoteJid.split('@')[0];
    const isFromMe = msgData.key?.fromMe || false;
    const waId = msgData.key?.id || Date.now().toString();
    const now = new Date();
    const timeNow = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const rawTs = msgData.messageTimestamp ?? msgData.timestamp ?? msgData.key?.messageTimestamp;
    const sentAtIso =
      typeof rawTs === 'number'
        ? new Date(rawTs < 1e12 ? rawTs * 1000 : rawTs).toISOString()
        : now.toISOString();

    const customMedia = (msgData.customMedia || {}) as Record<string, unknown>;
    const message = (msgData.message || {}) as Record<string, unknown>;
    const ext = message.extendedTextMessage as { text?: string } | undefined;
    let incomingText =
      customMedia.text !== undefined
        ? String(customMedia.text)
        : String(message.conversation || ext?.text || '');
    const fallbackSidebarText = message.imageMessage
      ? 'Imagem'
      : message.documentMessage
        ? 'Documento'
        : message.audioMessage
          ? 'Áudio'
          : message.videoMessage
            ? 'Vídeo'
            : 'Mídia';

    const newMessage: Message = {
      id: waId,
      text: incomingText,
      type: isFromMe ? 'sent' : 'received',
      time: timeNow,
      sentAt: sentAtIso,
      fromMe: isFromMe,
      senderNumber: contactNumber,
      isMedia: Boolean(customMedia.isMedia),
      mediaData: customMedia.mediaData as string | undefined,
      mimeType: customMedia.mimeType as string | undefined,
      fileName: customMedia.fileName as string | undefined,
    };

    return {
      payload,
      msgData,
      contactNumber,
      isFromMe,
      waId,
      newMessage,
      incomingText,
      fallbackSidebarText,
      timeNow,
      sentAtIso,
    };
  } catch {
    return null;
  }
}
