import React from 'react';

/** Modal de selecção de caixa de entrada (instância) na barra lateral do WhatsApp. */
export const InstanceModal = ({ onClose, instances, selectedInstance, setSelectedInstance, handleSelectContact }: any) => (
  <div className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
    <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200" onClick={e => e.stopPropagation()}>
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
        <div className="flex flex-col"><h3 className="font-semibold text-lg text-slate-800">Caixas de Entrada</h3><p className="text-xs text-slate-500">Filtrar conversas por instância</p></div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
      </div>
      <div className="p-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
        <button onClick={() => { setSelectedInstance('ALL'); handleSelectContact(null); onClose(); }} className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-all text-left ${selectedInstance === 'ALL' ? 'bg-brand-50 border-brand-200 text-brand-800' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
           <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${selectedInstance === 'ALL' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" /></svg></div>
           <div className="flex flex-col"><span className="text-sm font-medium">Todas as Caixas</span></div>
        </button>
        {instances.map((inst: any) => (
          <button key={inst.id} onClick={() => { setSelectedInstance(inst.name); handleSelectContact(null); onClose(); }} className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-all text-left ${selectedInstance === inst.name ? 'bg-brand-50 border-brand-200 text-brand-800' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
             <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${selectedInstance === inst.name ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{inst.name.substring(0, 2).toUpperCase()}</div>
             <div className="flex flex-col"><span className="text-sm font-medium">{inst.name}</span></div>
          </button>
        ))}
      </div>
    </div>
  </div>
);
