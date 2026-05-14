'use client';

import { useCallback, useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { apiRequest } from '@/lib/api-client';
import type { Message } from '@/components/whatsapp/types';
import {
  WHATSAPP_HISTORY_PAGE_SIZE,
  mapApiRowToMessage,
  normalizeWhatsappHistoryResponse,
} from '@/lib/whatsapp-history-pagination';

interface UseChatHistoryArgs {
  activeNumber: string | null;
  chatHistory: Record<string, Message[]>;
  setChatHistory: Dispatch<SetStateAction<Record<string, Message[]>>>;
  messageListScrollRef: RefObject<HTMLDivElement | null>;
  onError: (msg: string) => void;
}

/**
 * Carrega a primeira página de histórico quando se abre um contacto, e expõe
 * `loadOlderMessages` para paginação infinita (scroll para cima).
 *
 * Também mantém um `chatHistoryRef` actualizado e o mapa `historyMeta`
 * (`hasMoreOlder` por número) para evitar pedidos duplicados.
 */
export function useChatHistory({
  activeNumber,
  chatHistory,
  setChatHistory,
  messageListScrollRef,
  onError,
}: UseChatHistoryArgs) {
  const [historyMeta, setHistoryMeta] = useState<Record<string, { hasMoreOlder: boolean }>>({});
  const historyMetaRef = useRef<Record<string, { hasMoreOlder: boolean }>>({});
  const chatHistoryRef = useRef<Record<string, Message[]>>({});
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const loadingOlderRef = useRef(false);

  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  useEffect(() => {
    historyMetaRef.current = historyMeta;
  }, [historyMeta]);

  useEffect(() => {
    if (!activeNumber || chatHistory[activeNumber]) return;
    const n = activeNumber;
    void (async () => {
      try {
        const raw = await apiRequest(
          `/whatsapp/history/${encodeURIComponent(n)}?limit=${WHATSAPP_HISTORY_PAGE_SIZE}`,
        ).catch(() => ({ messages: [], hasMoreOlder: false }));
        const { rows, hasMoreOlder } = normalizeWhatsappHistoryResponse(raw);
        const formattedMessages = rows.map(mapApiRowToMessage);
        setChatHistory((prev) => ({ ...prev, [n]: formattedMessages }));
        setHistoryMeta((prev) => ({ ...prev, [n]: { hasMoreOlder } }));
      } catch {
        setChatHistory((prev) => ({ ...prev, [n]: [] }));
        setHistoryMeta((prev) => ({ ...prev, [n]: { hasMoreOlder: false } }));
      }
    })();
  }, [activeNumber, chatHistory, setChatHistory]);

  const loadOlderMessages = useCallback(async () => {
    const n = activeNumber;
    if (!n || loadingOlderRef.current) return;
    const meta = historyMetaRef.current[n];
    if (!meta?.hasMoreOlder) return;
    const fullList = chatHistoryRef.current[n] || [];
    const cursorMsg = fullList.find((m) => typeof m.id === 'string');
    if (!cursorMsg) return;

    loadingOlderRef.current = true;
    setIsLoadingOlder(true);
    const el = messageListScrollRef.current;
    const prevScrollHeight = el?.scrollHeight ?? 0;
    const prevScrollTop = el?.scrollTop ?? 0;

    try {
      const raw = await apiRequest(
        `/whatsapp/history/${encodeURIComponent(n)}?limit=${WHATSAPP_HISTORY_PAGE_SIZE}&before=${encodeURIComponent(String(cursorMsg.id))}`,
      ).catch(() => ({ messages: [], hasMoreOlder: false }));
      const { rows, hasMoreOlder } = normalizeWhatsappHistoryResponse(raw);
      const older = rows.map(mapApiRowToMessage);
      const existingIds = new Set(fullList.map((m) => String(m.id)));
      const mergedOlder = older.filter((m) => !existingIds.has(String(m.id)));

      setChatHistory((prev) => {
        const cur = prev[n] || [];
        return { ...prev, [n]: [...mergedOlder, ...cur] };
      });
      setHistoryMeta((prev) => ({ ...prev, [n]: { hasMoreOlder } }));
    } catch {
      onError('Não foi possível carregar mensagens anteriores.');
    } finally {
      loadingOlderRef.current = false;
      setIsLoadingOlder(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el2 = messageListScrollRef.current;
          if (el2) {
            el2.scrollTop = el2.scrollHeight - prevScrollHeight + prevScrollTop;
          }
        });
      });
    }
  }, [activeNumber, messageListScrollRef, onError, setChatHistory]);

  return {
    historyMeta,
    setHistoryMeta,
    chatHistoryRef,
    isLoadingOlder,
    loadOlderMessages,
  } as const;
}
