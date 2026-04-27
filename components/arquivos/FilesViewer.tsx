import React from 'react';
import { File, UploadCloud, FileBox, Image as ImageIcon, FileText, ExternalLink, Trash2, Loader2 } from 'lucide-react';
import { TicketFolder } from './types';

interface FilesViewerProps {
  selectedTicket: TicketFolder;
  pendingFile: File | null;
  fileDescription: string;
  setFileDescription: (val: string) => void;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cancelUpload: () => void;
  confirmUpload: () => void;
  handleDeleteFile: (fileId: string) => void;
}

export function FilesViewer({
  selectedTicket, pendingFile, fileDescription, setFileDescription, isUploading,
  fileInputRef, handleFileSelect, cancelUpload, confirmUpload, handleDeleteFile
}: FilesViewerProps) {
  
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {pendingFile ? (
        <div className="bg-white border border-blue-200 shadow-sm rounded-xl p-5 flex flex-col md:flex-row gap-4 items-center mb-2">
          <div className="flex-1 flex items-center gap-3 w-full">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center shrink-0">
              <File className="w-5 h-5" />
            </div>
            <div className="overflow-hidden min-w-0">
              <h4 className="font-semibold text-slate-800 text-sm truncate" title={pendingFile.name}>{pendingFile.name}</h4>
              <span className="text-[11px] font-medium text-slate-500">{formatSize(pendingFile.size)}</span>
            </div>
          </div>
          <div className="flex-[2] w-full min-w-0">
            <input 
              type="text" 
              placeholder="Adicionar legenda descritiva..." 
              className="w-full bg-white border border-slate-300 rounded-md px-3 h-10 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder:text-slate-400"
              value={fileDescription}
              onChange={e => setFileDescription(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={cancelUpload} className="flex-1 md:flex-none px-4 h-10 rounded-md font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors text-sm">Cancelar</button>
            <button onClick={confirmUpload} disabled={isUploading} className="flex-1 md:flex-none bg-slate-900 text-white px-5 h-10 rounded-md font-medium text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-70">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()} 
          className="w-full bg-white border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 hover:border-blue-400 transition-colors mb-2 group"
        >
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3 group-hover:text-blue-600 group-hover:bg-white border border-slate-100 shadow-sm transition-all duration-300">
            <UploadCloud className="w-6 h-6" />
          </div>
          <span className="font-medium text-slate-700 text-sm group-hover:text-blue-700 transition-colors">Clique para anexar um ficheiro</span>
        </div>
      )}

      {selectedTicket.files.length === 0 && !pendingFile ? (
         <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 border-dashed">
           <FileBox className="w-12 h-12 text-slate-300 mb-3" strokeWidth={1} />
           <p className="text-slate-500 font-medium text-sm">Sem anexos ainda.</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {selectedTicket.files.map(file => (
            <div key={file.id} className="bg-white border border-slate-200 rounded-xl flex flex-col hover:shadow-md transition-all group overflow-hidden relative">
              <div className="p-4 flex items-start gap-3">
                <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center border ${file.mimeType.includes('image') ? 'bg-blue-50 border-blue-100 text-blue-600' : file.mimeType.includes('pdf') ? 'bg-red-50 border-red-100 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                   {file.mimeType.includes('image') ? <ImageIcon className="w-5 h-5" />
                    : file.mimeType.includes('pdf') ? <FileText className="w-5 h-5" />
                    : <File className="w-5 h-5" />}
                </div>
                
                <div className="flex-1 min-w-0 pr-6">
                  <h4 className="font-semibold text-sm text-slate-800 truncate" title={file.fileName}>{file.fileName}</h4>
                  <div className="flex items-center gap-2 mt-0.5 mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">{file.mimeType.split('/')[1] || 'DOC'}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{formatSize(file.size)}</span>
                  </div>
                </div>

                <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-1 rounded-md">
                   <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Abrir/Descarregar"><ExternalLink className="w-4 h-4" /></a>
                   <button onClick={() => handleDeleteFile(file.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              {file.description && (
                <div className="px-4 pb-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {file.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}