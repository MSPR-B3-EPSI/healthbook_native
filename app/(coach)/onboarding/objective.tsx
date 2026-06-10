import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useCoach } from '@/features/coach/CoachProvider';
import { OnboardingScaffold, OptionCard } from '@/features/coach/components';
import type { UiObjective } from '@/features/coach/profile';

type ObjectiveOption = {
  key: UiObjective;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof OptionCard>['icon'];
  iconBg: string;
  iconColor: string;
};

// 4 cartes de la maquette. Le mapping vers les 3 objectifs du moteur
// (perte_poids / reprise / prise_muscle) vit dans profile.ts.
const OPTIONS: ObjectiveOption[] = [
  {
    key: 'prise_muscle',
    title: 'Prise de muscle',
    subtitle: 'Augmenter le volume et la densité',
    icon: 'barbell-outline',
    iconBg: '#EDE8FC',
    iconColor: '#5B2EE5',
  },
  {
    key: 'perte_gras',
    title: 'Perte de gras',
    subtitle: 'Affiner la silhouette durablement',
    icon: 'trending-down-outline',
    iconBg: '#D8F5E5',
    iconColor: '#22B573',
  },
  {
    key: 'gain_force',
    title: 'Gain de force',
    subtitle: 'Améliorer vos performances pures',
    icon: 'flash-outline',
    iconBg: '#FCF3D2',
    iconColor: '#E8A800',
  },
  {
    key: 'bien_etre',
    title: 'Bien-être & Santé',
    subtitle: 'Équilibre mental et vitalité',
    icon: 'heart-circle-outline',
    iconBg: '#D8F5E5',
    iconColor: '#16A085',
  },
];

/** Onboarding coach — étape 2/4 : objectif principal (choix unique). */
export default function OnboardingObjectiveScreen() {
  const { draft, updateDraft } = useCoach();
  const [selected, setSelected] = useState<UiObjective | null>(
    draft.objective ?? null,
  );

  const onNext = () => {
    if (!selected) return;
    updateDraft({ objective: selected });
    router.push('/(coach)/onboarding/equipment');
  };

  return (
    <OnboardingScaffold
      step={1}
      title="Quel est ton objectif principal ?"
      subtitle="Personnalisez votre sanctuaire de santé en choisissant la direction qui vous inspire aujourd'hui."
      ctaLabel="Suivant"
      onNext={onNext}
      ctaDisabled={!selected}
    >
      <View className="gap-4">
        {OPTIONS.map((opt) => (
          <OptionCard
            key={opt.key}
            icon={opt.icon}
            iconBg={opt.iconBg}
            iconColor={opt.iconColor}
            title={opt.title}
            subtitle={opt.subtitle}
            selected={selected === opt.key}
            onPress={() => setSelected(opt.key)}
          />
        ))}
      </View>
    </OnboardingScaffold>
  );
}
