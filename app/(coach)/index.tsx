import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { EmptyState, Screen } from '@/components';

// Placeholder de l'univers Coach IA. Le rôle (chat / analyse d'image / conseils)
// et la vraie tab bar viendront quand l'API /brain (healthai-brain-api) existera.
// cf. src/features/coach/api.ts pour le câblage réseau déjà prêt.
export default function CoachHomeScreen() {
  return (
    <Screen>
      <View className="flex-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Revenir au choix d'univers"
          onPress={() => router.navigate('/(hub)')}
          className="mt-2 flex-row items-center gap-1 self-start"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color="#007AFF" />
          <Text className="text-base font-semibold text-primary">Univers</Text>
        </Pressable>

        <EmptyState
          emoji="🤖"
          title="HealthAI arrive bientôt"
          description="Ton coach santé intelligent est en préparation. Reviens vite !"
        />
      </View>
    </Screen>
  );
}
