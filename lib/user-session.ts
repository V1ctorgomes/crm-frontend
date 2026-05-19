/**
 * Papel do utilizador obtido apenas de `/users/me` (nunca confiar em localStorage para autorização).
 */
let trustedRole: string | null = null;

export function setTrustedUserSession(user: { role?: unknown } | null | undefined): void {
  const role = user && typeof user.role === 'string' ? user.role : null;
  trustedRole = role;
}

export function clearTrustedUserSession(): void {
  trustedRole = null;
}

export function getTrustedUserRole(): string | null {
  return trustedRole;
}
