'use client';

import React, { useEffect, useRef } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Message } from './types';
import { canDeleteMessageByTime, canEditMessageByTime } from '@/lib/whatsapp-message-windows';

type Props = {
  x: number;
  y: number;
  message: Message;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
};

export function MessageContextMenu({ x, y, message, onClose, onDelete, onEdit }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) return;
      onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', down, true);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down, true);
      document.removeEventListener('keydown', key);
    };
  }, [onClose]);

  const baseOwn = message.fromMe && typeof message.id !== 'number';
  const canDelete = baseOwn && canDeleteMessageByTime(message.sentAt);
  const canEdit =
    baseOwn &&
    !message.isMedia &&
    !!(message.text && message.text.trim()) &&
    canEditMessageByTime(message.sentAt);

  if (!canDelete && !canEdit) return null;

  const w = typeof window !== 'undefined' ? window.innerWidth : 400;
  const h = typeof window !== 'undefined' ? window.innerHeight : 400;
  const menuW = 184;
  const menuH = (canEdit ? 40 : 0) + (canDelete ? 40 : 0) + 16;
  const left = Math.max(8, Math.min(x, w - menuW - 8));
  const top = Math.max(8, Math.min(y, h - menuH - 8));

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-[3000] min-w-[168px] rounded-lg border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5"
      style={{ left, top }}
    >
      {canEdit && (
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => {
            onEdit();
            onClose();
          }}
        >
          <Pencil className="h-4 w-4 shrink-0 text-brand-600" />
          Editar mensagem
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          onClick={() => {
            onDelete();
            onClose();
          }}
        >
          <Trash2 className="h-4 w-4 shrink-0" />
          Apagar para todos
        </button>
      )}
    </div>
  );
}
