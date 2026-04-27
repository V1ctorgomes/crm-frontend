import React, { useState } from 'react';
import { Contact, Stage } from '@/types';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  stages: Stage[];
  baseUrl: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function NewTicketModal({ isOpen, onClose, contacts, stages, baseUrl, onSuccess, onError }: Props) {
  const [selectedContactNumber, setSelectedContactNumber] = useState('');
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [formCustomerType, setFormCustomerType] = useState('');
  const [formTicketType, setFormTicketType] = useState('');

  if (!isOpen) return null;

  const handleContactSelect = (number: string) => {
    setSelectedContactNumber(number);
    const contact = contacts.find(c => c.number === number);
    if (contact) {
      setFormNome(contact.name || '');
      setFormEmail(contact.email || '');
      setFormCpf(contact.cnpj || '');
    }
  };

  const handleCreate = async () => {
    if (!selectedContactNumber || stages.length === 0) return onError("Selecione um cliente e garanta que existe uma fase no funil.");
    
    const body = { 
      contactNumber: selectedContactNumber, nome: formNome, email: formEmail, cpf: formCpf, 
      marca: formMarca, modelo: formModelo, customerType: formCustomerType, ticketType: formTicketType, stageId: stages[0].id 
    };

    try {
      const res = await fetch(`${baseUrl}/tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        onSuccess('Ordem de Serviço criada com sucesso!');
        onClose();
      } else onError('Erro ao criar OS.');
    } catch (err) { onError('Erro de conexão ao criar OS.'); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg flex flex-col animate-in zoom-in-95 border border-slate-200" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-lg">Nova Solicitação (OS)</h3>
            <p className="text-sm text-slate-500">Crie uma nova OS e insira no funil.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Cliente / Contato</label>
            <select className="flex h-10 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={selectedContactNumber} onChange={e => handleContactSelect(e.target.value)}>
              <option value="">-- Selecione o cliente --</option>
              {contacts.map(c => <option key={c.number} value={c.number}>{c.name || 'Sem nome'} ({c.number})</option>)}
            </select>
          </div>
          {selectedContactNumber && (
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-col gap-3">
              <input type="text" placeholder="Nome Completo" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:border-blue-500" value={formNome} onChange={e => setFormNome(e.target.value)} />
              <input type="email" placeholder="Endereço de E-mail" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:border-blue-500" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
              <input type="text" placeholder="CPF / CNPJ" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-mono outline-none focus:ring-2 focus:border-blue-500" value={formCpf} onChange={e => setFormCpf(e.target.value)} />
            </div>
          )}
          <div className="flex gap-4">
            <div className="flex-1 space-y-2"><label className="text-sm font-medium">Marca</label><input type="text" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500" value={formMarca} onChange={e => setFormMarca(e.target.value)} /></div>
            <div className="flex-1 space-y-2"><label className="text-sm font-medium">Modelo</label><input type="text" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500" value={formModelo} onChange={e => setFormModelo(e.target.value)} /></div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2"><label className="text-sm font-medium">Tipo Cliente</label><input type="text" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500" value={formCustomerType} onChange={e => setFormCustomerType(e.target.value)} /></div>
            <div className="flex-1 space-y-2"><label className="text-sm font-medium">Tipo OS</label><input type="text" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500" value={formTicketType} onChange={e => setFormTicketType(e.target.value)} /></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-6 pt-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="h-10 px-4 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-100">Cancelar</button>
          <button onClick={handleCreate} className="h-10 px-4 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800">Criar OS</button>
        </div>
      </div>
    </div>
  );
}