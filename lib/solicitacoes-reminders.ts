import type { Stage, Task, Ticket } from '@/components/solicitacoes/types';

export const REMINDER_ACK_TASK_IDS_KEY = 'crm_reminders_acked_task_ids_v1';
export const REMINDERS_BADGE_EVENT = 'crm-reminders-badge';
/** Payload: `Stage[]` — actualiza o Kanban sem novo pedido quando o poll global traz dados. */
export const SOLICITACOES_BOARD_SYNC_EVENT = 'crm-solicitacoes-board-sync';

export type ReminderBadgeDetail = {
  /** OS com pelo menos um lembrete (hoje) ainda não “visto”. */
  ticketsWithUnackedReminders: number;
  /** Total de lembretes não vistos. */
  totalUnacked: number;
  byTicketId: Record<string, number>;
};

export function isTaskDueThroughEndOfToday(dueDate: string): boolean {
  const due = new Date(dueDate);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return due <= endOfToday;
}

/** Lembretes do dia (até fim do dia) ainda não concluídos, com referência ao ticket. */
export function extractPendingReminderTasksFromStages(stages: Stage[]): Array<Task & { ticket: Ticket }> {
  return stages
    .flatMap((s) => s.tickets)
    .flatMap((t) => (t.tasks ? t.tasks.map((task) => ({ ...task, ticket: t })) : []))
    .filter((task) => {
      if (task.isCompleted) return false;
      return isTaskDueThroughEndOfToday(task.dueDate);
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export function loadAckedReminderTaskIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(REMINDER_ACK_TASK_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x) => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function saveAckedReminderTaskIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  const max = 4000;
  const arr = Array.from(ids).slice(-max);
  localStorage.setItem(REMINDER_ACK_TASK_IDS_KEY, JSON.stringify(arr));
}

function pruneAckedAgainstPending(acked: Set<string>, pendingTaskIds: Set<string>): Set<string> {
  return new Set([...acked].filter((id) => pendingTaskIds.has(id)));
}

export function computeReminderBadgeFromStages(stages: Stage[]): ReminderBadgeDetail {
  const pending = extractPendingReminderTasksFromStages(stages);
  const pendingIds = new Set(pending.map((t) => t.id));
  const pruned = pruneAckedAgainstPending(loadAckedReminderTaskIds(), pendingIds);
  saveAckedReminderTaskIds(pruned);

  const unacked = pending.filter((t) => !pruned.has(t.id));
  const byTicketId: Record<string, number> = {};
  for (const t of unacked) {
    const tid = t.ticket?.id;
    if (!tid) continue;
    byTicketId[tid] = (byTicketId[tid] || 0) + 1;
  }
  const ticketsWithUnackedReminders = Object.keys(byTicketId).length;
  return {
    ticketsWithUnackedReminders,
    totalUnacked: unacked.length,
    byTicketId,
  };
}

export function broadcastReminderBadgeFromStages(stages: Stage[]): void {
  if (typeof window === 'undefined') return;
  const detail = computeReminderBadgeFromStages(stages);
  window.dispatchEvent(new CustomEvent(REMINDERS_BADGE_EVENT, { detail }));
}

/** Marca lembretes como vistos (abriu painel, OS, etc.). */
export function ackReminderTaskIds(taskIds: string[], stages: Stage[]): void {
  if (typeof window === 'undefined') return;
  if (taskIds.length === 0) {
    broadcastReminderBadgeFromStages(stages);
    return;
  }
  const pending = extractPendingReminderTasksFromStages(stages);
  const pendingIds = new Set(pending.map((t) => t.id));
  const merged = pruneAckedAgainstPending(loadAckedReminderTaskIds(), pendingIds);
  for (const id of taskIds) {
    if (pendingIds.has(id)) merged.add(id);
  }
  saveAckedReminderTaskIds(merged);
  broadcastReminderBadgeFromStages(stages);
}
