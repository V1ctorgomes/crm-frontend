import type { Stage } from './types';

export const KANBAN_PAGE_SIZE = 5;

export function buildStageTicketSignature(stages: Stage[]): string {
  return stages.map((s) => `${s.id}:${s.tickets.length}`).join('|');
}

export function clampStagePage(rawPage: number, totalTickets: number, pageSize = KANBAN_PAGE_SIZE): number {
  const totalPages = Math.max(1, Math.ceil(totalTickets / pageSize));
  return Math.min(Math.max(0, rawPage), totalPages - 1);
}

export function getVisibleTicketRange(page: number, total: number, pageSize = KANBAN_PAGE_SIZE) {
  const start = page * pageSize;
  const rangeLabel =
    total === 0
      ? '0'
      : `${start + 1}–${Math.min(start + pageSize, total)}`;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { start, rangeLabel, totalPages };
}

export function clampPagesByStages(
  prev: Record<string, number>,
  stages: Stage[],
  pageSize = KANBAN_PAGE_SIZE,
): Record<string, number> {
  let changed = false;
  const next = { ...prev };
  for (const stage of stages) {
    const totalPages = Math.max(1, Math.ceil(stage.tickets.length / pageSize));
    const maxPage = totalPages - 1;
    const cur = next[stage.id] ?? 0;
    if (cur > maxPage) {
      next[stage.id] = maxPage;
      changed = true;
    }
  }
  return changed ? next : prev;
}
