'use client';

import { useCallback, useState } from 'react';
import type { UserDeletionAuditRow } from '@/components/usuarios/UserDeletionsRevertPanel';
import { apiRequest } from '@/lib/api-client';

type ShowFeedback = (type: 'success' | 'error', message: string) => void;

export function useUsuariosDeletions(showFeedback: ShowFeedback) {
  const [deletionAudits, setDeletionAudits] = useState<{
    items: UserDeletionAuditRow[];
    revertibleCount: number;
  } | null>(null);
  const [deletionAuditsLoading, setDeletionAuditsLoading] = useState(false);
  const [revertingAuditId, setRevertingAuditId] = useState<string | null>(null);

  const fetchDeletionAudits = useCallback(async () => {
    setDeletionAuditsLoading(true);
    try {
      const data = await apiRequest<{ items?: UserDeletionAuditRow[]; revertibleCount?: number } | null>(
        '/users/deletion-audits/recent',
      );
      if (data && Array.isArray(data.items)) {
        setDeletionAudits({
          items: data.items,
          revertibleCount: typeof data.revertibleCount === 'number' ? data.revertibleCount : 0,
        });
      } else {
        setDeletionAudits({ items: [], revertibleCount: 0 });
      }
    } catch {
      setDeletionAudits({ items: [], revertibleCount: 0 });
      showFeedback('error', 'Erro ao carregar exclusões para restauração.');
    } finally {
      setDeletionAuditsLoading(false);
    }
  }, [showFeedback]);

  const handleRevertDeletion = useCallback(
    async (auditId: string) => {
      setRevertingAuditId(auditId);
      try {
        await apiRequest(`/users/deletion-audits/${auditId}/revert`, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        showFeedback('success', 'Registo restaurado com sucesso.');
        await fetchDeletionAudits();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao restaurar.';
        showFeedback('error', msg);
      } finally {
        setRevertingAuditId(null);
      }
    },
    [fetchDeletionAudits, showFeedback],
  );

  return {
    deletionAudits,
    deletionAuditsLoading,
    revertingAuditId,
    fetchDeletionAudits,
    handleRevertDeletion,
  };
}
