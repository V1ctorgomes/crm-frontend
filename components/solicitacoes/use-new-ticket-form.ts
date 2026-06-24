import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { formatCpfCnpjInput, validateCreateTicketForm } from '@/lib/ticket-form-validation';
import {
  type Company,
  type CompanyDetail,
  type CompanyLinkedContact,
  ticketFormFieldsFromCompany,
  solicitanteCpfFromContact,
} from '@/lib/companies';
import { useTicketCatalog } from '@/lib/use-ticket-catalog';
import type { Stage } from './types';

interface UseNewTicketFormOptions {
  stages: Stage[];
  onSuccess: () => void;
  showFeedback: (type: 'success' | 'error', msg: string) => void;
}

export function useNewTicketForm({ stages, onSuccess, showFeedback }: UseNewTicketFormOptions) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [formCompanyId, setFormCompanyId] = useState('');
  const [linkedContacts, setLinkedContacts] = useState<CompanyLinkedContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContactNumber, setSelectedContactNumber] = useState('');
  const [formNome, setFormNome] = useState('');
  const [formCompanyCnpj, setFormCompanyCnpj] = useState('');
  const [formSolicitanteCpf, setFormSolicitanteCpf] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [formCustomerType, setFormCustomerType] = useState('');
  const [formTicketType, setFormTicketType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { catalog, loading: catalogLoading, ready: catalogReady } = useTicketCatalog();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCompaniesLoading(true);
      try {
        const data = await apiRequest<Company[]>('/companies');
        if (!cancelled) setCompanies(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setCompanies([]);
      } finally {
        if (!cancelled) setCompaniesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!formCompanyId) {
      setLinkedContacts([]);
      setSelectedContactNumber('');
      setFormNome('');
      setFormCompanyCnpj('');
      setFormSolicitanteCpf('');
      setFormEmail('');
      return;
    }

    const summary = companies.find((c) => c.id === formCompanyId);
    if (summary) {
      const fields = ticketFormFieldsFromCompany(summary);
      setFormNome(fields.nome);
      setFormCompanyCnpj(fields.cpf);
    }

    let cancelled = false;
    (async () => {
      setContactsLoading(true);
      setSelectedContactNumber('');
      setFormEmail('');
      setFormSolicitanteCpf('');
      try {
        const detail = await apiRequest<CompanyDetail>(`/companies/${formCompanyId}`);
        if (cancelled) return;
        if (!detail) {
          setLinkedContacts([]);
          return;
        }
        const list = detail.contacts || [];
        setLinkedContacts(list);
        if (list.length === 1) {
          setSelectedContactNumber(list[0].number);
          setFormEmail((list[0].email || '').trim().toLowerCase());
          setFormSolicitanteCpf(solicitanteCpfFromContact(list[0].cnpj));
        }
      } catch {
        if (!cancelled) setLinkedContacts([]);
      } finally {
        if (!cancelled) setContactsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [formCompanyId, companies]);

  const onSelectContact = (number: string) => {
    setSelectedContactNumber(number);
    const contact = linkedContacts.find((c) => c.number === number);
    setFormEmail((contact?.email || '').trim().toLowerCase());
    setFormSolicitanteCpf(solicitanteCpfFromContact(contact?.cnpj));
  };

  const handleCreateTicket = async () => {
    if (stages.length === 0) {
      return showFeedback('error', 'Configure pelo menos uma fase no funil antes de criar uma OS.');
    }
    const validated = validateCreateTicketForm({
      contactNumber: selectedContactNumber,
      nome: formNome,
      email: formEmail,
      cpf: formSolicitanteCpf,
      marca: formMarca,
      modelo: formModelo,
      customerType: formCustomerType,
      ticketType: formTicketType,
      stageId: stages[0]?.id || '',
      availableCompanyIds: formCompanyId ? [formCompanyId] : [],
      companyId: formCompanyId || undefined,
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
      showFeedback('error', err instanceof Error ? err.message : 'Erro ao criar OS.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    companies,
    companiesLoading,
    formCompanyId,
    setFormCompanyId,
    linkedContacts,
    contactsLoading,
    selectedContactNumber,
    formNome,
    formCompanyCnpj,
    formSolicitanteCpf,
    setFormSolicitanteCpf: (v: string) => setFormSolicitanteCpf(formatCpfCnpjInput(v)),
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
    isSubmitting,
    catalog,
    catalogLoading,
    catalogReady,
    onSelectContact,
    handleCreateTicket,
  };
}
