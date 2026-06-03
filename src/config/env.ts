import Constants from 'expo-constants';
import { Platform } from 'react-native';

type Extra = {
  gatewayHost?: string | null;
  gatewayPort?: number | string | null;
  keycloakRealm?: string | null;
  keycloakClientId?: string | null;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

function asNonEmptyString(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function asPositiveNumber(v: unknown): number | undefined {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

const host =
  asNonEmptyString(process.env.EXPO_PUBLIC_GATEWAY_HOST) ??
  asNonEmptyString(extra.gatewayHost) ??
  (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

const port =
  asPositiveNumber(process.env.EXPO_PUBLIC_GATEWAY_PORT) ??
  asPositiveNumber(extra.gatewayPort) ??
  8080;

const baseUrl = `http://${host}:${port}`;

const keycloakRealm =
  asNonEmptyString(process.env.EXPO_PUBLIC_KEYCLOAK_REALM) ??
  asNonEmptyString(extra.keycloakRealm) ??
  'healthai';

const keycloakClientId =
  asNonEmptyString(process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID) ??
  asNonEmptyString(extra.keycloakClientId) ??
  'mobile-app';

export const env = {
  apiBaseUrl: `${baseUrl}/api`,
  keycloakBaseUrl: `${baseUrl}/auth`,
  keycloakRealm,
  keycloakClientId,
};

export const keycloakRealmUrl = `${env.keycloakBaseUrl}/realms/${env.keycloakRealm}`;
export const keycloakTokenUrl = `${keycloakRealmUrl}/protocol/openid-connect/token`;
export const keycloakLogoutUrl = `${keycloakRealmUrl}/protocol/openid-connect/logout`;

const registerRedirectUri = 'healthbook://login';

export const keycloakRegisterUrl =
  `${keycloakRealmUrl}/protocol/openid-connect/auth` +
  `?client_id=${encodeURIComponent(env.keycloakClientId)}` +
  `&response_type=code` +
  `&scope=openid` +
  `&kc_action=register` +
  `&redirect_uri=${encodeURIComponent(registerRedirectUri)}`;
