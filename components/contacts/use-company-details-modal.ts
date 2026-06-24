'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiRequest, apiDelete } from '@/lib/api-client';
import type { Company } from '@/lib/companies';

export interface LinkedContact {
  number: string;
  name: string | null;
  email: string | null;
  profilePictureUrl: string | null;
  contactKind: string | null;
}

export interface AvailableContact {
  number: string;
  name?: string | null;
  profilePictureUrl?: string;
}

type ShowFeedback = (type: 'success' | 'error', message: string) => void;

export function useCompanyDetailsModal(
  company: Company,
  allContacts: AvailableContact[],
  onChanged: () => void,
  onShowFeedback: ShowFeedback,
) {
  const [loading, setLoading] = useState(true);
  const [linked, setLinked] = useState<LinkedContact[]>([]);
  const [ticketCount, setTicketCount] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [linking, setLinking] = useState(false);
  const [unlinkConfirm, setUnlinkConfirm] = useState<{ number: string; label: string } | null>(null);

  const loadDetails = async () => {
    setLoading(true);
    setTicketCount(null);
    try {
      const data = await apiRequest<{ contacts?: LinkedContact[]; ticketCount?: number }>(`/companies/${company.id}`);
      setLinked(data?.contacts || []);
      setTicketCount(typeof data?.ticketCount === 'number' ? data.ticketCount : null);
    } catch {
      onShowFeedback('error', 'Não foi possível carregar os contatos vinculados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetails();
  }, [company.id]);

  const linkedSet = useMemo(() => new Set(linked.map((c) => c.number)), [linked]);

  const candidates = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allContacts
      .filter((c) => !linkedSet.has(c.number))
      .filter((c) => {
        if (!term) return true;
        return (
          (c.name || '').toLowerCase().includes(term) ||
          c.number.toLowerCase().includes(term)
        );
      })
      .slice(0, 8);
  }, [allContacts, linkedSet, searchTerm]);

  const handleLink = async (number: string) => {
    setLinking(true);
    try {
      await apiRequest(`/companies/${company.id}/contacts/${encodeURIComponent(number)}`, { method: 'POST' });
      await loadDetails();
      onChanged();
      onShowFeedback('success', 'Contato vinculado à empresa.');
    } catch (err) {
      onShowFeedback('error', err instanceof Error ? err.message : 'Erro ao vincular contato.');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (number: string, deleteReason?: string) => {
    setLinking(true);
    try {
      await apiDelete(`/companies/${company.id}/contacts/${encodeURIComponent(number)}`, deleteReason);
      setLinked((prev) => prev.filter((c) => c.number !== number));
      onChanged();
      onShowFeedback('success', 'Contato desvinculado.');
    } catch (err) {
      onShowFeedback('error', err instanceof Error ? err.message : 'Erro ao desvincular contato.');
    } finally {
      setLinking(false);
    }
  };

  return {
    loading,
    linked,
    ticketCount,
    searchTerm,
    setSearchTerm,
    linking,
    unlinkConfirm,
    setUnlinkConfirm,
    candidates,
    handleLink,
    handleUnlink,
  };
}
