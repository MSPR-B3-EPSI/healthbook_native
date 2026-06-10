import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useCoach } from '@/features/coach/CoachProvider';
import { OnboardingScaffold, OptionCard } from '@/features/coach/components';
import type { CoachProfile, ExperienceLevel } from '@/features/coach/profile';

type LevelOption = {
  key: ExperienceLevel;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof OptionCard>['icon'];
};

// Miroir de experience_level (1/2/3) du WeeklyProgramRequestDto.
const OPTIONS: LevelOption[] = [
  { key: 1, title: 'Débutant', subtitle: '0 - 6 mois d’expérience', icon: 'happy-outline' },
  { key: 2, title: 'Intermédiaire', subtitle: '6 mois - 2 ans d’expérience', icon: 'trending-up-outline' },
  { key: 3, title: 'Avancé', subtitle: '+2 ans d’expérience', icon: 'flash-outline' },
];

/**
 * Onboarding coach — étape 4/4 : niveau. "Terminer" persiste le profil puis
 * route vers l'accueil, qui déclenche la génération du programme (CoachProvider).
 */
export default function OnboardingLevelScreen() {
  const { draft, updateDraft, completeOnboarding } = useCoach();
  const [selected, setSelected] = useState<ExperienceLevel | null>(
    draft.level ?? null,
  );
  const [saving, setSaving] = useState(false);

  const onFinish = async () => {
    if (!selected) return;
    updateDraft({ level: selected });

    // Garde-fou : si on a atterri ici sans passer par les étapes précédentes
    // (deep link), on renvoie au début plutôt que d'envoyer un profil partiel.
    const { firstName, age, weightKg, heightCm, gender, objective, equipment } =
      draft;
    if (
      !firstName ||
      age == null ||
      weightKg == null ||
      heightCm == null ||
      !gender ||
      !objective ||
      !equipment?.length
    ) {
      Alert.alert(
        'Profil incomplet',
        'Certaines informations manquent, reprenons depuis le début.',
        [{ text: 'OK', onPress: () => router.replace('/(coach)/onboarding') }],
      );
      return;
    }

    const profile: CoachProfile = {
      firstName,
      age,
      weightKg,
      heightCm,
      gender,
      objective,
      equipment,
      level: selected,
    };

    setSaving(true);
    try {
      await completeOnboarding(profile);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(coach)/home');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingScaffold
      step={3}
      title="Quel est ton niveau en musculation ?"
      subtitle="Cela nous aide à personnaliser tes programmes d'entraînement et tes objectifs de progression."
      ctaLabel="Terminer"
      onNext={() => void onFinish()}
      ctaDisabled={!selected}
      ctaLoading={saving}
    >
      <View className="gap-4">
        {OPTIONS.map((opt) => (
          <OptionCard
            key={opt.key}
            icon={opt.icon}
            iconBg="#F5F5F5"
            iconColor="#1A1A1A"
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
