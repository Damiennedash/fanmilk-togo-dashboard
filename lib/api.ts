const API_URL =
  process.env.NODE_ENV === 'development'
    ? (process.env.NEXT_PUBLIC_VENDOR_API_URL ?? 'http://localhost:5000')
    : '';

const responseCache = new Map<string, { expiresAt: number; value: unknown }>();
const pendingRequests = new Map<string, Promise<unknown>>();
const CACHE_PREFIX = 'fanmilk_api_cache:';
const REQUEST_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(
  input: RequestInfo | URL,
  options: RequestInit,
) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort('timeout'),
    REQUEST_TIMEOUT_MS,
  );
  const abortFromCaller = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener('abort', abortFromCaller, { once: true });
  try {
    return await fetch(input, { ...options, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted && !options.signal?.aborted) {
      throw new Error(
        'Le serveur met trop de temps à répondre. Réessayez dans quelques secondes.',
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abortFromCaller);
  }
}

function clearStoredApiCache() {
  if (typeof window === 'undefined') return;
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith(CACHE_PREFIX))
    .forEach((key) => sessionStorage.removeItem(key));
}

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
  invalidateApiCache();
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
  clearStoredApiCache();
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
  const response = await fetchWithTimeout(`${API_URL}${path}`, {
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
      body.error ?? body.msg ?? 'Impossible de charger les données pour le moment.',
    );
  }
  return body as T;
}

export async function apiFetchWithToken<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);
  const response = await fetchWithTimeout(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    msg?: string;
  };
  if (!response.ok)
    throw new Error(
      body.error ?? body.msg ?? `La requête a échoué (${response.status}).`,
    );
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
  const storedKey = `${CACHE_PREFIX}${encodeURIComponent(path)}`;
  if (!force && typeof window !== 'undefined') {
    try {
      const stored = JSON.parse(sessionStorage.getItem(storedKey) ?? 'null') as
        | { expiresAt: number; value: T }
        | null;
      if (stored && stored.expiresAt > Date.now()) {
        responseCache.set(key, stored);
        return stored.value;
      }
      sessionStorage.removeItem(storedKey);
    } catch {
      sessionStorage.removeItem(storedKey);
    }
  }
  const pending = pendingRequests.get(key);
  if (!force && pending) return pending as Promise<T>;

  const request = apiFetch<T>(path)
    .then((value) => {
      const entry = { value, expiresAt: Date.now() + maxAge };
      responseCache.set(key, entry);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(storedKey, JSON.stringify(entry));
      }
      return value;
    })
    .finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, request);
  return request;
}

export function invalidateApiCache() {
  responseCache.clear();
  pendingRequests.clear();
  clearStoredApiCache();
}
