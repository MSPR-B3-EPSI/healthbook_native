import type { DayOfWeek, ProgramSession, SessionKind } from './types';

// Libellés français + helpers d'affichage du programme (écran Séance).
// Le backend renvoie des enums techniques (session_kind, day_of_week) :
// tout ce qui est "présentation" vit ici, pas dans les écrans.

export type Intensity = 'légère' | 'modérée' | 'élevée';

type SessionMeta = { label: string; intensity: Intensity };

const SESSION_META: Record<SessionKind, SessionMeta> = {
  cardio_leger: { label: 'Cardio léger', intensity: 'légère' },
  cardio_moyen: { label: 'Cardio', intensity: 'modérée' },
  hiit: { label: 'HIIT', intensity: 'élevée' },
  musculation_full_body: { label: 'Full Body', intensity: 'élevée' },
  musculation_upper: { label: 'Haut du corps', intensity: 'élevée' },
  musculation_lower: { label: 'Bas du corps', intensity: 'élevée' },
  musculation_push: { label: 'Pecs & Tris – Force', intensity: 'élevée' },
  musculation_pull: { label: 'Dos & Biceps – Volume', intensity: 'élevée' },
  musculation_legs: { label: 'Jambes – Hypertrophie', intensity: 'élevée' },
  poids_de_corps: { label: 'Poids du corps', intensity: 'modérée' },
  mobilite: { label: 'Mobilité', intensity: 'légère' },
  marche: { label: 'Marche', intensity: 'légère' },
};

export function sessionLabel(kind: SessionKind): string {
  return SESSION_META[kind]?.label ?? kind;
}

export function sessionIntensity(kind: SessionKind): Intensity {
  return SESSION_META[kind]?.intensity ?? 'modérée';
}

export function intensityBadge(intensity: Intensity): string {
  return `INTENSITÉ ${intensity.toUpperCase()}`;
}

export const DAY_LABELS: Record<DayOfWeek, { short: string; long: string }> = {
  monday: { short: 'L', long: 'Lundi' },
  tuesday: { short: 'M', long: 'Mardi' },
  wednesday: { short: 'M', long: 'Mercredi' },
  thursday: { short: 'J', long: 'Jeudi' },
  friday: { short: 'V', long: 'Vendredi' },
  saturday: { short: 'S', long: 'Samedi' },
  sunday: { short: 'D', long: 'Dimanche' },
};

export const WEEK_ORDER: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

/** Jour courant au format backend (Date.getDay() : 0 = dimanche). */
export function todayKey(date = new Date()): DayOfWeek {
  const fromSunday: DayOfWeek[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return fromSunday[date.getDay()];
}

/** "55 min" / "1 h 10" depuis la durée prédite par le modèle (en heures). */
export function formatDuration(hours: number): string {
  const totalMin = Math.round(hours * 60);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}

/**
 * Estimation kcal d'une séance : poids × MET moyen (~6.5 pour de la
 * musculation/cardio mixte) × durée. Ordre de grandeur d'affichage uniquement —
 * la vraie prédiction viendra de POST /brain/recommendation/workout.
 */
export function estimateKcal(weightKg: number, durationHours: number): number {
  return Math.round(weightKg * 6.5 * durationHours);
}

/** "2min" / "90s" pour les badges repos. */
export function formatRest(seconds: number): string {
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60}min`;
  return `${seconds}s`;
}

/** Nombre total d'exercices d'une séance. */
export function sessionExerciseCount(session: ProgramSession): number {
  return session.exos.length;
}

/**
 * Image d'un exercice : le catalogue ClickHouse est seedé depuis le dataset
 * open source free-exercise-db, dont les images sont servies par GitHub avec
 * le même slug que `exercise_id`. Fallback visuel géré par ExerciseRow.
 */
export function exerciseImageUrl(exerciseId: string): string {
  return `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${exerciseId}/0.jpg`;
}

/**
 * Catégorie attendue par le modèle calories (dataset gym_members) pour un
 * type de séance du programme.
 */
export function workoutTypeForSession(
  kind: SessionKind,
): 'Cardio' | 'HIIT' | 'Strength' | 'Yoga' {
  if (kind === 'hiit') return 'HIIT';
  if (kind === 'mobilite') return 'Yoga';
  if (kind === 'cardio_leger' || kind === 'cardio_moyen' || kind === 'marche') {
    return 'Cardio';
  }
  return 'Strength';
}
