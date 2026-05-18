/**
 * Mínimo de caracteres no motivo de eliminação (conta o texto após `.trim()`:
 * espaços no início e no fim não entram na contagem).
 */
export const MIN_DELETE_REASON_LENGTH = 10;

export function readCachedUserRole(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('crm_user_cache');
    if (!raw) return null;
    const u = JSON.parse(raw) as { role?: unknown };
    return typeof u.role === 'string' ? u.role : null;
  } catch {
    return null;
  }
}

/** Utilizadores com papel técnico não precisam de indicar motivo ao apagar. */
export function crmUserIsDeveloper(): boolean {
  return readCachedUserRole() === 'DEVELOPER';
}

export function isValidDeleteReason(text: string): boolean {
  return text.trim().length >= MIN_DELETE_REASON_LENGTH;
}

export function canConfirmDelete(reason: string): boolean {
  if (crmUserIsDeveloper()) return true;
  return isValidDeleteReason(reason);
}
