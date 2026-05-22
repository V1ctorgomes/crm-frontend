import { readCsrfToken } from './csrf';

/**
 * Base da API:
 * - Se `NEXT_PUBLIC_API_URL` estiver definido, usa-se (ex.: backend noutro domínio com proxy reverso).
 * - Caso contrário no browser usa-se `/api/proxy` (rewrite no Next → mesmo site → cookie HttpOnly).
 * - Em SSR (sem `window`), usa `INTERNAL_API_URL` ou localhost.
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '').trim();
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/proxy`;
  }
  return (process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
}

/** @deprecated O token JWT passa a ser HttpOnly; não ler de `document.cookie`. */
export function getAuthToken(): string | null {
  return null;
}

export function withAuthHeaders(headers: HeadersInit = {}): HeadersInit {
  return headers;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T | null> {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${getApiBaseUrl()}${path}`;

  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  const method = (options.method || 'GET').toUpperCase();
  const csrf =
    method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS' ? readCsrfToken() : null;

  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    ...(options.headers || {}),
  };

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new Error(
      'Sem ligação ao servidor (rede ou proxy). Confirme que o backend está a correr (ex.: porta 3001) e recarregue a página após login.',
    );
  }

  const raw = await response.text();

  if (!response.ok) {
    let errorMessage = `Erro na requisição (${response.status})`;
    if (raw) {
      try {
        const errorData = JSON.parse(raw) as {
          message?: string | string[] | Record<string, unknown>;
          error?: string;
        };
        const msg = errorData.message;
        if (Array.isArray(msg)) {
          errorMessage = msg.join(' ');
        } else if (typeof msg === 'string' && msg.trim()) {
          errorMessage = msg;
        } else if (typeof errorData.error === 'string' && errorData.error.trim()) {
          errorMessage = errorData.error;
        }
      } catch {
        if (process.env.NODE_ENV !== 'production') {
          errorMessage = raw.slice(0, 300) || errorMessage;
        }
      }
    }
    throw new Error(errorMessage);
  }

  if (!raw || !raw.trim()) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** DELETE com corpo `{ reason }` para auditoria no servidor (obrigatório para não-developers na UI). */
export async function apiDelete<T = unknown>(endpoint: string, reason?: string): Promise<T | null> {
  const trimmed = (reason ?? '').trim();
  const opts: RequestInit = { method: 'DELETE' };
  if (trimmed.length > 0) {
    opts.body = JSON.stringify({ reason: trimmed });
  }
  return apiRequest<T>(endpoint, opts);
}
