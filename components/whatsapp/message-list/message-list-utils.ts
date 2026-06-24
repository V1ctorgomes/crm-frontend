export function scrollListToBottom(el: HTMLElement | null) {
  if (!el) return;
  el.scrollTop = el.scrollHeight;
}

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function dayKeyFromSentAt(sentAt?: string): string {
  const d = sentAt ? new Date(sentAt) : new Date();
  const s = startOfLocalDay(d);
  return `${s.getFullYear()}-${s.getMonth()}-${s.getDate()}`;
}

export function formatDaySeparatorLabel(sentAt?: string): string {
  const msgDay = startOfLocalDay(sentAt ? new Date(sentAt) : new Date());
  const today = startOfLocalDay(new Date());
  const diffDays = Math.round((today.getTime() - msgDay.getTime()) / 86400000);
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  const d = sentAt ? new Date(sentAt) : new Date();
  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
