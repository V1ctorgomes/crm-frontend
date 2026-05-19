/** Justificativa ao encerrar OS como ganho (SUCCESS) ou perda (CANCELLED). */
export const TICKET_RESOLUTION_REASON_MIN = 10;
export const TICKET_RESOLUTION_REASON_MAX = 500;

export function resolutionReasonLabel(resolution: 'SUCCESS' | 'CANCELLED'): string {
  return resolution === 'SUCCESS' ? 'Justificativa do ganho' : 'Justificativa da perda';
}

export function validateTicketResolutionReason(
  resolution: 'SUCCESS' | 'CANCELLED',
  reason: string,
): { ok: true; trimmed: string } | { ok: false; message: string } {
  const label = resolutionReasonLabel(resolution);
  const trimmed = String(reason ?? '').trim();
  if (!trimmed) {
    return { ok: false, message: `O campo «${label}» é obrigatório.` };
  }
  if (trimmed.length < TICKET_RESOLUTION_REASON_MIN) {
    return {
      ok: false,
      message: `O campo «${label}» deve ter pelo menos ${TICKET_RESOLUTION_REASON_MIN} caracteres.`,
    };
  }
  if (trimmed.length > TICKET_RESOLUTION_REASON_MAX) {
    return {
      ok: false,
      message: `O campo «${label}» não pode exceder ${TICKET_RESOLUTION_REASON_MAX} caracteres.`,
    };
  }
  return { ok: true, trimmed };
}
