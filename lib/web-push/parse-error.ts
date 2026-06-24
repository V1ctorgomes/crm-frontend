export function parseNestErrorMessage(text: string): string | undefined {
  const t = text.trim();
  if (!t) return undefined;
  try {
    const j = JSON.parse(t) as { message?: string | string[] };
    if (Array.isArray(j.message)) return j.message.join(', ');
    if (typeof j.message === 'string') return j.message;
  } catch {
    /* not JSON */
  }
  return t.length > 200 ? `${t.slice(0, 200)}…` : t;
}
