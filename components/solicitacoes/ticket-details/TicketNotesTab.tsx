import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { apiRequest, apiDelete } from '@/lib/api-client';
import type { Ticket } from '../types';

interface TicketNotesTabProps {
  ticket: Ticket;
  onTicketUpdated: () => void;
  showFeedback: (type: 'success' | 'error', msg: string) => void;
  setConfirmModal: (modal: any) => void;
}

/** Aba de notas internas: lista de notas + composer. */
export function TicketNotesTab({ ticket, onTicketUpdated, showFeedback, setConfirmModal }: TicketNotesTabProps) {
  const [newNoteText, setNewNoteText] = useState('');

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    try {
      await apiRequest(`/tickets/${ticket.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ text: newNoteText }),
      });
      setNewNoteText('');
      onTicketUpdated();
      showFeedback('success', 'Nota adicionada ao histórico!');
    } catch {
      showFeedback('error', 'Erro ao adicionar nota.');
    }
  };

  const handleDeleteNote = (noteId: string) => {
    setConfirmModal({
      title: 'Apagar Nota?',
      message: 'Tem a certeza que deseja apagar esta nota? Esta ação é irreversível.',
      onConfirm: async (deleteReason?: string) => {
        try {
          await apiDelete(`/tickets/notes/${noteId}`, deleteReason);
          onTicketUpdated();
          showFeedback('success', 'Nota apagada.');
        } catch {
          showFeedback('error', 'Erro ao apagar nota.');
        }
        setConfirmModal(null);
      },
      onClose: () => setConfirmModal(null),
    });
  };

  const notes = ticket.notes || [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 p-6 overflow-y-auto">
        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p className="text-sm font-medium">Nenhuma nota adicionada.</p>
          </div>
        )}
        <div className="flex flex-col gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm group w-[90%] flex flex-col relative"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-medium text-slate-500">{new Date(note.createdAt).toLocaleString('pt-PT')}</span>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-700 text-sm whitespace-pre-wrap break-all">{note.text}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
        <div className="flex flex-col gap-2">
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-600 resize-none"
            placeholder="Escreva uma nota..."
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              onClick={handleAddNote}
              disabled={!newNoteText.trim()}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-brand-600 text-white h-9 px-4 py-2 disabled:opacity-50"
            >
              Adicionar Nota
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
