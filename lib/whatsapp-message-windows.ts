/** Regras alinhadas ao WhatsApp: apagar para todos e editar só dentro destas janelas. */
export const WA_DELETE_MAX_MS = 50 * 60 * 60 * 1000; // 50 horas
export const WA_EDIT_MAX_MS = 14 * 60 * 1000; // 14 minutos

export function messageAgeMs(sentAtIso?: string): number | null {
  if (!sentAtIso) return null;
  const t = new Date(sentAtIso).getTime();
  if (Number.isNaN(t)) return null;
  return Date.now() - t;
}

/** Mensagem ainda pode ser apagada para todos (tuas, dentro do prazo). */
export function canDeleteMessageByTime(sentAtIso?: string): boolean {
  const age = messageAgeMs(sentAtIso);
  if (age === null) return false;
  return age >= 0 && age <= WA_DELETE_MAX_MS;
}

/** Mensagem de texto ainda pode ser editada (tuas, dentro do prazo). */
export function canEditMessageByTime(sentAtIso?: string): boolean {
  const age = messageAgeMs(sentAtIso);
  if (age === null) return false;
  return age >= 0 && age <= WA_EDIT_MAX_MS;
}
