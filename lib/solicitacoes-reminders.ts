import type { Stage, Task, Ticket } from '@/components/solicitacoes/types';

export const REMINDERS_BADGE_EVENT = 'crm-reminders-badge';
/** Payload: `Stage[]` — actualiza o Kanban sem novo pedido quando o poll global traz dados. */
export const SOLICITACOES_BOARD_SYNC_EVENT = 'crm-solicitacoes-board-sync';

export type ReminderBadgeDetail = {
  /** Lembretes com data **hoje** (calendário) e hora ainda não passou. */
  greenCount: number;
  /** Lembretes com data/hora já passadas (atrasados), qualquer dia. */
  redCount: number;
};

/** Última contagens emitidas (evita piscar ao remontar o Sidebar entre rotas). */
let lastReminderBadgeSnapshot: ReminderBadgeDetail = { greenCount: 0, redCount: 0 };

export function getLastReminderBadgeSnapshot(): ReminderBadgeDetail {
  return { ...lastReminderBadgeSnapshot };
}

/** Mesmo dia civil que “hoje” no dispositivo. */
export function isTaskDueOnCalendarToday(dueDate: string): boolean {
  const due = new Date(dueDate);
  const now = new Date();
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

export function isTaskOverdue(dueDate: string): boolean {
  return new Date(dueDate).getTime() < Date.now();
}

/** Sino: todos os lembretes do dia civil de hoje, até serem concluídos ou removidos. */
export function extractTasksDueCalendarToday(stages: Stage[]): Array<Task & { ticket: Ticket }> {
  return stages
    .flatMap((s) => s.tickets)
    .flatMap((t) => (t.tasks ? t.tasks.map((task) => ({ ...task, ticket: t })) : []))
    .filter((task) => !task.isCompleted && isTaskDueOnCalendarToday(task.dueDate))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

function forEachOpenTask(stages: Stage[], fn: (task: Task, ticket: Ticket) => void) {
  for (const s of stages) {
    for (const t of s.tickets) {
      for (const task of t.tasks || []) {
        if (task.isCompleted) continue;
        fn(task, t);
      }
    }
  }
}

/** Contagens globais para o menu lateral. */
export function computeReminderBadgeFromStages(stages: Stage[]): ReminderBadgeDetail {
  let greenCount = 0;
  let redCount = 0;
  forEachOpenTask(stages, (task) => {
    if (isTaskOverdue(task.dueDate)) {
      redCount += 1;
      return;
    }
    if (isTaskDueOnCalendarToday(task.dueDate)) {
      greenCount += 1;
    }
  });
  return { greenCount, redCount };
}

export function computeReminderGreenRedByTicketId(stages: Stage[]): {
  greenByTicketId: Record<string, number>;
  redByTicketId: Record<string, number>;
} {
  const greenByTicketId: Record<string, number> = {};
  const redByTicketId: Record<string, number> = {};
  forEachOpenTask(stages, (task, ticket) => {
    const tid = ticket.id;
    if (isTaskOverdue(task.dueDate)) {
      redByTicketId[tid] = (redByTicketId[tid] || 0) + 1;
      return;
    }
    if (isTaskDueOnCalendarToday(task.dueDate)) {
      greenByTicketId[tid] = (greenByTicketId[tid] || 0) + 1;
    }
  });
  return { greenByTicketId, redByTicketId };
}

export function broadcastReminderBadgeFromStages(stages: Stage[]): void {
  if (typeof window === 'undefined') return;
  const detail = computeReminderBadgeFromStages(stages);
  lastReminderBadgeSnapshot = { ...detail };
  window.dispatchEvent(new CustomEvent(REMINDERS_BADGE_EVENT, { detail }));
}
