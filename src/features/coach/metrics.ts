import type { CoachProfile } from './profile';

// Métriques santé calculées localement depuis le profil onboarding.
// Formules standard (Mifflin-St Jeor, Deurenberg) : ordres de grandeur
// d'affichage pour l'onglet Stats/Nutrition — pas un avis médical, et à
// remplacer si le backend expose un jour ses propres dérivations (FastAPI
// calcule déjà BMI/fat% en interne sans les renvoyer).

export type BmiCategory = {
  label: 'Maigreur' | 'Normal' | 'Surpoids' | 'Obésité';
  /** Position du curseur sur la jauge (0 → 1, échelle 15–35 kg/m²). */
  position: number;
  tone: 'mint' | 'sun' | 'danger';
};

export function bmi(profile: CoachProfile): number {
  const m = profile.heightCm / 100;
  return Math.round((profile.weightKg / (m * m)) * 10) / 10;
}

export function bmiCategory(value: number): BmiCategory {
  const position = Math.min(1, Math.max(0, (value - 15) / 20));
  if (value < 18.5) return { label: 'Maigreur', position, tone: 'sun' };
  if (value < 25) return { label: 'Normal', position, tone: 'mint' };
  if (value < 30) return { label: 'Surpoids', position, tone: 'sun' };
  return { label: 'Obésité', position, tone: 'danger' };
}

/** Masse grasse estimée (formule de Deurenberg), bornée 5–50 %. */
export function bodyFatEstimate(profile: CoachProfile): number {
  const raw =
    1.2 * bmi(profile) +
    0.23 * profile.age -
    10.8 * (profile.gender === 'Male' ? 1 : 0) -
    5.4;
  return Math.round(Math.min(50, Math.max(5, raw)) * 10) / 10;
}

/**
 * Besoin calorique quotidien : BMR Mifflin-St Jeor × facteur d'activité
 * (déduit du niveau) ± ajustement objectif (déficit/surplus).
 */
export function dailyCalorieTarget(profile: CoachProfile): number {
  const bmr =
    10 * profile.weightKg +
    6.25 * profile.heightCm -
    5 * profile.age +
    (profile.gender === 'Male' ? 5 : -161);
  const activity = { 1: 1.4, 2: 1.55, 3: 1.7 }[profile.level];
  const objectiveFactor =
    profile.objective === 'perte_gras'
      ? 0.85
      : profile.objective === 'bien_etre'
        ? 1
        : 1.1; // prise de muscle / force : léger surplus
  return Math.round((bmr * activity * objectiveFactor) / 10) * 10;
}

/** Cible protéines (g/jour) : 1,6–2 g/kg selon l'objectif. */
export function dailyProteinTarget(profile: CoachProfile): number {
  const perKg =
    profile.objective === 'prise_muscle' || profile.objective === 'gain_force'
      ? 2
      : 1.6;
  return Math.round(profile.weightKg * perKg);
}
