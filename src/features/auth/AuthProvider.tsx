import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  loginWithPassword,
  logoutSession,
  refreshSession,
} from './keycloak';
import {
  clearSession,
  loadSession,
  saveSession,
  type StoredSession,
} from './storage';

type AuthUser = {
  sub: string;
  email?: string;
  username?: string;
  roles: string[];
};

type AuthContextValue = {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeJwt(token: string): AuthUser | null {
  const [, payload] = token.split('.');
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );
    const json =
      typeof atob === 'function'
        ? atob(padded)
        : // eslint-disable-next-line @typescript-eslint/no-require-imports
          (require('buffer') as typeof import('buffer')).Buffer.from(
            padded,
            'base64',
          ).toString('utf8');
    const claims = JSON.parse(json) as {
      sub: string;
      email?: string;
      preferred_username?: string;
      realm_access?: { roles?: string[] };
    };
    return {
      sub: claims.sub,
      email: claims.email,
      username: claims.preferred_username,
      roles: claims.realm_access?.roles ?? [],
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  const applySession = useCallback((session: StoredSession | null) => {
    if (!session) {
      if (__DEV__) {
        console.log('[Auth] Aucune session active → utilisateur déconnecté');
      }
      setUser(null);
      setStatus('unauthenticated');
      return;
    }
    const claims = decodeJwt(session.accessToken);
    if (__DEV__) {
      const expireDansSec = Math.max(
        0,
        Math.floor((session.expiresAt - Date.now()) / 1000),
      );
      console.log('[Auth] Session active → utilisateur connecté', {
        utilisateur: claims?.username,
        roles: claims?.roles,
        expireDans: `${expireDansSec}s`,
      });
    }
    setUser(claims);
    setStatus(claims ? 'authenticated' : 'unauthenticated');
  }, []);

  useEffect(() => {
    void (async () => {
      const session = await loadSession();
      if (!session) {
        applySession(null);
        return;
      }
      if (session.expiresAt <= Date.now()) {
        try {
          const refreshed = await refreshSession(session.refreshToken);
          await saveSession(refreshed);
          applySession(refreshed);
        } catch {
          await clearSession();
          applySession(null);
        }
        return;
      }
      applySession(session);
    })();
  }, [applySession]);

  const login = useCallback<AuthContextValue['login']>(
    async (username, password) => {
      const session = await loginWithPassword(username, password);
      await saveSession(session);
      applySession(session);
    },
    [applySession],
  );

  const logout = useCallback<AuthContextValue['logout']>(async () => {
    const session = await loadSession();
    if (session) await logoutSession(session.refreshToken);
    await clearSession();
    applySession(null);
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, logout }),
    [status, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
