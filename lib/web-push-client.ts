import { getAuthToken, withAuthHeaders } from '@/lib/api-client';
import { getWebPushBlockInfo, hasPushManagerCapability, isPushFeedbackMobileContext } from './web-push-support';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://crm-crm-backend.pknzmz.easypanel.host';

function apiBase(): string {
  return API_URL.replace(/\/$/, '');
}

const PUSH_STATE_EVENT = 'crm-web-push-state';

export type EnsureWebPushResult = {
  /** POST /subscribe respondeu 2xx */
  serverSynced: boolean;
  /** Existe subscrição no PushManager deste separador */
  hasLocalSubscription: boolean;
  httpStatus?: number;
  /** Corpo de erro do Nest ou falha de rede */
  serverError?: string;
  /** Falhou antes do POST (sem token, sem VAPID, etc.) */
  blocked?: string;
};

export function notifyWebPushStateChanged(): void {
  if (typeof window === 'undefined') return;
  const run = () => {
    try {
      window.dispatchEvent(new CustomEvent(PUSH_STATE_EVENT));
    } catch {
      /* listener externo não deve rebentar o fluxo de subscrição */
    }
  };
  if (typeof queueMicrotask === 'function') queueMicrotask(run);
  else setTimeout(run, 0);
}

/** Permissão concedida e subscrição push ativa neste browser. */
export async function isWebPushActive(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!getWebPushBlockInfo().canTrySubscribe) return false;
  if (Notification.permission !== 'granted') return false;
  if (!('serviceWorker' in navigator) || !hasPushManagerCapability()) return false;
  const reg =
    (await navigator.serviceWorker.ready.catch(() => null)) ??
    (await navigator.serviceWorker.getRegistration());
  const sub = await reg?.pushManager.getSubscription();
  return Boolean(sub);
}

export function subscribeWebPushState(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(PUSH_STATE_EVENT, listener);
  return () => window.removeEventListener(PUSH_STATE_EVENT, listener);
}

/** Chave pública VAPID: env do front ou GET no backend (evita rebuild só por causa disto). */
export async function resolveVapidPublicKey(): Promise<string | null> {
  const fromEnv = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (fromEnv) return fromEnv;
  try {
    const res = await fetch(`${apiBase()}/notifications/push/vapid-public-key`);
    if (!res.ok) return null;
    const data = (await res.json()) as { publicKey?: string };
    const k = String(data.publicKey || '').trim();
    return k || null;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function parseNestErrorMessage(text: string): string | undefined {
  const t = text.trim();
  if (!t) return undefined;
  try {
    const j = JSON.parse(t) as { message?: string | string[] };
    if (Array.isArray(j.message)) return j.message.join(', ');
    if (typeof j.message === 'string') return j.message;
  } catch {
    /* not JSON */
  }
  return t.length > 200 ? `${t.slice(0, 200)}…` : t;
}

/**
 * Mensagem curta para toast, com base no resultado do POST e no estado real do browser.
 */
export function pushSubscribeUserFeedback(
  r: EnsureWebPushResult,
  pushActiveAfter: boolean,
): { ok: boolean; message: string } {
  if (pushActiveAfter || r.serverSynced) {
    return { ok: true, message: 'Notificações ativadas.' };
  }
  if (r.blocked === 'permission-denied' || r.blocked === 'permission-error') {
    return { ok: false, message: 'Permissão negada.' };
  }
  if (r.blocked === 'no-token') {
    return {
      ok: false,
      message: 'Inicie sessão para guardar a subscrição no servidor.',
    };
  }
  if (r.blocked === 'no-vapid') {
    return {
      ok: false,
      message:
        'O servidor não enviou chave VAPID. Confirme VAPID_PUBLIC_KEY no backend e NEXT_PUBLIC_API_URL no frontend.',
    };
  }
  if (
    r.blocked === 'unsupported-environment' ||
    r.blocked === 'no-sw' ||
    r.blocked === 'subscribe-failed' ||
    r.blocked === 'sw-register-failed'
  ) {
    if (isPushFeedbackMobileContext()) {
      return {
        ok: false,
        message:
          'Não foi possível preparar notificações neste telemóvel. Atualize o Chrome ou o Safari, abra o CRM em HTTPS ou siga as instruções em Configurações → Notificações.',
      };
    }
    return {
      ok: false,
      message:
        'Não foi possível preparar notificações neste browser no PC. Use Chrome ou Edge atualizado, confirme HTTPS no endereço do CRM, desative extensões que bloqueiem scripts ou recarregue a página (Ctrl+F5).',
    };
  }
  if (r.blocked === 'invalid-subscription-json') {
    return {
      ok: false,
      message: 'Resposta inválida do browser ao subscrever push. Tente recarregar a página.',
    };
  }
  if (r.httpStatus === 401 || r.httpStatus === 403) {
    return {
      ok: false,
      message:
        'Sessão inválida ou expirada. Inicie sessão novamente e tente ativar as notificações outra vez.',
    };
  }
  if (r.httpStatus === 404) {
    return {
      ok: false,
      message: `API não encontrada (404). Verifique se NEXT_PUBLIC_API_URL aponta para o backend certo (${apiBase()}).`,
    };
  }
  if (r.serverError) {
    const tail = r.httpStatus ? ` (HTTP ${r.httpStatus})` : '';
    return { ok: false, message: `${r.serverError}${tail}` };
  }
  if (r.hasLocalSubscription && !r.serverSynced) {
    return {
      ok: false,
      message:
        'O browser subscreveu, mas o servidor não confirmou. Confirme sessão, URL da API e migrações da base de dados.',
    };
  }
  return {
    ok: false,
    message: isPushFeedbackMobileContext()
      ? 'Não foi possível concluir no telemóvel. Confirme HTTPS, VAPID no servidor e NEXT_PUBLIC_API_URL; no iPhone use a app no ecrã inicial (iOS 16.4+).'
      : 'Não foi possível concluir no PC. Confirme VAPID no servidor, HTTPS no CRM e se NEXT_PUBLIC_API_URL aponta para o backend certo.',
  };
}

/** Garante SW + subscrição push e regista no backend (requer JWT em cookie). */
export async function ensureWebPushSubscription(): Promise<EnsureWebPushResult> {
  const empty = (): EnsureWebPushResult => ({
    serverSynced: false,
    hasLocalSubscription: false,
  });

  if (typeof window === 'undefined') return empty();
  if (!getWebPushBlockInfo().canTrySubscribe) {
    return { ...empty(), blocked: 'unsupported-environment' };
  }
  if (!('serviceWorker' in navigator)) {
    return { ...empty(), blocked: 'no-sw' };
  }
  if (!getAuthToken()) {
    return { ...empty(), blocked: 'no-token' };
  }

  const vapidPublic = await resolveVapidPublicKey();
  if (!vapidPublic) {
    return { ...empty(), blocked: 'no-vapid' };
  }

  let permission = Notification.permission;
  if (permission === 'denied') {
    return { ...empty(), blocked: 'permission-denied' };
  }
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch {
      return { ...empty(), blocked: 'permission-error' };
    }
    if (permission !== 'granted') {
      return { ...empty(), blocked: 'permission-denied' };
    }
  }

  let reg: ServiceWorkerRegistration;
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    reg = await navigator.serviceWorker.ready;
    await reg.update().catch(() => undefined);
  } catch {
    return { ...empty(), blocked: 'sw-register-failed' };
  }

  if (!reg.pushManager) {
    return { ...empty(), blocked: 'no-sw' };
  }

  let sub: PushSubscription | null = null;
  try {
    sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic),
      });
    }
  } catch {
    return { ...empty(), blocked: 'subscribe-failed' };
  }

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ...empty(), blocked: 'invalid-subscription-json' };
  }

  let serverSynced = false;
  let httpStatus: number | undefined;
  let serverError: string | undefined;
  try {
    const res = await fetch(`${apiBase()}/notifications/push/subscribe`, {
      method: 'POST',
      headers: withAuthHeaders({ 'Content-Type': 'application/json' }) as HeadersInit,
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      }),
    });
    httpStatus = res.status;
    serverSynced = res.ok;
    if (!serverSynced) {
      const text = await res.text().catch(() => '');
      serverError = parseNestErrorMessage(text);
    }
  } catch {
    serverError =
      'Sem ligação ao servidor (rede, CORS ou URL errado). Confirme NEXT_PUBLIC_API_URL.';
  }

  const hasLocalSubscription = Boolean(await reg.pushManager.getSubscription());
  if (serverSynced) notifyWebPushStateChanged();
  return { serverSynced, hasLocalSubscription, httpStatus, serverError };
}

/** Remove subscrição no servidor e no browser (chamar antes de limpar o token). */
export async function revokeWebPushSubscription(): Promise<void> {
  if (typeof window === 'undefined') return;
  const token = getAuthToken();
  if (!token) return;
  const base = apiBase();

  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await fetch(`${base}/notifications/push/subscribe`, {
      method: 'DELETE',
      headers: withAuthHeaders({ 'Content-Type': 'application/json' }) as HeadersInit,
      body: JSON.stringify({ endpoint }),
    }).catch(() => undefined);
    await sub.unsubscribe().catch(() => undefined);
  } catch {
    // ignorar
  } finally {
    notifyWebPushStateChanged();
  }
}
