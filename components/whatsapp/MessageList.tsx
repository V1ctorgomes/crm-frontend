import React from 'react';
import { Message } from './types';

interface MessageListProps {
  filteredMessages: Message[];
  chatSearchTerm: string;
  setViewerMessage: (msg: Message) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function MessageList({ filteredMessages, chatSearchTerm, setViewerMessage, messagesEndRef }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-2 z-10 no-scrollbar bg-slate-50/50">
      {filteredMessages.length === 0 && chatSearchTerm && (
        <div className="text-center text-slate-500 text-sm mt-4">Nenhuma mensagem encontrada.</div>
      )}
      
      {filteredMessages.map((msg) => (
        <div key={msg.id} className={`max-w-[85%] md:max-w-[70%] w-fit relative px-3 py-2 rounded-xl flex flex-col break-words shadow-sm ${msg.fromMe ? 'self-end bg-blue-600 text-white rounded-tr-sm' : 'self-start bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}>
          
          {msg.isMedia && msg.mediaData && (
            msg.mimeType?.startsWith('audio/') ? (
              <div className="mt-1 mb-1">
                <audio controls src={msg.mediaData} className="w-[220px] md:w-[260px] h-[40px] outline-none" />
              </div>
            ) : (
              <div className={`flex items-center gap-3 p-2 rounded-lg mb-1.5 mt-0.5 border ${msg.fromMe ? 'bg-blue-500 border-blue-400 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${msg.fromMe ? 'bg-blue-400/50' : 'bg-white border border-slate-200'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                  </div>
                  <div className="flex flex-col overflow-hidden w-full min-w-[120px] max-w-[200px]">
                    <span className="text-sm font-semibold truncate">{msg.fileName || 'Ficheiro'}</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-[10px] font-mono uppercase ${msg.fromMe ? 'text-blue-100' : 'text-slate-500'}`}>{msg.mimeType?.split('/')[1] || 'DOC'}</span>
                      <button onClick={() => setViewerMessage(msg)} className={`text-[10px] font-medium px-2 py-0.5 rounded cursor-pointer ${msg.fromMe ? 'bg-blue-500 hover:bg-blue-400' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}>Abrir</button>
                    </div>
                  </div>
              </div>
            )
          )}

          {msg.text && msg.text.trim() !== '' && (
            <span className="text-[14px] leading-relaxed">
              {chatSearchTerm ? msg.text.split(new RegExp(`(${chatSearchTerm})`, 'gi')).map((part, i) => part.toLowerCase() === chatSearchTerm.toLowerCase() ? <mark key={i} className="bg-yellow-300 text-black px-0.5 rounded">{part}</mark> : part) : msg.text}
            </span>
          )}

          <div className={`text-[10px] self-end mt-1 flex items-center gap-1 float-right ml-4 ${msg.fromMe ? 'text-blue-200' : 'text-slate-400'}`}>
            {msg.time}
            {msg.fromMe && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10.414 4.086a.75.75 0 0 1 1.06 0l4 4a.75.75 0 1 1-1.06 1.06l-3.47-3.47-3.47 3.47a.75.75 0 0 1-1.06-1.06l4-4Zm-4.95 4.95a.75.75 0 0 1 1.06 0l4 4a.75.75 0 1 1-1.06 1.06l-3.47-3.47-3.47 3.47a.75.75 0 0 1-1.06-1.06l4-4Z" clipRule="evenodd" /></svg>}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}