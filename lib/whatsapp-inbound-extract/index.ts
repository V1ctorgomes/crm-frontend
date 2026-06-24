/** Extração de texto / mídia / tipo semântico a partir do nó `message` (proto Evolution / Baileys). */
export type { ExtractedInboundMessage } from './types';
export { unwrapProtoMessage } from './proto.util';
export { extractInboundMessageContent } from './extract-inbound-message';
