import React from 'react';

interface FilePreviewProps {
  previewFile: File;
  previewUrl: string;
  cancelPreview: () => void;
  inputText: string;
  setInputText: (val: string) => void;
  handleSendMessage: () => void;
  isSending: boolean;
}

export function FilePreview({
  previewFile, previewUrl, cancelPreview, inputText, setInputText, handleSendMessage, isSending
}: FilePreviewProps) {
  return (
    <div className="absolute inset-0 top-[68px] bg-slate-50/95 backdrop-blur-sm z-30 flex flex-col items-center justify-between">
      <div className="w-full flex justify-between p-4">
        <button onClick={cancelPreview} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 shadow-sm transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center w-full px-6">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-slate-200 p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              {previewFile.type.startsWith('image/') ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>}
            </div>
            <h3 className="font-semibold text-slate-800 text-base break-all line-clamp-2">{previewFile.name}</h3>
            <span className="text-xs text-slate-500 mt-1">{(previewFile.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
      </div>
      <div className="w-full bg-white p-4 border-t border-slate-200 shrink-0">
         <div className="w-full max-w-2xl mx-auto flex gap-2 items-center">
            <input 
              type="text" 
              placeholder="Adicione uma legenda..." 
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)} 
              onKeyDown={(e) => { if(e.key === 'Enter') handleSendMessage() }} 
              autoFocus 
            />
            <button onClick={handleSendMessage} disabled={isSending} className="h-10 px-4 rounded-md bg-slate-900 text-white font-medium text-sm flex items-center justify-center hover:bg-slate-800 transition-all shrink-0 disabled:opacity-50">
              {isSending ? 'A enviar...' : 'Enviar'}
            </button>
         </div>
      </div>
    </div>
  );
}