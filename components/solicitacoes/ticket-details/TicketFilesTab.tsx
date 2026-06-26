import React, { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { apiRequest, apiDelete } from '@/lib/api-client';
import { toProxiedStorageUrl } from '@/lib/proxied-storage-url';
import type { Ticket } from '../types';
import { formatFileSize } from './format-size';

interface TicketFilesTabProps {
  ticket: Ticket;
  onTicketUpdated: () => void;
  showFeedback: (type: 'success' | 'error', msg: string) => void;
  setConfirmModal: (modal: any) => void;
}

const FILE_ICON_PATH =
  'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z';

/** Aba de anexos: upload com pré-confirmação + grelha de ficheiros já carregados. */
export function TicketFilesTab({ ticket, onTicketUpdated, showFeedback, setConfirmModal }: TicketFilesTabProps) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showFeedback('error', 'Arquivo muito grande (máx 15MB).');
      return;
    }
    setPendingFile(file);
    setFileDescription('');
  };

  const confirmUploadFile = async () => {
    if (!pendingFile) return;
    setIsUploadingFile(true);
    const formData = new FormData();
    formData.append('file', pendingFile);
    if (fileDescription.trim()) formData.append('description', fileDescription.trim());

    try {
      await apiRequest(`/tickets/${ticket.id}/files`, { method: 'POST', body: formData });
      setPendingFile(null);
      setFileDescription('');
      onTicketUpdated();
      showFeedback('success', 'Arquivo anexado com sucesso!');
    } catch {
      showFeedback('error', 'Erro de conexão.');
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = (fileId: string) => {
    setConfirmModal({
      title: 'Remover Anexo?',
      message: 'Tem a certeza que deseja apagar este ficheiro? Não poderá ser recuperado.',
      onConfirm: async (deleteReason?: string) => {
        try {
          await apiDelete(`/tickets/files/${fileId}`, deleteReason);
          onTicketUpdated();
          showFeedback('success', 'Ficheiro removido.');
        } catch {
          showFeedback('error', 'Erro ao remover ficheiro.');
        }
        setConfirmModal(null);
      },
      onClose: () => setConfirmModal(null),
    });
  };

  const cancelUpload = () => {
    setPendingFile(null);
    setFileDescription('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const files = ticket.files || [];

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-slate-50/50">
      {pendingFile ? (
        <div className="bg-white border border-brand-200 shadow-sm rounded-lg p-5 flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-md flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d={FILE_ICON_PATH} />
              </svg>
            </div>
            <div className="overflow-hidden">
              <h4 className="font-medium text-slate-800 text-sm truncate">{pendingFile.name}</h4>
              <span className="text-[11px] text-slate-500">{formatFileSize(pendingFile.size)}</span>
            </div>
          </div>
          <input
            type="text"
            placeholder="Legenda (Opcional)"
            className="flex h-9 w-full rounded-md border border-slate-300 px-3 py-1 text-sm focus:outline-none"
            value={fileDescription}
            onChange={(e) => setFileDescription(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={cancelUpload}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-slate-200 h-9 px-4"
            >
              Cancelar
            </button>
            <button
              onClick={confirmUploadFile}
              disabled={isUploadingFile}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-brand-600 text-white h-9 px-4"
            >
              {isUploadingFile ? 'Enviando...' : 'Upload'}
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-white border border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 transition-colors mb-6"
        >
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
              />
            </svg>
          </div>
          <span className="font-medium text-slate-700 text-sm">Anexar Ficheiro</span>
        </div>
      )}

      {files.length === 0 && !pendingFile ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <p className="text-sm font-medium">Sem anexos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {files.map((file) => (
            <div key={file.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-3 group relative shadow-sm">
              <div
                className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 border border-slate-100 ${
                  file.mimeType.includes('image') ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={FILE_ICON_PATH} />
                </svg>
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <h4 className="font-medium text-xs text-slate-800 truncate">{file.fileName}</h4>
                <div className="text-[11px] text-slate-500 mt-0.5 mb-1">{formatFileSize(file.size)}</div>
              </div>
              <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={toProxiedStorageUrl(file.fileUrl) || file.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-brand-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                </a>
                <button onClick={() => handleDeleteFile(file.id)} className="p-1.5 text-slate-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
