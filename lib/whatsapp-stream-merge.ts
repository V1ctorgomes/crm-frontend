import type { WhatsappIngressDetail } from '@/lib/whatsapp-sse-parse';

/** Quando a página /whatsapp está montada, faz merge no estado e devolve se entrou mensagem recebida nova. */
export const whatsappIngressMergerRef: {
  current: ((detail: WhatsappIngressDetail) => boolean) | null;
} = { current: null };
