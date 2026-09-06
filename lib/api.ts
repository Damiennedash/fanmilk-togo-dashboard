const API_URL =
  process.env.NEXT_PUBLIC_VENDOR_API_URL ??
  'https://vendor-bot-final.onrender.com';

const responseCache = new Map<string, { expiresAt: number; value: unknown }>();
const pendingRequests = new Map<string, Promise<unknown>>();

export function getToken() {
  return typeof window === 'undefined'
    ? null
    : sessionStorage.getItem('fanmilk_access_token');
}

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: 'administrateur' | 'depositaire' | 'revendeur';
  depot?: { id: number; name: string; location: string } | null;
};

export function getStoredUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const value = sessionStorage.getItem('fanmilk_user');
  if (!value) return null;
  try {
    return JSON.parse(value) as SessionUser;
  } catch {
    return null;
  }
}

export function saveSession(accessToken: string, user: SessionUser) {
  sessionStorage.setItem('fanmilk_access_token', accessToken);
  sessionStorage.setItem('fanmilk_user', JSON.stringify(user));
}

export function updateStoredUser(user: SessionUser) {
  sessionStorage.setItem('fanmilk_user', JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem('fanmilk_access_token');
  sessionStorage.removeItem('fanmilk_user');
  responseCache.clear();
  pendingRequests.clear();
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    msg?: string;
  };
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      clearSession();
      if (!path.startsWith('/api/auth/')) {
        window.location.replace(
          `/connexion?returnTo=${encodeURIComponent(window.location.pathname)}`,
        );
      }
    }
    throw new Error(
      body.error ?? body.msg ?? 'Le serveur ne répond pas correctement.',
    );
  }
  return body as T;
}

export async function apiFetchCached<T>(
  path: string,
  { maxAge = 15_000, force = false }: { maxAge?: number; force?: boolean } = {},
): Promise<T> {
  const key = `${getToken() ?? 'anonymous'}:${path}`;
  const cached = responseCache.get(key);
  if (!force && cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }
  const pending = pendingRequests.get(key);
  if (!force && pending) return pending as Promise<T>;

  const request = apiFetch<T>(path)
    .then((value) => {
      responseCache.set(key, { value, expiresAt: Date.now() + maxAge });
      return value;
    })
    .finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, request);
  return request;
}

export function invalidateApiCache() {
  responseCache.clear();
}
