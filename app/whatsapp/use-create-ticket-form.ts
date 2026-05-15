'use client';

import { useCallback, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { formatCpfCnpjInput, validateCreateTicketForm } from '@/lib/ticket-form-validation';
import { ticketFormFieldsFromCompany, solicitanteCpfFromContact, type Company } from '@/lib/companies';
import type { Contact, Stage } from '@/components/whatsapp/types';

interface UseCreateTicketFormArgs {
  showFeedback: (type: 'success' | 'error', msg: string) => void;
}

/** Estado e handlers do modal «Nova OS» disparado a partir do WhatsApp. */
export function useCreateTicketForm({ showFeedback }: UseCreateTicketFormArgs) {
  const [isOpen, setIsOpen] = useState(false);
  const [formNome, setFormNome] = useState('');
  const [formCompanyCnpj, setFormCompanyCnpj] = useState('');
  const [formSolicitanteCpf, setFormSolicitanteCpf] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [formCustomerType, setFormCustomerType] = useState('');
  const [formTicketType, setFormTicketType] = useState('');
  const [formCompanyId, setFormCompanyId] = useState('');

  const applyCompanyFields = useCallback((company: Company) => {
    const fields = ticketFormFieldsFromCompany(company);
    setFormNome(fields.nome);
    setFormCompanyCnpj(fields.cpf);
  }, []);

  const openFor = (contact: Contact) => {
    setFormEmail((contact.email || '').trim().toLowerCase());
    setFormSolicitanteCpf(solicitanteCpfFromContact(contact.cnpj));
    setFormMarca('');
    setFormModelo('');
    setFormCustomerType('');
    setFormTicketType('');
    const list = contact.companies || [];
    if (list.length === 1) {
      setFormCompanyId(list[0].id);
      applyCompanyFields(list[0]);
    } else {
      setFormCompanyId('');
      setFormNome('');
      setFormCompanyCnpj('');
    }
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  const onSelectCompany = useCallback(
    (companyId: string, companies: Company[]) => {
      setFormCompanyId(companyId);
      const co = companies.find((c) => c.id === companyId);
      if (co) applyCompanyFields(co);
      else {
        setFormNome('');
        setFormCompanyCnpj('');
      }
    },
    [applyCompanyFields],
  );

  const submit = async (contact: Contact, stages: Stage[]) => {
    if (stages.length === 0) {
      showFeedback('error', 'Nenhuma fase de Kanban configurada.');
      return;
    }
    const stageId = stages[0]?.id || '';
    const availableCompanyIds = (contact.companies || []).map((c) => c.id);
    const validated = validateCreateTicketForm({
      contactNumber: contact.number,
      nome: formNome,
      email: formEmail,
      cpf: formSolicitanteCpf,
      marca: formMarca,
      modelo: formModelo,
      customerType: formCustomerType,
      ticketType: formTicketType,
      stageId,
      availableCompanyIds,
      companyId: formCompanyId || undefined,
    });
    if (!validated.ok) {
      showFeedback('error', validated.message);
      return;
    }
    try {
      await apiRequest('/tickets', { method: 'POST', body: JSON.stringify(validated.body) });
      setIsOpen(false);
      showFeedback('success', 'OS criada no Kanban!');
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'Erro ao criar a solicitação.');
    }
  };

  return {
    isOpen,
    openFor,
    close,
    submit,
    formNome,
    formCompanyCnpj,
    formSolicitanteCpf,
    setFormSolicitanteCpf,
    formEmail,
    setFormEmail,
    formMarca,
    setFormMarca,
    formModelo,
    setFormModelo,
    formCustomerType,
    setFormCustomerType,
    formTicketType,
    setFormTicketType,
    formCompanyId,
    onSelectCompany,
  } as const;
}
