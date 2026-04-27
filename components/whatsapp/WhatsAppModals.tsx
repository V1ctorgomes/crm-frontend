import React from 'react';
import { Contact, Message } from './types';

export const InstanceModal = ({ onClose, instances, selectedInstance, setSelectedInstance, handleSelectContact }: any) => (
  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
    <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200" onClick={e => e.stopPropagation()}>
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
        <div className="flex flex-col"><h3 className="font-semibold text-lg text-slate-800">Caixas de Entrada</h3><p className="text-xs text-slate-500">Filtrar conversas por instância</p></div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
      </div>
      <div className="p-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
        <button onClick={() => { setSelectedInstance('ALL'); handleSelectContact(null); onClose(); }} className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-all text-left ${selectedInstance === 'ALL' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
           <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${selectedInstance === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" /></svg></div>
           <div className="flex flex-col"><span className="text-sm font-medium">Todas as Caixas</span></div>
        </button>
        {instances.map((inst: any) => (
          <button key={inst.id} onClick={() => { setSelectedInstance(inst.name); handleSelectContact(null); onClose(); }} className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-all text-left ${selectedInstance === inst.name ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
             <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${selectedInstance === inst.name ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{inst.name.substring(0, 2).toUpperCase()}</div>
             <div className="flex flex-col"><span className="text-sm font-medium">{inst.name}</span></div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

export const DeleteChatModal = ({ onClose, onConfirm }: any) => (
  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
    <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200" onClick={e => e.stopPropagation()}>
      <div className="p-6 text-center">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Excluir Conversa?</h3><p className="text-sm text-slate-500">Tem a certeza que deseja apagar todas as mensagens desta conversa? Esta ação é irreversível.</p>
      </div>
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 h-10 rounded-md font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white transition-colors text-sm">Cancelar</button>
        <button onClick={onConfirm} className="bg-red-600 text-white px-4 h-10 rounded-md font-medium text-sm hover:bg-red-700 transition-colors">Excluir</button>
      </div>
    </div>
  </div>
);

export const CreateTicketModal = ({ onClose, formNome, setFormNome, formEmail, setFormEmail, formCpf, setFormCpf, formMarca, setFormMarca, formModelo, setFormModelo, formCustomerType, setFormCustomerType, formTicketType, setFormTicketType, handleCreateTicket }: any) => (
  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
    <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200" onClick={e => e.stopPropagation()}>
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center"><h3 className="font-semibold text-lg text-slate-900">Nova Solicitação (OS)</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button></div>
      <div className="p-6 flex flex-col gap-4">
        <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Nome do Cliente</label><input type="text" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={formNome} onChange={e => setFormNome(e.target.value)} /></div>
        <div className="space-y-2"><label className="text-sm font-medium text-slate-700">E-mail</label><input type="email" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={formEmail} onChange={e => setFormEmail(e.target.value)} /></div>
        <div className="space-y-2"><label className="text-sm font-medium text-slate-700">CPF / CNPJ</label><input type="text" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={formCpf} onChange={e => setFormCpf(e.target.value)} /></div>
        <div className="flex gap-4">
          <div className="flex-1 space-y-2"><label className="text-sm font-medium text-slate-700">Marca</label><input type="text" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={formMarca} onChange={e => setFormMarca(e.target.value)} /></div>
          <div className="flex-1 space-y-2"><label className="text-sm font-medium text-slate-700">Modelo</label><input type="text" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={formModelo} onChange={e => setFormModelo(e.target.value)} /></div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 space-y-2"><label className="text-sm font-medium text-slate-700">Tipo de Cliente</label><input type="text" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={formCustomerType} onChange={e => setFormCustomerType(e.target.value)} placeholder="Ex: Revenda" /></div>
          <div className="flex-1 space-y-2"><label className="text-sm font-medium text-slate-700">Tipo de OS</label><input type="text" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={formTicketType} onChange={e => setFormTicketType(e.target.value)} placeholder="Ex: Orçamento" /></div>
        </div>
      </div>
      <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50"><button onClick={onClose} className="px-4 h-10 rounded-md font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white transition-colors text-sm">Cancelar</button><button onClick={handleCreateTicket} className="bg-slate-900 text-white px-4 h-10 rounded-md font-medium hover:bg-slate-800 transition-colors text-sm">Criar OS</button></div>
    </div>
  </div>
);

export const MediaViewerModal = ({ viewerMessage, onClose }: { viewerMessage: Message, onClose: () => void }) => (
  <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 md:p-8 animate-in fade-in" onClick={onClose}>
    <div className="bg-white rounded-xl shadow-lg flex flex-col w-full max-w-4xl h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
        <span className="font-semibold text-slate-800 text-sm truncate">{viewerMessage.fileName || 'Visualizador'}</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
      </div>
      <div className="flex-1 bg-slate-50 flex items-center justify-center overflow-hidden p-4">
        {viewerMessage.mimeType?.startsWith('image/') ? <img src={viewerMessage.mediaData} alt="" className="max-w-full max-h-full object-contain rounded" /> : viewerMessage.mimeType?.startsWith('video/') ? <video src={viewerMessage.mediaData} controls autoPlay className="max-w-full max-h-full outline-none rounded" /> : viewerMessage.mimeType?.includes('pdf') ? <iframe src={`${viewerMessage.mediaData}#toolbar=0`} className="w-full h-full border border-slate-200 rounded bg-white" /> : <div className="text-slate-500 text-sm">Formato indisponível.</div>}
      </div>
      <div className="px-6 py-4 border-t border-slate-200 flex justify-end bg-white">
        <a href={viewerMessage.mediaData} download={viewerMessage.fileName || 'download'} target="_blank" rel="noopener noreferrer" className="bg-slate-900 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-slate-800 transition-colors flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>Descarregar Arquivo</a>
      </div>
    </div>
  </div>
);