import { getTrustedUserRole } from './user-session';

/**
 * Mínimo de caracteres no motivo de eliminação (conta o texto após `.trim()`).
 */
export const MIN_DELETE_REASON_LENGTH = 10;

/** Alinhado ao backend (`DELETE_REASON_MAX_LEN`). */
export const MAX_DELETE_REASON_LENGTH = 2000;

/** Papel técnico: motivo opcional no cliente; o servidor valida sempre. */
export function crmUserIsDeveloper(): boolean {
  return getTrustedUserRole() === 'DEVELOPER';
}

export function isValidDeleteReason(text: string): boolean {
  const len = text.trim().length;
  return len >= MIN_DELETE_REASON_LENGTH && len <= MAX_DELETE_REASON_LENGTH;
}

export function canConfirmDelete(reason: string): boolean {
  if (crmUserIsDeveloper()) {
    const len = reason.trim().length;
    return len === 0 || len <= MAX_DELETE_REASON_LENGTH;
  }
  return isValidDeleteReason(reason);
}
