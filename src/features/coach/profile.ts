import * as SecureStore from 'expo-secure-store';
import { bmi, dailyCalorieTarget } from './metrics';
import type {
  ApiObjective,
  DietRecommendationRequest,
  Gender,
  WeeklyProgramRequest,
} from './types';

// Profil coach saisi à l'onboarding (maquettes "Faisons connaissance !" → niveau).
// Persisté en SecureStore (petit JSON) ; le programme généré, lui, reste en
// mémoire et est régénéré à la demande (pas encore de GET côté brain).

const PROFILE_KEY = 'healthbook.coach.profile';

/** Objectifs tels qu'affichés dans l'UI (4 cartes des maquettes). */
export type UiObjective = 'prise_muscle' | 'perte_gras' | 'gain_force' | 'bien_etre';

/** Tuiles matériel des maquettes (multi-sélection). */
export type EquipmentKey =
  | 'none'
  | 'dumbbells'
  | 'barbell'
  | 'bench'
  | 'bands'
  | 'full_gym';

/** 1=débutant, 2=intermédiaire, 3=avancé (miroir de experience_level). */
export type ExperienceLevel = 1 | 2 | 3;

export type CoachProfile = {
  firstName: string;
  age: number;
  weightKg: number;
  heightCm: number;
  gender: Gender;
  objective: UiObjective;
  equipment: EquipmentKey[];
  level: ExperienceLevel;
};

// ---------------------------------------------------------------------------
// Mappings UI → API
// ---------------------------------------------------------------------------

/** 4 objectifs UI → 3 objectifs du moteur (cf. enum Objective côté Nest). */
const OBJECTIVE_TO_API: Record<UiObjective, ApiObjective> = {
  prise_muscle: 'prise_muscle',
  perte_gras: 'perte_poids',
  // Pas d'objectif "force" dédié côté moteur : la prise de muscle est le
  // template le plus proche (musculation lourde, splits).
  gain_force: 'prise_muscle',
  // "Bien-être & Santé" → reprise (cardio doux, mobilité, marche).
  bien_etre: 'reprise',
};

/**
 * Tuiles UI → noms du catalogue `exercise_db.equipment` (dataset
 * free-exercise-db). Le matching backend est insensible à la casse et les
 * exercices "body only" passent toujours, donc "none" = liste vide.
 * "bench" n'existe pas comme équipement dans le catalogue (les exos de banc
 * sont classés barbell/dumbbell) : la sélection est gardée dans le profil
 * mais n'ajoute rien à la requête.
 */
const EQUIPMENT_TO_CATALOG: Record<EquipmentKey, string[]> = {
  none: [],
  dumbbells: ['dumbbell', 'kettlebells'],
  barbell: ['barbell', 'e-z curl bar'],
  bench: [],
  bands: ['bands'],
  full_gym: [
    'barbell',
    'dumbbell',
    'kettlebells',
    'cable',
    'machine',
    'e-z curl bar',
    'exercise ball',
    'medicine ball',
    'bands',
    'foam roll',
    'other',
  ],
};

/** Construit le corps de la requête weekly-program depuis le profil stocké. */
export function toWeeklyProgramRequest(p: CoachProfile): WeeklyProgramRequest {
  const equipment = [...new Set(p.equipment.flatMap((k) => EQUIPMENT_TO_CATALOG[k]))];
  return {
    age: p.age,
    gender: p.gender,
    weight_kg: p.weightKg,
    height_m: Math.round((p.heightCm / 100) * 100) / 100,
    experience_level: p.level,
    objective: OBJECTIVE_TO_API[p.objective],
    equipment_available: equipment,
  };
}

const ACTIVITY_BY_LEVEL: Record<
  ExperienceLevel,
  DietRecommendationRequest['physical_activity_level']
> = { 1: 'Sedentary', 2: 'Moderate', 3: 'Active' };

const WEEKLY_HOURS_BY_LEVEL: Record<ExperienceLevel, number> = { 1: 2, 2: 4, 3: 6 };

/**
 * Construit le corps de POST /recommendation/diet depuis le profil. Les champs
 * cliniques (cholestérol/tension/glycémie/sévérité) ne sont pas collectés par
 * l'app → valeurs normales par défaut ; le reste est dérivé du profil/niveau.
 */
export function toDietRequest(p: CoachProfile): DietRecommendationRequest {
  return {
    age: p.age,
    weight_kg: p.weightKg,
    height_cm: Math.round(p.heightCm),
    bmi: bmi(p),
    daily_caloric_intake: dailyCalorieTarget(p),
    weekly_exercise_hours: WEEKLY_HOURS_BY_LEVEL[p.level],
    gender: p.gender,
    physical_activity_level: ACTIVITY_BY_LEVEL[p.level],
    // Valeurs normales par défaut (champs cliniques non collectés par l'app).
    cholesterol_mg_dl: 190,
    blood_pressure_mmhg: 120,
    glucose_mg_dl: 90,
    severity: 'Mild',
  };
}

// ---------------------------------------------------------------------------
// Persistance (même pattern que features/auth/storage.ts)
// ---------------------------------------------------------------------------

export async function saveCoachProfile(profile: CoachProfile): Promise<void> {
  await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
}

export async function loadCoachProfile(): Promise<CoachProfile | null> {
  const raw = await SecureStore.getItemAsync(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CoachProfile;
  } catch {
    await SecureStore.deleteItemAsync(PROFILE_KEY);
    return null;
  }
}

export async function clearCoachProfile(): Promise<void> {
  await SecureStore.deleteItemAsync(PROFILE_KEY);
}
