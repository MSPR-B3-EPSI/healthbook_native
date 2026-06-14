import { env } from '@/config/env';
import { apiFetch } from '@/lib/http';
import type {
  WeeklyProgram,
  WeeklyProgramRequest,
  WorkoutCaloriesRequest,
  WorkoutCaloriesResponse,
} from './types';

// API du coach IA (healthai-brain-api), exposée derrière NGINX sur `/brain`.
// Le SSO Keycloak est mutualisé : `apiFetch` injecte le même Bearer que pour le
// réseau social ; seul change le préfixe de path via `baseUrl: env.coachBaseUrl`.

export type CoachStatus = { status: string };

/** Ping de disponibilité du coach. Sert surtout à valider le câblage `/brain`. */
export async function getCoachStatus(): Promise<CoachStatus> {
  return apiFetch<CoachStatus>('/status', { baseUrl: env.coachBaseUrl });
}

/**
 * Génère (et persiste côté brain) le programme hebdo personnalisé.
 * Pipeline backend : Nest → FastAPI (ML durée + règles métier + catalogue
 * ClickHouse) → Prisma. Renvoie les 7 jours + un `programId`.
 */
export async function generateWeeklyProgram(
  body: WeeklyProgramRequest,
): Promise<WeeklyProgram> {
  return apiFetch<WeeklyProgram>('/exercise-recommendation/weekly-program', {
    method: 'POST',
    body,
    baseUrl: env.coachBaseUrl,
  });
}

/**
 * Dernier programme persisté de l'utilisateur (404 si aucun). Appelé au
 * démarrage pour retrouver le programme existant au lieu d'en régénérer un.
 */
export async function getLatestProgram(): Promise<WeeklyProgram> {
  return apiFetch<WeeklyProgram>(
    '/exercise-recommendation/weekly-program/latest',
    { baseUrl: env.coachBaseUrl },
  );
}

/**
 * Prédiction des calories brûlées pour une séance (modèle RandomForest du
 * brain). Utilisée pour affiner l'estimation locale affichée sur la carte
 * de séance.
 */
export async function predictWorkoutCalories(
  body: WorkoutCaloriesRequest,
): Promise<WorkoutCaloriesResponse> {
  return apiFetch<WorkoutCaloriesResponse>('/recommendation/workout', {
    method: 'POST',
    body,
    baseUrl: env.coachBaseUrl,
  });
}

// ---------------------------------------------------------------------------
// Vision — analyse photo de repas
// ---------------------------------------------------------------------------

export type VisionPrediction = { label: string; score: number };
export type VisionAnalysis = { predictions: VisionPrediction[] };

/**
 * Envoie une photo de plat à POST /brain/vision/analyze (multipart, champ
 * `image` — cf. VisionController). Le brain proxie vers le modèle HuggingFace
 * `nateraw/food` et renvoie le top 5 des aliments reconnus.
 */
export async function analyzeMeal(photo: {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}): Promise<VisionAnalysis> {
  const form = new FormData();
  // React Native accepte {uri, name, type} comme partie de FormData.
  form.append('image', {
    uri: photo.uri,
    name: photo.fileName ?? 'meal.jpg',
    type: photo.mimeType ?? 'image/jpeg',
  } as unknown as Blob);

  return apiFetch<VisionAnalysis>('/vision/analyze', {
    method: 'POST',
    body: form,
    baseUrl: env.coachBaseUrl,
  });
}
