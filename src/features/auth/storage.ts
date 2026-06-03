import * as SecureStore from 'expo-secure-store';

const KEY = 'healthbook.auth.session';

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export async function saveSession(session: StoredSession): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<StoredSession | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    await SecureStore.deleteItemAsync(KEY);
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
