import { useEffect, useState } from 'react';
import { predictWorkoutCalories } from './api';
import { useCoach } from './CoachProvider';
import { estimateKcal, workoutTypeForSession } from './labels';
import { bmi, bodyFatEstimate } from './metrics';
import type { ProgramSession } from './types';

// Cache mémoire : la prédiction ne dépend que du profil + type de séance +
// durée, inutile de rappeler le modèle à chaque focus d'écran.
const cache = new Map<string, number>();

/**
 * Calories estimées pour une séance : affiche immédiatement l'estimation
 * locale (poids × MET × durée) puis la remplace par la prédiction du modèle
 * RandomForest du brain (POST /brain/recommendation/workout). En cas d'échec
 * réseau, l'estimation locale reste affichée — pas d'erreur visible.
 */
export function useSessionCalories(session: ProgramSession | null): number | null {
  const { profile, program } = useCoach();

  const duration = program?.duration_predicted_hours ?? null;
  const fallback =
    profile && duration != null ? estimateKcal(profile.weightKg, duration) : null;
  const key =
    session && profile && duration != null
      ? `${session.session_kind}|${duration}|${profile.weightKg}|${profile.level}`
      : null;

  const [kcal, setKcal] = useState<number | null>(
    key && cache.has(key) ? (cache.get(key) ?? null) : fallback,
  );

  useEffect(() => {
    if (!key || !session || !profile || !program) {
      setKcal(fallback);
      return;
    }
    if (cache.has(key)) {
      setKcal(cache.get(key) ?? null);
      return;
    }
    setKcal(fallback);

    let cancelled = false;
    const frequency = program.week.filter(
      (d) => !d.is_recovery && d.sessions.length > 0,
    ).length;

    predictWorkoutCalories({
      age: profile.age,
      weight_kg: profile.weightKg,
      height_m: Math.round(profile.heightCm) / 100,
      bmi: bmi(profile),
      session_duration_hours: program.duration_predicted_hours,
      workout_frequency_days_per_week: frequency,
      experience_level: profile.level,
      fat_percentage: bodyFatEstimate(profile),
      gender: profile.gender,
      workout_type: workoutTypeForSession(session.session_kind),
    })
      .then((res) => {
        const rounded = Math.round(res.estimated_calories_burned);
        cache.set(key, rounded);
        if (!cancelled) setKcal(rounded);
      })
      .catch((err) => {
        // Silencieux : l'estimation locale reste affichée.
        if (__DEV__) console.log('[Coach] Prédiction calories indisponible :', err);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return kcal;
}
