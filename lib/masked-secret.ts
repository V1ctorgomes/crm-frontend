export const MASKED_SECRET_PREFIX = '••••••••';

export function isMaskedSecretValue(value: string): boolean {
  const v = value.trim();
  return v === '' || v.startsWith(MASKED_SECRET_PREFIX) || v === '********';
}

/** Não reenviar segredos mascarados ao gravar (o backend mantém o valor existente). */
export function secretForSave(value: string): string | undefined {
  return isMaskedSecretValue(value) ? undefined : value.trim();
}
