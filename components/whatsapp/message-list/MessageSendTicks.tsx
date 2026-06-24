import { Check, CheckCheck, Loader2, X } from 'lucide-react';
import type { MessageSendStatus } from '../types';

export function MessageSendTicks({
  sendStatus,
  isMedia,
  messageId,
  invert,
  onCancelMedia,
}: {
  sendStatus: MessageSendStatus;
  isMedia: boolean;
  messageId: string | number;
  invert: boolean;
  onCancelMedia?: (messageId: string | number) => void;
}) {
  if (sendStatus === 'sending') {
    return (
      <span className="inline-flex items-center gap-0.5 shrink-0" aria-label={isMedia ? 'A enviar ficheiro' : 'A enviar'}>
        <Loader2 className="h-3.5 w-3.5 animate-spin opacity-95" strokeWidth={2.25} aria-hidden />
        {isMedia && onCancelMedia && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCancelMedia(messageId);
            }}
            className={`rounded-full p-0.5 outline-none transition-colors ${invert ? 'hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60' : 'hover:bg-slate-200/80 focus-visible:ring-2 focus-visible:ring-slate-400'}`}
            aria-label="Cancelar envio"
          >
            <X className="h-3 w-3" strokeWidth={2.5} aria-hidden />
          </button>
        )}
      </span>
    );
  }
  if (sendStatus === 'sent') {
    return (
      <span title="Enviada" className="inline-flex shrink-0">
        <Check className="h-3.5 w-3.5 opacity-95" strokeWidth={2.25} aria-hidden />
      </span>
    );
  }
  return (
    <span title="Entregue" className="inline-flex shrink-0">
      <CheckCheck className="h-3.5 w-3.5 opacity-95" strokeWidth={2.25} aria-hidden />
    </span>
  );
}
