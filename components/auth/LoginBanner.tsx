import React from 'react';

export function LoginBanner() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900 items-center justify-center border-r border-slate-800">
      {/* Fundo com Gradiente Sofisticado */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-slate-900 to-slate-900 z-0"></div>
      
      {/* Padrões Geométricos Suaves ao Fundo */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[80px] z-0"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[100px] z-0"></div>

      {/* Conteúdo Institucional */}
      <div className="relative z-10 flex flex-col p-16 max-w-2xl">
        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-8 shadow-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 20.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
          </svg>
        </div>
        
        <h2 className="text-4xl font-bold text-white leading-tight mb-6">
          Acelere a sua operação e unifique o atendimento ao cliente.
        </h2>
        
        <p className="text-lg text-blue-100/80 font-medium leading-relaxed max-w-lg">
          O nosso CRM consolida a sua gestão de processos, base de dados e WhatsApp numa interface rápida, moderna e intuitiva.
        </p>

        <div className="mt-12 flex items-center gap-4">
          <div className="flex -space-x-3">
            <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-blue-100 flex items-center justify-center font-bold text-xs text-blue-800">A</div>
            <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-emerald-100 flex items-center justify-center font-bold text-xs text-emerald-800">B</div>
            <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-purple-100 flex items-center justify-center font-bold text-xs text-purple-800">C</div>
          </div>
          <p className="text-sm font-medium text-blue-200">Junte-se à sua equipa.</p>
        </div>
      </div>
    </div>
  );
}