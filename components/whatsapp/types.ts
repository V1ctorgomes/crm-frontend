import type { ContactKind } from '@/lib/contact-kind';

/** Estados de envio (balões `fromMe`), estilo WhatsApp. */
export type MessageSendStatus = 'sending' | 'sent' | 'delivered';

export interface Message {  id: string | number;
  text: string;
  type: 'sent' | 'received';
  time: string;
  /** ISO 8601 — usado para agrupar por dia (Hoje, Ontem, …) */
  sentAt?: string;
  fromMe: boolean;
  senderNumber: string;
  isMedia?: boolean;
  mediaData?: string; 
  mimeType?: string;
  fileName?: string;
  /**
   * Só mensagens enviadas por nós. `sending` = a aguardar API/upload; `sent` = servidor aceitou;
   * `delivered` = confirmação final na UI (histórico remoto / eco SSE usa sempre `delivered`).
   */
  sendStatus?: MessageSendStatus;
}

export interface Contact {
  number: string;
  name: string;
  profilePictureUrl?: string;
  lastMessage: string;
  lastMessageTime: string;
  email?: string;
  cnpj?: string;
  instanceName?: string;
  /** Cliente comercial vs colaborador (classificação manual). */
  contactKind?: ContactKind;
}

export interface Stage {
  id: string;
  name: string;
}