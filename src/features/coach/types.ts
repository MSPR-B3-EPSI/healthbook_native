// Types miroirs des DTOs de healthai-brain-api (exposed-nest-api).
// cf. exposed-nest-api/src/exercise-recommendation/dto/*.dto.ts
// Props en snake_case : c'est le format JSON attendu/renvoyé par le backend
// (cohérence Nest ↔ FastAPI), on ne le re-mappe pas côté mobile.

export type Gender = 'Male' | 'Female';

/** Objectifs côté API (3 valeurs). L'UI en propose 4, cf. mapping dans profile.ts. */
export type ApiObjective = 'perte_poids' | 'reprise' | 'prise_muscle';

export type FrequencyProfile = 'occasionnel' | 'regulier' | 'intensif';

export type SessionKind =
  | 'cardio_leger'
  | 'cardio_moyen'
  | 'hiit'
  | 'musculation_full_body'
  | 'musculation_upper'
  | 'musculation_lower'
  | 'musculation_push'
  | 'musculation_pull'
  | 'musculation_legs'
  | 'poids_de_corps'
  | 'mobilite'
  | 'marche';

export type MuscleSplit = 'none' | 'full_body' | 'upper_lower' | 'ppl';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

/** Corps de POST /brain/exercise-recommendation/weekly-program. */
export type WeeklyProgramRequest = {
  /** 18–80 (validé backend) */
  age: number;
  gender: Gender;
  /** 30–200 kg */
  weight_kg: number;
  /** 1.2–2.3 m (l'UI saisit des cm, conversion dans profile.ts) */
  height_m: number;
  /** 1=débutant, 2=intermédiaire, 3=avancé */
  experience_level: number;
  objective: ApiObjective;
  /** Noms d'équipement du catalogue `exercise_db.equipment` (ex: "barbell") */
  equipment_available: string[];
};

/**
 * Exercice d'un programme — 3 grammaires d'effort (D27). Selon la famille de la
 * séance parente, **un seul groupe** de champs est rempli, les autres sont null :
 * - **Musculation** (`musculation_*`, `poids_de_corps`) → `sets`, `reps`, `rest_seconds`.
 * - **Cardio continu** (`cardio_*`, `marche`, `mobilite`) → `duration_minutes`.
 * - **HIIT** → `work_seconds`, `hiit_rest_seconds`, `rounds`.
 */
export type ProgramExercise = {
  /** Slug du catalogue (ex: "3_4_Sit-Up") — sert aussi à construire l'URL d'image. */
  exercise_id: string;
  exercise_name: string;
  // — Musculation
  sets?: number | null;
  reps?: number | null;
  rest_seconds?: number | null;
  // — Cardio continu
  duration_minutes?: number | null;
  // — HIIT (intervalles)
  work_seconds?: number | null;
  hiit_rest_seconds?: number | null;
  rounds?: number | null;
  // — Communs
  /** null = poids du corps */
  weight_kg?: number | null;
  equipment?: string | null;
  muscles_targeted: string[];
};

export type ProgramSession = {
  session_kind: SessionKind;
  exos: ProgramExercise[];
};

export type ProgramDay = {
  day_of_week: DayOfWeek;
  is_recovery: boolean;
  sessions: ProgramSession[];
};

/** Réponse de weekly-program (+ id de persistance côté brain). */
export type WeeklyProgram = {
  week: ProgramDay[];
  duration_predicted_hours: number;
  objective: ApiObjective;
  frequency_profile: FrequencyProfile;
  muscle_split?: MuscleSplit | null;
  programId: number;
};

/** Corps de POST /brain/recommendation/workout (modèle calories RandomForest). */
export type WorkoutCaloriesRequest = {
  age: number;
  weight_kg: number;
  height_m: number;
  bmi: number;
  session_duration_hours: number;
  workout_frequency_days_per_week: number;
  /** 1=débutant, 2=intermédiaire, 3=avancé */
  experience_level: number;
  fat_percentage: number;
  gender: Gender;
  workout_type: 'Cardio' | 'HIIT' | 'Strength' | 'Yoga';
};

export type WorkoutCaloriesResponse = {
  estimated_calories_burned: number;
};
