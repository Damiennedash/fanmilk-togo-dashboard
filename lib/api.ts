const API_URL =
  process.env.NEXT_PUBLIC_VENDOR_API_URL ??
  'https://vendor-bot-final.onrender.com';

export function getToken() {
  return typeof window === 'undefined'
    ? null
    : sessionStorage.getItem('fanmilk_access_token');
}

export function saveSession(accessToken: string, user: unknown) {
  sessionStorage.setItem('fanmilk_access_token', accessToken);
  sessionStorage.setItem('fanmilk_user', JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem('fanmilk_access_token');
  sessionStorage.removeItem('fanmilk_user');
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
  };
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined')
      clearSession();
    throw new Error(body.error ?? 'Le serveur ne répond pas correctement.');
  }
  return body as T;
}
