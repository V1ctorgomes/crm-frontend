import React, { useState, useEffect } from 'react';
import { Contact, Stage } from './types';
import { apiRequest } from '@/lib/api-client';

interface NewTicketModalProps {
  contacts: Contact[];
  stages: Stage[];
  baseUrl: string;
  onClose: () => void;
  onSuccess: () => void;
  showFeedback: (type: 'success' | 'error', msg: string) => void;
}

export function NewTicketModal({ contacts, stages, baseUrl, onClose, onSuccess, showFeedback }: NewTicketModalProps) {
  const [selectedContactNumber, setSelectedContactNumber] = useState('');
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [formCustomerType, setFormCustomerType] = useState('');
  const [formTicketType, setFormTicketType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const contact = contacts.find(c => c.number === selectedContactNumber);
    if (contact) { 
      setFormNome(contact.name || ''); 
      setFormEmail(contact.email || ''); 
      setFormCpf(contact.cnpj || ''); 
    }
  }, [selectedContactNumber, contacts]);

  const handleCreateTicket = async () => {
    if (!selectedContactNumber || stages.length === 0) {
      return showFeedback('error', "Selecione um cliente e garanta que existe uma fase ativa no funil.");
    }
    
    setIsSubmitting(true);
    const body = { 
      contactNumber: selectedContactNumber, 
      nome: formNome, 
      email: formEmail, 
      cpf: formCpf, 
      marca: formMarca, 
      modelo: formModelo, 
      customerType: formCustomerType,
      ticketType: formTicketType,
      stageId: stages[0].id 
    };
    
    try {
      await apiRequest('/tickets', { method: 'POST', body: JSON.stringify(body) });
      showFeedback('success', 'Ordem de Serviço (OS) criada com sucesso!');
      onSuccess();
    } catch (err) { 
      showFeedback('error', 'Erro de conexão ao criar OS.'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-950/45 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200" onMouseDown={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200" onMouseDown={e => e.stopPropagation()}>
        <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100">
          <h3 className="font-semibold leading-none tracking-tight text-lg">Nova Solicitação (OS)</h3>
          <p className="text-sm text-slate-500">Crie uma nova Ordem de Serviço e insira no funil.</p>
        </div>
        
        <div className="p-6 flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">Cliente / Contato</label>
            <select 
              className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 text-brand-950" 
              value={selectedContactNumber} 
              onChange={(e) => setSelectedContactNumber(e.target.value)}
            >
              <option value="">-- Selecione o cliente --</option>
              {contacts.map(c => <option key={c.number} value={c.number}>{c.name || 'Sem nome'} ({c.number})</option>)}
            </select>
          </div>
          
          {selectedContactNumber && (
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-col gap-3">
              <input type="text" placeholder="Nome Completo" className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600" value={formNome} onChange={e => setFormNome(e.target.value)} />
              <input type="email" placeholder="Endereço de E-mail" className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
              <input type="text" placeholder="CPF / CNPJ" className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600" value={formCpf} onChange={e => setFormCpf(e.target.value)} />
            </div>
          )}
          
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium leading-none text-slate-700">Marca</label>
              <input type="text" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600" value={formMarca} onChange={e => setFormMarca(e.target.value)} placeholder="Ex: Apple" />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium leading-none text-slate-700">Modelo</label>
              <input type="text" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600" value={formModelo} onChange={e => setFormModelo(e.target.value)} placeholder="Ex: iPhone 13" />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium leading-none text-slate-700">Tipo de Cliente (Opcional)</label>
              <input type="text" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600" value={formCustomerType} onChange={e => setFormCustomerType(e.target.value)} placeholder="Ex: Revenda" />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium leading-none text-slate-700">Tipo de Solicitação</label>
              <input type="text" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600" value={formTicketType} onChange={e => setFormTicketType(e.target.value)} placeholder="Ex: Orçamento" />
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-2 p-6 pt-0">
          <button onClick={onClose} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-brand-950 h-10 px-4 py-2 border border-slate-200">Cancelar</button>
          <button onClick={handleCreateTicket} disabled={isSubmitting} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-brand-600 text-white hover:bg-brand-700 h-10 px-4 py-2 disabled:opacity-50">
            {isSubmitting ? 'A criar...' : 'Criar OS'}
          </button>
        </div>
      </div>
    </div>
  );
}