import type { Message } from '../types';
import { VoiceNotePlayer } from '../VoiceNotePlayer';
import { RichMessageText } from './RichMessageText';
import { MessageSendTicks } from './MessageSendTicks';
import { proxiedMediaUrlOrEmpty } from '@/lib/proxied-storage-url';

interface MessageBubbleProps {
  msg: Message;
  chatSearchTerm: string;
  setViewerMessage: (msg: Message) => void;
  onCancelMediaSend?: (messageId: string | number) => void;
  onContextMenu?: (e: React.MouseEvent, msg: Message) => void;
}

export function MessageBubble({
  msg,
  chatSearchTerm,
  setViewerMessage,
  onCancelMediaSend,
  onContextMenu,
}: MessageBubbleProps) {
  const isStickerUi =
    msg.messageKind === 'sticker' && Boolean(msg.mediaData) && Boolean(msg.mimeType?.startsWith('image/'));
  const isFilePreview = msg.isMedia && msg.mediaData && !msg.mimeType?.startsWith('audio/') && !isStickerUi;
  const isReactionBubble = msg.messageKind === 'reaction';
  const mediaSrc = proxiedMediaUrlOrEmpty(msg.mediaData);

  return (
    <div
      className={`${isFilePreview ? 'max-w-[min(85%,304px)]' : isStickerUi ? 'max-w-[min(92%,280px)]' : 'max-w-[85%] md:max-w-[70%]'} w-fit min-w-0 relative px-3 py-2 rounded-xl flex flex-col break-words shadow-sm ${isReactionBubble ? 'border border-dashed' : ''} ${msg.fromMe ? 'self-end bg-brand-600 text-white rounded-tr-sm border-brand-400/50' : 'self-start bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}
      onContextMenu={(e) => onContextMenu?.(e, msg)}
    >
      {!msg.fromMe && msg.groupSenderLabel ? (
        <p className="text-[11px] font-semibold text-brand-700 leading-tight mb-1">{msg.groupSenderLabel}</p>
      ) : null}
      {isStickerUi && mediaSrc ? (
        <div className="mb-1.5 overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaSrc}
            alt="Figurinha"
            className="max-h-[220px] max-w-full w-auto object-contain"
            loading="lazy"
          />
        </div>
      ) : null}
      {msg.isMedia && mediaSrc && !isStickerUi &&
        (msg.mimeType?.startsWith('audio/') ? (
          <div className="mb-1 w-[260px] max-w-full sm:w-[300px]">
            <VoiceNotePlayer src={mediaSrc} mimeType={msg.mimeType} invertControls={msg.fromMe} />
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
        ))}

      {msg.text && msg.text.trim() !== '' && (
        <RichMessageText text={msg.text} chatSearchTerm={chatSearchTerm} invert={msg.fromMe} />
      )}

      <div
        className={`mt-1 flex items-center justify-end gap-1 self-stretch text-[10px] ${msg.fromMe ? 'text-white/85' : 'text-slate-400'}`}
      >
        <span>{msg.time}</span>
        {msg.fromMe && (
          <MessageSendTicks
            sendStatus={msg.sendStatus ?? 'delivered'}
            isMedia={Boolean(msg.isMedia)}
            messageId={msg.id}
            invert={msg.fromMe}
            onCancelMedia={onCancelMediaSend}
          />
        )}
      </div>
    </div>
  );
}
