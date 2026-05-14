/** Persistência de não lidas (por número) + evento global para o menu lateral. */
export const WHATSAPP_UNREAD_STORAGE_KEY = 'crm_whatsapp_unread_v1';

export function loadUnreadByContact(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(WHATSAPP_UNREAD_STORAGE_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== 'object') return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(o)) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) out[k] = Math.min(n, 999);
    }
    return out;
  } catch {
    return {};
  }
}

/** Soma de mensagens não lidas (por contato). */
export function unreadMessagesTotal(map: Record<string, number>): number {
  return Object.values(map).reduce((a, b) => a + (Number(b) > 0 ? Number(b) : 0), 0);
}

/** Quantidade de conversas com pelo menos uma mensagem não lida (para badge no menu). */
export function unreadConversationsCount(map: Record<string, number>): number {
  return Object.values(map).filter((v) => Number(v) > 0).length;
}

export function saveUnreadAndBroadcast(map: Record<string, number>) {
  if (typeof window === 'undefined') return;
  const cleaned: Record<string, number> = {};
  for (const [k, v] of Object.entries(map)) {
    if (Number(v) > 0) cleaned[k] = Math.min(Number(v), 999);
  }
  localStorage.setItem(WHATSAPP_UNREAD_STORAGE_KEY, JSON.stringify(cleaned));
  window.dispatchEvent(
    new CustomEvent('crm-whatsapp-unread', {
      detail: {
        map: cleaned,
        /** @deprecated usar unreadConversations para o menu lateral */
        total: unreadConversationsCount(cleaned),
        unreadConversations: unreadConversationsCount(cleaned),
        unreadMessages: unreadMessagesTotal(cleaned),
      },
    }),
  );
}

let sharedAudioCtx: AudioContext | null = null;

/** Chamar uma vez após gesto do usuario (ex.: primeiro clique) para o som não ser bloqueado. */
export function primeWhatsappNotificationAudio() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!sharedAudioCtx) sharedAudioCtx = new AC();
    void sharedAudioCtx.resume();
  } catch {
    /* ignore */
  }
}

/** Dois tons curtos, estilo alerta de mensagem (volume reduzido se soft). */
export function playIncomingMessageSound(soft = false) {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!sharedAudioCtx) sharedAudioCtx = new AC();
    const ctx = sharedAudioCtx;
    void ctx.resume();

    const gain = ctx.createGain();
    const peak = soft ? 0.04 : 0.09;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    gain.connect(ctx.destination);

    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      osc.connect(gain);
      osc.start(start);
      osc.stop(start + dur);
    };

    const t0 = ctx.currentTime + 0.01;
    playTone(660, t0, 0.1);
    playTone(880, t0 + 0.08, 0.12);
  } catch {
    /* autoplay ou contexto indisponível */
  }
}
