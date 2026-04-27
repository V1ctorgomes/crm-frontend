import React from 'react';

interface ChatInputProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRecording: boolean;
  recordingTime: number;
  inputText: string;
  setInputText: (val: string) => void;
  isSending: boolean;
  previewFile: File | null;
  startRecording: () => void;
  cancelRecording: () => void;
  stopRecordingAndSend: () => void;
  handleSendMessage: () => void;
}

export function ChatInput({
  fileInputRef, handleFileUpload, isRecording, recordingTime, inputText, setInputText, 
  isSending, previewFile, startRecording, cancelRecording, stopRecordingAndSend, handleSendMessage
}: ChatInputProps) {
  
  const formatRecordingTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-white p-3 md:px-4 flex items-center gap-2 shrink-0 z-10 border-t border-slate-200">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf,video/*,audio/*" />
      
      {!isRecording && (
        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" /></svg>
        </button>
      )}

      <div className="flex-1 relative flex items-center h-10">
        {isRecording ? (
          <div className="w-full h-full flex items-center justify-between bg-red-50 rounded-md px-4 border border-red-100 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-600 font-medium text-sm tabular-nums">{formatRecordingTime(recordingTime)}</span>
            </div>
            <button type="button" onClick={cancelRecording} className="text-red-600 hover:text-red-800 text-xs font-medium">Cancelar</button>
          </div>
        ) : (
          <input 
            type="text" 
            placeholder="Escreva a sua mensagem..." 
            className="w-full h-full bg-white border border-slate-300 rounded-md px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-slate-400" 
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)} 
            onKeyDown={(e) => { if(e.key === 'Enter') handleSendMessage() }}
            disabled={isSending} 
          />
        )}
      </div>

      {!inputText.trim() && !previewFile && !isRecording ? (
        <button type="button" onClick={startRecording} className="w-10 h-10 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>
        </button>
      ) : isRecording ? (
        <button type="button" onClick={stopRecordingAndSend} disabled={isSending} className="w-10 h-10 rounded-md bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shrink-0">
           {isSending ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>}
        </button>
      ) : (
        <button type="button" onClick={() => handleSendMessage()} disabled={isSending || !inputText.trim()} className="w-10 h-10 rounded-md bg-slate-900 text-white flex items-center justify-center disabled:opacity-50 hover:bg-slate-800 transition-colors shrink-0">
          {isSending ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 ml-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>}
        </button>
      )}
    </div>
  );
}