const BLOCKED_PROTOCOLS = /^(javascript|data|vbscript|file):/i;

/** Permite apenas URLs http(s), blob: ou data: de imagem/áudio/vídeo do mesmo uso seguro. */
export function isSafeMediaUrl(raw: string | null | undefined): boolean {
  if (!raw || typeof raw !== 'string') return false;
  const s = raw.trim();
  if (!s || BLOCKED_PROTOCOLS.test(s)) return false;

  if (s.startsWith('blob:') || s.startsWith('/')) return true;

  if (s.startsWith('data:')) {
    return /^data:(image|audio|video)\//i.test(s);
  }

  try {
    const url = new URL(s);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const r2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim();
    if (r2) {
      try {
        const allowed = new URL(r2).origin;
        if (url.origin === allowed) return true;
      } catch {
        /* ignore */
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function safeMediaUrlOrEmpty(raw: string | null | undefined): string {
  return isSafeMediaUrl(raw) ? String(raw).trim() : '';
}
