import {
  env,
  keycloakLogoutUrl,
  keycloakTokenUrl,
} from '@/config/env';
import type { StoredSession } from './storage';

type KeycloakTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  scope: string;
};

type KeycloakErrorResponse = {
  error?: string;
  error_description?: string;
};

export class AuthError extends Error {
  constructor(
    message: string,
    readonly code: 'invalid_credentials' | 'network' | 'unknown' = 'unknown',
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

function toSession(token: KeycloakTokenResponse): StoredSession {
  const expiresAt = Date.now() + (token.expires_in - 10) * 1000;
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt,
  };
}

async function postForm(
  body: Record<string, string>,
  url: string = keycloakTokenUrl,
): Promise<Response> {
  const formBody = new URLSearchParams(body).toString();
  if (__DEV__) {
    const safe = { ...body, password: '***', refresh_token: '***' };
    console.log('[Keycloak] Envoi requête →', url, safe);
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
    });
    if (__DEV__) console.log('[Keycloak] Statut de la réponse :', res.status);
    return res;
  } catch (err) {
    if (__DEV__) {
      console.log(
        '[Keycloak] Erreur réseau (impossible de joindre Keycloak) :',
        err,
      );
    }
    throw new AuthError(
      err instanceof Error ? err.message : 'Network request failed',
      'network',
    );
  }
}

export async function loginWithPassword(
  username: string,
  password: string,
): Promise<StoredSession> {
  const res = await postForm({
    grant_type: 'password',
    client_id: env.keycloakClientId,
    username,
    password,
    scope: 'openid',
  });

  if (!res.ok) {
    const error = (await res.json().catch(() => ({}))) as KeycloakErrorResponse;
    if (__DEV__) console.log('[Keycloak] Détail de l’erreur renvoyée :', error);
    if (res.status === 401 || error.error === 'invalid_grant') {
      throw new AuthError(
        'Identifiants invalides',
        'invalid_credentials',
      );
    }
    throw new AuthError(
      error.error_description ?? `Auth failed (${res.status})`,
    );
  }

  const token = (await res.json()) as KeycloakTokenResponse;
  return toSession(token);
}

export async function refreshSession(
  refreshToken: string,
): Promise<StoredSession> {
  const res = await postForm({
    grant_type: 'refresh_token',
    client_id: env.keycloakClientId,
    refresh_token: refreshToken,
  });

  if (!res.ok) {
    throw new AuthError('Session expirée', 'invalid_credentials');
  }
  const token = (await res.json()) as KeycloakTokenResponse;
  return toSession(token);
}

export async function logoutSession(refreshToken: string): Promise<void> {
  try {
    await postForm(
      {
        client_id: env.keycloakClientId,
        refresh_token: refreshToken,
      },
      keycloakLogoutUrl,
    );
  } catch {}
}
