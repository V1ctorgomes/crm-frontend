'use client';

import { useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { ensureWebPushSubscription, resolveVapidPublicKey } from '@/lib/web-push-client';

type Props = {
  showFeedback: (type: 'success' | 'error', message: string) => void;
};

export function NotificationsSettingsTab({ showFeedback }: Props) {
  const [vapidReady, setVapidReady] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>('default');
  const [browserOk, setBrowserOk] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setPerm('unsupported');
      setBrowserOk(false);
      setVapidReady(false);
      return;
    }
    setPerm(Notification.permission);
    void resolveVapidPublicKey().then((k) => setVapidReady(Boolean(k)));
  }, []);

  if (!browserOk) {
    return (
      <p className="text-sm text-slate-600">Este browser não suporta notificações push.</p>
    );
  }

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

  if (perm === 'denied') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        As notificações estão bloqueadas. Nas definições do site no browser, altere para &quot;Permitir&quot;.
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
            setPerm(Notification.permission);
            if (ok) showFeedback('success', 'Notificações ativadas.');
            else if (Notification.permission === 'denied') {
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
