import React, { Fragment, useState } from 'react';
import { CheckCheck } from 'lucide-react';
import { Message } from './types';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { MessageContextMenu } from './MessageContextMenu';
import { canDeleteMessageByTime, canEditMessageByTime } from '@/lib/whatsapp-message-windows';

interface MessageListProps {
  filteredMessages: Message[];
  chatSearchTerm: string;
  setViewerMessage: (msg: Message) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onMessageDelete?: (msg: Message) => void;
  onMessageEditRequest?: (msg: Message) => void;
}

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayKeyFromSentAt(sentAt?: string): string {
  const d = sentAt ? new Date(sentAt) : new Date();
  const s = startOfLocalDay(d);
  return `${s.getFullYear()}-${s.getMonth()}-${s.getDate()}`;
}

function formatDaySeparatorLabel(sentAt?: string): string {
  const msgDay = startOfLocalDay(sentAt ? new Date(sentAt) : new Date());
  const today = startOfLocalDay(new Date());
  const diffDays = Math.round((today.getTime() - msgDay.getTime()) / 86400000);
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  const d = sentAt ? new Date(sentAt) : new Date();
  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function MessageList({
  filteredMessages,
  chatSearchTerm,
  setViewerMessage,
  messagesEndRef,
  onMessageDelete,
  onMessageEditRequest,
}: MessageListProps) {
  const [ctx, setCtx] = useState<{ x: number; y: number; msg: Message } | null>(null);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-2 z-10 no-scrollbar bg-slate-50/50">
      {filteredMessages.length === 0 && chatSearchTerm && (
        <div className="text-center text-slate-500 text-sm mt-4">Nenhuma mensagem encontrada.</div>
      )}

      {filteredMessages.map((msg, idx) => {
        const prev = idx > 0 ? filteredMessages[idx - 1] : null;
        const showDayDivider = !prev || dayKeyFromSentAt(prev.sentAt) !== dayKeyFromSentAt(msg.sentAt);
        const isFilePreview = msg.isMedia && msg.mediaData && !msg.mimeType?.startsWith('audio/');

        return (
          <Fragment key={String(msg.id)}>
            {showDayDivider && (
              <div className="flex justify-center py-3" role="separator" aria-label={formatDaySeparatorLabel(msg.sentAt)}>
                <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/80">
                  {formatDaySeparatorLabel(msg.sentAt)}
                </span>
              </div>
            )}
            <div
              className={`${isFilePreview ? 'max-w-[min(85%,304px)]' : 'max-w-[85%] md:max-w-[70%]'} w-fit min-w-0 relative px-3 py-2 rounded-xl flex flex-col break-words shadow-sm ${msg.fromMe ? 'self-end bg-brand-600 text-white rounded-tr-sm' : 'self-start bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}
              onContextMenu={(e) => {
                if (!msg.fromMe || typeof msg.id === 'number') return;
                const canEditText = !msg.isMedia && !!(msg.text && msg.text.trim());
                const wantsEdit =
                  canEditText && !!onMessageEditRequest && canEditMessageByTime(msg.sentAt);
                const wantsDelete = !!onMessageDelete && canDeleteMessageByTime(msg.sentAt);
                if (!wantsEdit && !wantsDelete) return;
                e.preventDefault();
                setCtx({ x: e.clientX, y: e.clientY, msg });
              }}
            >
              {msg.isMedia && msg.mediaData && (
                msg.mimeType?.startsWith('audio/') ? (
                  // Largura fixa: o elemento <audio> não tem tamanho intrínseco e colapsa
                  // dentro de balões `w-fit`, mostrando apenas o menu (⋮). Fixar o container resolve.
                  <div className="mb-1 w-[260px] max-w-full sm:w-[300px]">
                    <VoiceNotePlayer
                      src={msg.mediaData}
                      mimeType={msg.mimeType}
                      invertControls={msg.fromMe}
                    />
                  </div>
                ) : (
                  <div
                    className={`mb-1.5 w-fit max-w-full min-w-0 overflow-hidden rounded-lg border p-2 ${msg.fromMe ? 'border-brand-400 bg-brand-500/90' : 'border-slate-200 bg-slate-50'}`}
                  >
                    <div className="flex min-w-0 items-start gap-2">
                      <div
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${msg.fromMe ? 'bg-brand-400/50' : 'border border-slate-200 bg-white'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold leading-snug">{msg.fileName || 'Ficheiro'}</p>
                        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                          <span className={`font-mono text-[10px] uppercase ${msg.fromMe ? 'text-white/90' : 'text-slate-500'}`}>
                            {msg.mimeType?.split('/')[1] || 'ficheiro'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setViewerMessage(msg)}
                            className={`shrink-0 rounded px-2.5 py-1 text-[10px] font-semibold transition-colors ${msg.fromMe ? 'bg-white/95 text-brand-700 hover:bg-white' : 'border border-slate-300 bg-white text-brand-700 hover:bg-brand-50'}`}
                          >
                            Abrir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}

              {msg.text && msg.text.trim() !== '' && (
                <span className="text-[14px] leading-relaxed">
                  {chatSearchTerm
                    ? msg.text.split(new RegExp(`(${chatSearchTerm})`, 'gi')).map((part, i) =>
                        part.toLowerCase() === chatSearchTerm.toLowerCase() ? (
                          <mark key={i} className="bg-highlight text-brand-950 px-0.5 rounded">
                            {part}
                          </mark>
                        ) : (
                          part
                        ),
                      )
                    : msg.text}
                </span>
              )}

              <div
                className={`mt-1 flex items-center justify-end gap-1 self-stretch text-[10px] ${msg.fromMe ? 'text-white/85' : 'text-slate-400'}`}
              >
                <span>{msg.time}</span>
                {msg.fromMe && <CheckCheck className="h-3.5 w-3.5 shrink-0 opacity-95" strokeWidth={2.25} aria-hidden />}
              </div>
            </div>
          </Fragment>
        );
      })}
      <div ref={messagesEndRef} />

      {ctx && (onMessageDelete || onMessageEditRequest) && (
        <MessageContextMenu
          x={ctx.x}
          y={ctx.y}
          message={ctx.msg}
          onClose={() => setCtx(null)}
          onDelete={() => onMessageDelete?.(ctx.msg)}
          onEdit={() => onMessageEditRequest?.(ctx.msg)}
        />
      )}
    </div>
  );
}
