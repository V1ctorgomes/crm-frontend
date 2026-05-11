import React, { useState, useEffect } from 'react';
import { Contact, Stage } from './types';
import { apiRequest } from '@/lib/api-client';
import { formatCpfCnpjInput, validateCreateTicketForm } from '@/lib/ticket-form-validation';

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
    const contact = contacts.find((c) => c.number === selectedContactNumber);
    if (contact) {
      setFormNome(contact.name || '');
      setFormEmail((contact.email || '').trim().toLowerCase());
      setFormCpf(formatCpfCnpjInput(contact.cnpj || ''));
    }
  }, [selectedContactNumber, contacts]);

  const handleCreateTicket = async () => {
    if (stages.length === 0) {
      return showFeedback('error', 'Configure pelo menos uma fase no funil antes de criar uma OS.');
    }
    const stageId = stages[0]?.id || '';
    const validated = validateCreateTicketForm({
      contactNumber: selectedContactNumber,
      nome: formNome,
      email: formEmail,
      cpf: formCpf,
      marca: formMarca,
      modelo: formModelo,
      customerType: formCustomerType,
      ticketType: formTicketType,
      stageId,
    });
    if (!validated.ok) {
      return showFeedback('error', validated.message);
    }

    setIsSubmitting(true);
    try {
      await apiRequest('/tickets', { method: 'POST', body: JSON.stringify(validated.body) });
      showFeedback('success', 'Ordem de Serviço (OS) criada com sucesso!');
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar OS.';
      showFeedback('error', msg);
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
            <label className="text-sm font-medium leading-none text-slate-700">
              Cliente / contacto <span className="text-red-600">*</span>
            </label>
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
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Nome completo *</label>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Ex: Maria Silva"
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">E-mail *</label>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="nome@empresa.pt"
                  maxLength={254}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  onBlur={(e) => setFormEmail(e.target.value.trim().toLowerCase())}
                />
                <p className="text-[10px] text-slate-500">Formato: parte local @ domínio (ex.: suporte@imagem.pt).</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">CPF ou CNPJ *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
                  value={formCpf}
                  onChange={(e) => setFormCpf(formatCpfCnpjInput(e.target.value))}
                />
                <p className="text-[10px] text-slate-500">11 dígitos (CPF) ou 14 dígitos (CNPJ); dígitos verificadores são validados.</p>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium leading-none text-slate-700">
                Marca <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
                value={formMarca}
                onChange={(e) => setFormMarca(e.target.value)}
                placeholder="Ex: Apple"
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium leading-none text-slate-700">
                Modelo <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
                value={formModelo}
                onChange={(e) => setFormModelo(e.target.value)}
                placeholder="Ex: iPhone 13"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium leading-none text-slate-700">
                Tipo de cliente <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
                value={formCustomerType}
                onChange={(e) => setFormCustomerType(e.target.value)}
                placeholder="Ex: Revenda"
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium leading-none text-slate-700">
                Tipo de solicitação <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
                value={formTicketType}
                onChange={(e) => setFormTicketType(e.target.value)}
                placeholder="Ex: Orçamento"
              />
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