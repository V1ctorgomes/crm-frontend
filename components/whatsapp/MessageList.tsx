import React, { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Message } from './types';
import { MessageContextMenu } from './MessageContextMenu';
import { canDeleteMessageByTime, canEditMessageByTime } from '@/lib/whatsapp-message-windows';
import { MessageBubble } from './message-list/MessageBubble';
import { dayKeyFromSentAt, formatDaySeparatorLabel, scrollListToBottom } from './message-list/message-list-utils';

export interface MessageListProps {
  conversationKey: string;
  filteredMessages: Message[];
  chatSearchTerm: string;
  setViewerMessage: (msg: Message) => void;
  listScrollRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onMessageDelete?: (msg: Message) => void;
  onMessageEditRequest?: (msg: Message) => void;
  hasMoreOlder?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void | Promise<void>;
  onCancelMediaSend?: (messageId: string | number) => void;
}

export function MessageList({
  conversationKey,
  filteredMessages,
  chatSearchTerm,
  setViewerMessage,
  listScrollRef,
  messagesEndRef,
  onMessageDelete,
  onMessageEditRequest,
  hasMoreOlder = false,
  isLoadingOlder = false,
  onLoadOlder,
  onCancelMediaSend,
}: MessageListProps) {
  const [ctx, setCtx] = useState<{ x: number; y: number; msg: Message } | null>(null);
  const loadOlderThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const len = filteredMessages.length;
  const tailId = len ? String(filteredMessages[len - 1]!.id) : '';
  const bottomScrollKey = `${conversationKey}|${chatSearchTerm}|${tailId}`;

  useLayoutEffect(() => {
    scrollListToBottom(listScrollRef.current);
  }, [bottomScrollKey, listScrollRef]);

  useEffect(() => {
    const el = listScrollRef.current;
    if (!el) return;
    scrollListToBottom(el);
    const raf = requestAnimationFrame(() => scrollListToBottom(el));
    const t = window.setTimeout(() => scrollListToBottom(el), 150);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [bottomScrollKey, listScrollRef]);

  useEffect(() => {
    const node = listScrollRef.current;
    if (!node || !hasMoreOlder || !onLoadOlder || isLoadingOlder) return;

    const trigger = () => {
      if (node.scrollTop > 140) return;
      if (loadOlderThrottleRef.current) return;
      loadOlderThrottleRef.current = setTimeout(() => {
        loadOlderThrottleRef.current = null;
      }, 700);
      void onLoadOlder();
    };

    const onScroll = () => trigger();
    node.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      node.removeEventListener('scroll', onScroll);
      if (loadOlderThrottleRef.current) {
        clearTimeout(loadOlderThrottleRef.current);
        loadOlderThrottleRef.current = null;
      }
    };
  }, [hasMoreOlder, isLoadingOlder, onLoadOlder, listScrollRef, conversationKey]);

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    if (!msg.fromMe || typeof msg.id === 'number') return;
    const canEditText = !msg.isMedia && msg.messageKind !== 'reaction' && !!(msg.text && msg.text.trim());
    const wantsEdit = canEditText && !!onMessageEditRequest && canEditMessageByTime(msg.sentAt);
    const wantsDelete = !!onMessageDelete && canDeleteMessageByTime(msg.sentAt);
    if (!wantsEdit && !wantsDelete) return;
    e.preventDefault();
    setCtx({ x: e.clientX, y: e.clientY, msg });
  };

  return (
    <div
      ref={listScrollRef}
      className="crm-thin-scrollbar flex-1 min-h-0 overflow-y-auto p-4 md:p-6 flex flex-col gap-2 z-10 bg-slate-50/50"
    >
      {isLoadingOlder && (
        <div
          className="sticky top-0 z-[5] flex shrink-0 justify-center bg-slate-50/90 py-2 backdrop-blur-[2px]"
          aria-live="polite"
        >
          <span className="rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/80">
            A carregar mensagens anteriores…
          </span>
        </div>
      )}
      {filteredMessages.length === 0 && chatSearchTerm && (
        <div className="text-center text-slate-500 text-sm mt-4">Nenhuma mensagem encontrada.</div>
      )}

      {filteredMessages.map((msg, idx) => {
        const prev = idx > 0 ? filteredMessages[idx - 1] : null;
        const showDayDivider = !prev || dayKeyFromSentAt(prev.sentAt) !== dayKeyFromSentAt(msg.sentAt);

        return (
          <Fragment key={String(msg.id)}>
            {showDayDivider && (
              <div className="flex justify-center py-3" role="separator" aria-label={formatDaySeparatorLabel(msg.sentAt)}>
                <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/80">
                  {formatDaySeparatorLabel(msg.sentAt)}
                </span>
              </div>
            )}
            <MessageBubble
              msg={msg}
              chatSearchTerm={chatSearchTerm}
              setViewerMessage={setViewerMessage}
              onCancelMediaSend={onCancelMediaSend}
              onContextMenu={handleContextMenu}
            />
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
