import { env } from '@/config/env';
import { refreshSession } from '@/features/auth/keycloak';
import {
  clearSession,
  loadSession,
  saveSession,
  type StoredSession,
} from '@/features/auth/storage';

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

let refreshInFlight: Promise<StoredSession | null> | null = null;

async function ensureFreshSession(): Promise<StoredSession | null> {
  const current = await loadSession();
  if (!current) return null;
  if (current.expiresAt > Date.now()) return current;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const next = await refreshSession(current.refreshToken);
        await saveSession(next);
        return next;
      } catch {
        await clearSession();
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
};

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { auth = true, body, headers, ...rest } = opts;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const session = await ensureFreshSession();
    if (session) {
      finalHeaders.Authorization = `Bearer ${session.accessToken}`;
    }
  }

  const url = path.startsWith('http') ? path : `${env.apiBaseUrl}${path}`;
  if (__DEV__) {
    console.log('[API] Requête sortante', {
      methode: rest.method ?? 'GET',
      url,
      authentifie: Boolean(finalHeaders.Authorization),
    });
  }
  const res = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });
  if (__DEV__) {
    console.log(`[API] Réponse reçue → statut ${res.status} pour ${url}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let parsed: unknown = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {}
    if (__DEV__) console.log('[API] Corps de l’erreur :', parsed);
    throw new HttpError(`HTTP ${res.status}`, res.status, parsed);
  }

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }
  return (await res.text()) as T;
}
