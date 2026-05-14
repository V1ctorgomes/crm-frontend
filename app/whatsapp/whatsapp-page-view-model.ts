import type { WhatsappLayoutState } from './use-whatsapp-layout-state';
import type { WhatsappRealtimeThread } from './use-whatsapp-realtime-thread';
import type { WhatsappMessagingStack } from './use-whatsapp-messaging-stack';
import type { WhatsappListsAndOsResult } from './use-whatsapp-lists-and-os';

/**
 * Contrato público de `useWhatsappPage`: o que a página e os modais podem consumir.
 * Garante que alterações nos hooks filhos se reflitam em erros de tipo aqui.
 */
export type WhatsappPageViewModel = WhatsappLayoutState &
  Pick<WhatsappRealtimeThread, 'historyMeta' | 'isLoadingOlder' | 'loadOlderMessages'> &
  Omit<WhatsappMessagingStack, 'handleSendMessage'> &
  WhatsappListsAndOsResult;
