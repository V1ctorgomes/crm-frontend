'use client';

import { useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { ensureWebPushSubscription, resolveVapidPublicKey } from '@/lib/web-push-client';

type Props = {
  onToast?: (message: string, type: 'success' | 'error') => void;
};

export function WhatsappPushAlertRow({ onToast }: Props) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setPerm('unsupported');
      setShow(false);
      return;
    }
    setPerm(Notification.permission);
    let cancelled = false;
    void (async () => {
      const key = await resolveVapidPublicKey();
      if (!cancelled) setShow(Boolean(key));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!show || perm === 'unsupported') return null;

  if (perm === 'denied') {
    return (
      <p className="text-[11px] text-amber-800/90 leading-snug bg-amber-50 border border-amber-100 rounded-md px-2.5 py-2">
        Notificações bloqueadas neste site. Abra as definições do browser e permita notificações para o CRM.
      </p>
    );
  }

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
              setPerm(typeof Notification !== 'undefined' ? Notification.permission : 'default');
              if (ok) {
                onToast?.('Notificações ativadas.', 'success');
              } else if (Notification.permission === 'denied') {
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
