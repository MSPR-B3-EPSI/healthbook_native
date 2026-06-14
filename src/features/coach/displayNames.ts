import type { EquipmentKey, ExperienceLevel, UiObjective } from './profile';

// Libellés d'affichage du profil coach (Paramètres, Stats).

export const OBJECTIVE_LABELS: Record<UiObjective, string> = {
  prise_muscle: 'Prise de muscle',
  perte_gras: 'Perte de gras',
  gain_force: 'Gain de force',
  bien_etre: 'Bien-être & Santé',
};

export const EQUIPMENT_LABELS: Record<EquipmentKey, string> = {
  none: 'Poids du corps',
  dumbbells: 'Haltères',
  barbell: 'Barre & Disques',
  bench: 'Banc',
  bands: 'Élastiques',
  full_gym: 'Salle complète',
};

export const LEVEL_LABELS: Record<ExperienceLevel, string> = {
  1: 'Débutant',
  2: 'Intermédiaire',
  3: 'Avancé',
};

export function equipmentSummary(keys: EquipmentKey[]): string {
  return keys.map((k) => EQUIPMENT_LABELS[k]).join(', ');
}
