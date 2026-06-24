import { isPushFeedbackMobileContext } from '../web-push-support';
import { webPushApiBase } from './api-base';
import type { EnsureWebPushResult } from './types';

/**
 * Mensagem curta para toast, com base no resultado do POST e no estado real do browser.
 */
export function pushSubscribeUserFeedback(
  r: EnsureWebPushResult,
  pushActiveAfter: boolean,
): { ok: boolean; message: string } {
  if (pushActiveAfter || r.serverSynced || r.hasLocalSubscription) {
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
      message: `API não encontrada (404). Confirme NEXT_PUBLIC_API_URL ou o proxy /api/proxy no Next (${webPushApiBase()}).`,
    };
  }
  if (r.serverError) {
    const tail = r.httpStatus ? ` (HTTP ${r.httpStatus})` : '';
    return { ok: false, message: `${r.serverError}${tail}` };
  }
  return {
    ok: false,
    message: isPushFeedbackMobileContext()
      ? 'Não foi possível concluir no telemóvel. Confirme HTTPS, VAPID no servidor e NEXT_PUBLIC_API_URL; no iPhone use a app no ecrã inicial (iOS 16.4+).'
      : 'Não foi possível concluir no PC. Confirme VAPID no servidor, HTTPS no CRM e se NEXT_PUBLIC_API_URL aponta para o backend certo.',
  };
}
