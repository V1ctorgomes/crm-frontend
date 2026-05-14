/** Disparado quando a ligação volta (browser `online` e/ou SSE do WhatsApp reaberto). */
export const CRM_NETWORK_ONLINE = 'crm-network-online';

const THROTTLE_MS = 2500;
let lastEmitAt = 0;

/**
 * Avisa o resto da app para voltar a pedir dados à API (evita F5 após queda de rede).
 * Com throttle para não disparar várias vezes no mesmo segundo (ex.: `online` + `onopen` do SSE).
 */
export function emitCrmNetworkOnline(): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (now - lastEmitAt < THROTTLE_MS) return;
  lastEmitAt = now;
  window.dispatchEvent(new CustomEvent(CRM_NETWORK_ONLINE));
}
