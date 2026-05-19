import type { Message } from '@/components/whatsapp/types';
import { extractInboundMessageContent, unwrapProtoMessage } from '@/lib/whatsapp-inbound-extract';

export type WhatsappIngressDetail = {
  payload: { event?: string; data?: unknown; instance?: string };
  msgData: Record<string, unknown> & {
    key?: { remoteJid?: string; fromMe?: boolean; id?: string; messageTimestamp?: number };
    message?: Record<string, unknown>;
    messageTimestamp?: number;
    timestamp?: number;
    customMedia?: Record<string, unknown>;
    profilePictureUrl?: string;
    crmMessageKind?: string;
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
    if (!remoteJid || remoteJid === 'status@broadcast') return null;

    const isGroupJid = remoteJid.includes('@g.us');
    const contactNumber = isGroupJid ? remoteJid : remoteJid.split('@')[0];
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
    const groupSenderLabel =
      typeof (msgData as { groupSenderLabel?: unknown }).groupSenderLabel === 'string'
        ? String((msgData as { groupSenderLabel: string }).groupSenderLabel)
        : undefined;

    const rawMsg = msgData.message;
    if (!rawMsg || typeof rawMsg !== 'object' || Object.keys(rawMsg).length === 0) {
      return null;
    }
    const inner = unwrapProtoMessage(rawMsg);
    const extracted = extractInboundMessageContent(inner);
    if (extracted.skipPersist) return null;

    const incomingText =
      customMedia.text !== undefined ? String(customMedia.text) : extracted.text;
    const fallbackSidebarText = extracted.fallbackSidebar;
    const isMedia = Boolean(customMedia.isMedia ?? extracted.isMedia);
    const messageKind =
      (typeof msgData.crmMessageKind === 'string' && msgData.crmMessageKind) ||
      extracted.messageKind ||
      undefined;

    const newMessage: Message = {
      id: waId,
      text: incomingText,
      type: isFromMe ? 'sent' : 'received',
      time: timeNow,
      sentAt: sentAtIso,
      fromMe: isFromMe,
      senderNumber: contactNumber,
      isMedia,
      mediaData: (customMedia.mediaData as string | undefined) || undefined,
      mimeType: (customMedia.mimeType as string | undefined) || extracted.mimeType,
      fileName: (customMedia.fileName as string | undefined) || extracted.fileName,
      sendStatus: isFromMe ? 'delivered' : undefined,
      groupSenderLabel: groupSenderLabel || undefined,
      messageKind,
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
