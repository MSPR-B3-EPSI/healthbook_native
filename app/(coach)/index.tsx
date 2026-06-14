import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useCoach } from '@/features/coach/CoachProvider';

/**
 * Porte d'entrée de l'univers coach : onboarding si aucun profil n'a encore
 * été créé, sinon directement l'accueil (tabs Séance/Nutrition/…).
 */
export default function CoachGate() {
  const { status, profile } = useCoach();

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#5B2EE5" />
      </View>
    );
  }

  return profile ? (
    <Redirect href="/(coach)/home" />
  ) : (
    <Redirect href="/(coach)/onboarding" />
  );
}
