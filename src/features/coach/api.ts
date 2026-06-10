import { env } from '@/config/env';
import { apiFetch } from '@/lib/http';

// API du coach IA (healthai-brain-api), exposée derrière NGINX sur `/brain`.
// Le SSO Keycloak est mutualisé : `apiFetch` injecte le même Bearer que pour le
// réseau social ; seul change le préfixe de path via `baseUrl: env.coachBaseUrl`.
//
// ⚠️ Backend encore vide (stub) : ces appels renverront 404/502 tant que les
// endpoints `/brain/*` n'existent pas. Le rôle du coach (chat / analyse d'image
// / conseils) reste à définir — calquer src/features/publications/ pour la suite.

export type CoachStatus = { status: string };

/** Ping de disponibilité du coach. Sert surtout à valider le câblage `/brain`. */
export async function getCoachStatus(): Promise<CoachStatus> {
  return apiFetch<CoachStatus>('/status', { baseUrl: env.coachBaseUrl });
}
