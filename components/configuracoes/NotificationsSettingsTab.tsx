'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import {
  ensureWebPushSubscription,
  isWebPushActive,
  resolveVapidPublicKey,
  revokeWebPushSubscription,
  subscribeWebPushState,
} from '@/lib/web-push-client';
import { getWebPushBlockInfo, type WebPushBlockInfo } from '@/lib/web-push-support';

type Props = {
  showFeedback: (type: 'success' | 'error', message: string) => void;
};

export function NotificationsSettingsTab({ showFeedback }: Props) {
  const [vapidReady, setVapidReady] = useState<boolean | null>(null);
  const [pushActive, setPushActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>('default');
  const [blockInfo, setBlockInfo] = useState<WebPushBlockInfo | null>(null);

  const refresh = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const block = getWebPushBlockInfo();
    setBlockInfo(block);
    if ('Notification' in window) {
      setPerm(Notification.permission);
    } else {
      setPerm('unsupported');
    }
    const key = await resolveVapidPublicKey();
    setVapidReady(Boolean(key));
    if (key && block.canTrySubscribe) {
      setPushActive(await isWebPushActive());
    } else {
      setPushActive(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return subscribeWebPushState(() => {
      void refresh();
    });
  }, [refresh]);

  if (vapidReady === null) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!vapidReady) {
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-900">
        O servidor ainda não expõe chaves VAPID. Confirme{' '}
        <code className="rounded bg-white/80 px-1">VAPID_PUBLIC_KEY</code> e{' '}
        <code className="rounded bg-white/80 px-1">VAPID_PRIVATE_KEY</code> no backend e reinicie o serviço.
      </div>
    );
  }

  if (blockInfo && !blockInfo.canTrySubscribe) {
    return (
      <div className="rounded-xl border border-sky-100 bg-sky-50/90 p-4 text-sm text-sky-950 space-y-2">
        <h3 className="font-semibold text-sky-950">{blockInfo.hintTitle}</h3>
        <p className="text-sky-900/90 leading-relaxed">{blockInfo.hintBody}</p>
      </div>
    );
  }

  if (perm === 'denied') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        As notificações estão bloqueadas. Nas definições do site no browser, altere para &quot;Permitir&quot;.
      </div>
    );
  }

  if (pushActive) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-emerald-50 p-2 border border-emerald-100">
            <Bell className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h3 className="font-semibold text-brand-950">Notificações do sistema</h3>
            <p className="text-sm text-slate-600 mt-1">
              Ativas neste dispositivo. Receberá avisos de novas mensagens WhatsApp quando o CRM estiver em segundo plano ou fechado (conforme o browser).
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await revokeWebPushSubscription();
              await refresh();
              showFeedback('success', 'Notificações desativadas neste dispositivo.');
            } catch {
              showFeedback('error', 'Erro ao desativar notificações.');
            } finally {
              setBusy(false);
            }
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Desativar notificações
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-brand-50 p-2 border border-brand-100">
          <Bell className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h3 className="font-semibold text-brand-950">Notificações do sistema</h3>
          <p className="text-sm text-slate-600 mt-1">
            Aviso de novas mensagens WhatsApp mesmo com o separador do CRM fechado (depende do browser).
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const ok = await ensureWebPushSubscription();
            await refresh();
            if (ok) showFeedback('success', 'Notificações ativadas.');
            else if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
              showFeedback('error', 'Permissão negada.');
            } else {
              showFeedback(
                'error',
                'Não foi possível concluir. Verifique HTTPS, VAPID no servidor e sessão iniciada.',
              );
            }
          } catch {
            showFeedback('error', 'Erro ao ativar notificações.');
          } finally {
            setBusy(false);
          }
        }}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Ativar notificações
      </button>
    </div>
  );
}
