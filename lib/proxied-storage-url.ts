import { isSafeMediaUrl } from './safe-media-url';
import { getApiBaseUrl } from './api-client';

function isR2PublicUrl(url: string): boolean {
  const r2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim();
  if (!r2) return false;
  try {
    return new URL(url).origin === new URL(r2).origin;
  } catch {
    return false;
  }
}

function encodeUrlForStorageProxy(fileUrl: string): string {
  const bytes = new TextEncoder().encode(fileUrl);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/** Converte URL pública R2 num endpoint autenticado do backend (cookie HttpOnly). */
export function toProxiedStorageUrl(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return '';
  const s = raw.trim();
  if (!s || s.startsWith('blob:') || s.startsWith('data:')) return s;
  if (!isSafeMediaUrl(s)) return '';
  if (!isR2PublicUrl(s)) return s;
  const encoded = encodeUrlForStorageProxy(s);
  return `${getApiBaseUrl()}/storage/file?u=${encodeURIComponent(encoded)}`;
}

export function proxiedMediaUrlOrEmpty(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return '';
  const s = raw.trim();
  if (!s) return '';
  if (s.startsWith('blob:') || s.startsWith('data:')) return isSafeMediaUrl(s) ? s : '';
  const proxied = toProxiedStorageUrl(s);
  return proxied || (isSafeMediaUrl(s) ? s : '');
}
