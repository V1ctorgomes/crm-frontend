import React from 'react';

/** Splash mostrado no painel principal quando nenhum contacto está aberto. */
export function WhatsAppEmptyChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center z-10 bg-slate-50/50 p-6 text-center">
      <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-4 shadow-sm text-brand-600">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Central de Mensagens</h2>
      <p className="text-sm text-slate-500 max-w-sm">
        Selecione um contato na barra lateral ou inicie uma nova conversa para enviar mensagens, ficheiros e áudios.
      </p>
    </div>
  );
}
