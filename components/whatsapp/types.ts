import type { ContactKind } from '@/lib/contact-kind';
import type { Company } from '@/lib/companies';

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
  /** Nome do remetente em mensagens recebidas de grupo. */
  groupSenderLabel?: string;
  /** Tipo semântico (reação, figurinha, localização, inquérito, …) vindo do backend. */
  messageKind?: string;
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
  /** Empresas vinculadas a este número (preenchido pelo backend em /whatsapp/contacts). */
  companies?: Company[];
}

export interface Stage {
  id: string;
  name: string;
}