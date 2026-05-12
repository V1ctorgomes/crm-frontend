'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import {
  ensureWebPushSubscription,
  isWebPushActive,
  resolveVapidPublicKey,
  subscribeWebPushState,
} from '@/lib/web-push-client';
import { getWebPushBlockInfo, type WebPushBlockInfo } from '@/lib/web-push-support';

type Props = {
  onToast?: (message: string, type: 'success' | 'error') => void;
};

export function WhatsappPushAlertRow({ onToast }: Props) {
  const [vapidOk, setVapidOk] = useState(false);
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
    setVapidOk(Boolean(key));
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

  if (!vapidOk) return null;

  if (blockInfo && !blockInfo.canTrySubscribe && !pushActive) {
    return (
      <p className="text-[11px] text-sky-900/95 leading-snug bg-sky-50 border border-sky-100 rounded-md px-2.5 py-2">
        <span className="font-semibold block mb-0.5">{blockInfo.hintTitle}</span>
        {blockInfo.hintBody}
      </p>
    );
  }

  if (perm === 'denied') {
    return (
      <p className="text-[11px] text-amber-800/90 leading-snug bg-amber-50 border border-amber-100 rounded-md px-2.5 py-2">
        Notificações bloqueadas neste site. Abra as definições do browser e permita notificações para o CRM.
      </p>
    );
  }

  if (pushActive) return null;

  return (
    <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50/80 px-2.5 py-2">
      <Bell className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-slate-700 leading-snug">
          Alertas com o CRM fechado — ative as notificações do sistema.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const ok = await ensureWebPushSubscription();
              await refresh();
              if (ok) {
                onToast?.('Notificações ativadas.', 'success');
              } else if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
                onToast?.('Permissão negada.', 'error');
              } else {
                onToast?.(
                  'Não foi possível concluir. Confirme VAPID no servidor e HTTPS.',
                  'error',
                );
              }
            } catch {
              onToast?.('Erro ao ativar notificações.', 'error');
            } finally {
              setBusy(false);
            }
          }}
          className="mt-1.5 inline-flex items-center gap-1.5 rounded bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Ativar notificações
        </button>
      </div>
    </div>
  );
}
