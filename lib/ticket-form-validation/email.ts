const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export function isValidEmail(email: string): boolean {
  const e = email.trim();
  if (e.length > 254) return false;
  return EMAIL_RE.test(e);
}
