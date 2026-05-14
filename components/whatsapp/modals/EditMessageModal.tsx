import React from 'react';

type EditMessageModalProps = {
  onClose: () => void;
  draft: string;
  setDraft: (v: string) => void;
  onSave: () => void;
  isSaving: boolean;
};

/** Edição de mensagem de texto enviada (até ~14 min após o envio, limite do WhatsApp). */
export function EditMessageModal({ onClose, draft, setDraft, onSave, isSaving }: EditMessageModalProps) {
  return (
    <div
      className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[1001] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-lg text-brand-950">Editar mensagem</h3>
          <p className="text-xs text-slate-500 mt-1">
            Só mensagens de texto enviadas por si. No WhatsApp só é possível editar até <strong>14 minutos</strong> após o envio.
          </p>
        </div>
        <div className="p-6">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 resize-y min-h-[100px]"
            disabled={isSaving}
          />
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 h-10 rounded-md font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white transition-colors text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || !draft.trim()}
            className="bg-brand-600 text-white px-4 h-10 rounded-md font-medium text-sm hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'A guardar…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
