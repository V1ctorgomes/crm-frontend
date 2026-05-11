const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crm-crm-backend.pknzmz.easypanel.host';

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getAuthToken(): string | null {
  return getCookieValue('token');
}

export function withAuthHeaders(headers: HeadersInit = {}): HeadersInit {
  const token = getAuthToken();
  if (!token) return headers;
  return { ...headers, Authorization: `Bearer ${token}` };
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;

  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: HeadersInit = withAuthHeaders({
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  });

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Erro na requisição');
  }

  return response.json();
}