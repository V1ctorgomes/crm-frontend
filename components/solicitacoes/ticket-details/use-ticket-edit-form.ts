'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { formatCpfCnpjInput, validateUpdateTicketForm } from '@/lib/ticket-form-validation';
import { useTicketCatalog } from '@/lib/use-ticket-catalog';
import type { Company } from '@/lib/companies';
import type { Ticket } from '../types';

interface UseTicketEditFormArgs {
  ticket: Ticket;
  onTicketUpdated: () => void;
  showFeedback: (type: 'success' | 'error', msg: string) => void;
}

/**
 * Estado e handlers para o formulário de edição da OS dentro do `TicketDetailsModal`.
 * Carrega o catálogo, mantém os campos sincronizados com o `ticket` enquanto não está em edição
 * e expõe `save`/`cancel`. Também carrega as empresas vinculadas ao contacto para permitir trocar
 * a empresa da OS pelos vínculos existentes.
 */
export function useTicketEditForm({ ticket, onTicketUpdated, showFeedback }: UseTicketEditFormArgs) {
  const [editing, setEditing] = useState(false);
  const { catalog, loading: catalogLoading, ready: catalogReady } = useTicketCatalog();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [ticketType, setTicketType] = useState('');
  const [companyId, setCompanyId] = useState<string>('');
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const syncFromTicket = useCallback(() => {
    setNome(ticket.contact?.name || '');
    setEmail((ticket.contact?.email || '').trim().toLowerCase());
    setCpf(formatCpfCnpjInput(ticket.contact?.cnpj || ''));
    setMarca(ticket.marca || '');
    setModelo(ticket.modelo || '');
    setCustomerType(ticket.customerType || '');
    setTicketType(ticket.ticketType || '');
    setCompanyId(ticket.companyId || ticket.company?.id || '');
  }, [ticket]);

  useEffect(() => {
    if (!editing) syncFromTicket();
  }, [editing, syncFromTicket]);

  const loadAvailableCompanies = useCallback(async () => {
    if (!ticket.contactNumber) return;
    setCompaniesLoading(true);
    try {
      const data = await apiRequest<Company[]>(
        `/companies/contact/${encodeURIComponent(ticket.contactNumber)}`,
      );
      setAvailableCompanies(Array.isArray(data) ? data : []);
    } catch {
      setAvailableCompanies([]);
    } finally {
      setCompaniesLoading(false);
    }
  }, [ticket.contactNumber]);

  const startEditing = () => {
    syncFromTicket();
    void loadAvailableCompanies();
    setEditing(true);
  };

  const cancel = () => {
    syncFromTicket();
    setEditing(false);
  };

  const save = async () => {
    const initialCompanyId = ticket.companyId || ticket.company?.id || null;
    const validated = validateUpdateTicketForm({
      nome,
      email,
      cpf,
      marca,
      modelo,
      customerType,
      ticketType,
      availableCompanyIds: availableCompanies.map((c) => c.id),
      companyId: companyId || undefined,
      initialCompanyId,
    });
    if (!validated.ok) {
      showFeedback('error', validated.message);
      return;
    }
    setSaving(true);
    try {
      await apiRequest(`/tickets/${ticket.id}`, {
        method: 'PUT',
        body: JSON.stringify(validated.body),
      });
      setEditing(false);
      onTicketUpdated();
      showFeedback('success', 'Solicitação actualizada.');
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'Erro ao guardar alterações.');
    } finally {
      setSaving(false);
    }
  };

  return {
    editing,
    startEditing,
    cancel,
    save,
    saving,
    catalog,
    catalogLoading,
    catalogReady,
    nome,
    setNome,
    email,
    setEmail,
    cpf,
    setCpf,
    marca,
    setMarca,
    modelo,
    setModelo,
    customerType,
    setCustomerType,
    ticketType,
    setTicketType,
    companyId,
    setCompanyId,
    availableCompanies,
    companiesLoading,
  } as const;
}

export type TicketEditFormBag = ReturnType<typeof useTicketEditForm>;
