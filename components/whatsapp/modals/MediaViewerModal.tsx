import React from 'react';
import type { Message } from '../types';
import { VoiceNotePlayer } from '../VoiceNotePlayer';
import { safeMediaUrlOrEmpty } from '@/lib/safe-media-url';

/** Pré-visualização de mídia recebida/enviada (imagem, vídeo, áudio, PDF). */
export const MediaViewerModal = ({ viewerMessage, onClose }: { viewerMessage: Message; onClose: () => void }) => {
  const mediaUrl = safeMediaUrlOrEmpty(viewerMessage.mediaData);

  return (
    <div
      className="fixed inset-0 bg-brand-950/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4 md:p-8 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg flex flex-col w-full max-w-4xl h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
          <span className="font-semibold text-slate-800 text-sm truncate">
            {viewerMessage.fileName || 'Visualizador'}
          </span>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 bg-slate-50 flex items-center justify-center overflow-hidden p-4">
          {!mediaUrl ? (
            <p className="text-center text-slate-500 text-sm">URL de mídia inválida ou bloqueada.</p>
          ) : viewerMessage.mimeType?.startsWith('image/') ? (
            <img src={mediaUrl} alt="" className="max-w-full max-h-full object-contain rounded" />
          ) : viewerMessage.mimeType?.startsWith('video/') ? (
            <video src={mediaUrl} controls autoPlay className="max-w-full max-h-full rounded outline-none" />
          ) : viewerMessage.mimeType?.startsWith('audio/') ? (
            <div className="w-full max-w-md px-2">
              <VoiceNotePlayer
                src={mediaUrl}
                mimeType={viewerMessage.mimeType ?? 'audio/webm'}
                className="h-12"
              />
            </div>
          ) : viewerMessage.mimeType?.includes('pdf') ? (
            <iframe
              src={`${mediaUrl}#toolbar=0`}
              className="h-full w-full rounded border border-slate-200 bg-white"
              title={viewerMessage.fileName || 'PDF'}
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <p className="text-center text-slate-500 text-sm">
              Pré-visualização não disponível para este tipo. Use «Descarregar» abaixo.
            </p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end bg-white">
          {mediaUrl ? (
            <a
              href={mediaUrl}
              download={viewerMessage.fileName || 'download'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-brand-700 transition-colors"
            >
              Descarregar ficheiro
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
};
