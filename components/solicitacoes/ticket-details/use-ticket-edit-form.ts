'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { formatCpfCnpjInput, validateUpdateTicketForm } from '@/lib/ticket-form-validation';
import { useTicketCatalog } from '@/lib/use-ticket-catalog';
import type { Ticket } from '../types';

interface UseTicketEditFormArgs {
  ticket: Ticket;
  onTicketUpdated: () => void;
  showFeedback: (type: 'success' | 'error', msg: string) => void;
}

/**
 * Estado e handlers para o formulário de edição da OS dentro do `TicketDetailsModal`.
 * Carrega o catálogo, mantém os campos sincronizados com o `ticket` enquanto não está em edição
 * e expõe `save`/`cancel`.
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
  const [saving, setSaving] = useState(false);

  const syncFromTicket = useCallback(() => {
    setNome(ticket.contact?.name || '');
    setEmail((ticket.contact?.email || '').trim().toLowerCase());
    setCpf(formatCpfCnpjInput(ticket.contact?.cnpj || ''));
    setMarca(ticket.marca || '');
    setModelo(ticket.modelo || '');
    setCustomerType(ticket.customerType || '');
    setTicketType(ticket.ticketType || '');
  }, [ticket]);

  useEffect(() => {
    if (!editing) syncFromTicket();
  }, [editing, syncFromTicket]);

  const startEditing = () => {
    syncFromTicket();
    setEditing(true);
  };

  const cancel = () => {
    syncFromTicket();
    setEditing(false);
  };

  const save = async () => {
    const validated = validateUpdateTicketForm({
      nome,
      email,
      cpf,
      marca,
      modelo,
      customerType,
      ticketType,
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
  } as const;
}

export type TicketEditFormBag = ReturnType<typeof useTicketEditForm>;
