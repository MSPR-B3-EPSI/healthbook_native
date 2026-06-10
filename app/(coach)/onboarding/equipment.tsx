import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useCoach } from '@/features/coach/CoachProvider';
import { EquipmentTile, OnboardingScaffold } from '@/features/coach/components';
import type { EquipmentKey } from '@/features/coach/profile';

type EquipmentOption = {
  key: EquipmentKey;
  label: string;
  icon: React.ComponentProps<typeof EquipmentTile>['icon'];
};

// Grille 2 colonnes de la maquette. Le mapping vers les noms du catalogue
// d'exercices (free-exercise-db) vit dans profile.ts.
const OPTIONS: EquipmentOption[] = [
  { key: 'none', label: 'Aucun (poids du corps)', icon: 'body-outline' },
  { key: 'dumbbells', label: 'Haltères', icon: 'barbell-outline' },
  { key: 'barbell', label: 'Barre & Disques', icon: 'disc-outline' },
  { key: 'bench', label: 'Banc de musculation', icon: 'tablet-landscape-outline' },
  { key: 'bands', label: 'Élastiques', icon: 'infinite-outline' },
  { key: 'full_gym', label: 'Salle complète', icon: 'business-outline' },
];

/** Onboarding coach — étape 3/4 : matériel disponible (multi-sélection). */
export default function OnboardingEquipmentScreen() {
  const { draft, updateDraft } = useCoach();
  const [selected, setSelected] = useState<EquipmentKey[]>(draft.equipment ?? []);

  const toggle = (key: EquipmentKey) => {
    setSelected((prev) => {
      // "Aucun" est exclusif : il remplace le reste, et réciproquement.
      if (key === 'none') return prev.includes('none') ? [] : ['none'];
      const withoutNone = prev.filter((k) => k !== 'none');
      return withoutNone.includes(key)
        ? withoutNone.filter((k) => k !== key)
        : [...withoutNone, key];
    });
  };

  const onNext = () => {
    if (selected.length === 0) return;
    updateDraft({ equipment: selected });
    router.push('/(coach)/onboarding/level');
  };

  return (
    <OnboardingScaffold
      step={2}
      title="De quel matériel disposes-tu ?"
      subtitle="Sélectionne tout ce qui se trouve dans ton espace d'entraînement pour personnaliser tes séances."
      ctaLabel="Suivant"
      onNext={onNext}
      ctaDisabled={selected.length === 0}
    >
      <View className="flex-row flex-wrap gap-4">
        {OPTIONS.map((opt) => (
          <EquipmentTile
            key={opt.key}
            icon={opt.icon}
            label={opt.label}
            selected={selected.includes(opt.key)}
            onPress={() => toggle(opt.key)}
          />
        ))}
      </View>
    </OnboardingScaffold>
  );
}
