import { Ionicons } from '@expo/vector-icons';
import { router, type ErrorBoundaryProps } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

type UniverseErrorBoundaryProps = ErrorBoundaryProps & {
  /** Nom de l'univers concerné (affiché). Absent = boundary racine (filet de sécurité). */
  universe?: string;
};

/**
 * Fallback rendu par expo-router quand un écran lève une erreur au rendu.
 * Posé PAR univers : expo-router enveloppe chaque groupe de routes dans son propre
 * <Try>, donc un crash dans HealthBook n'unmonte PAS HealthAI (ni le hub) — et inversement.
 * Volontairement SANS dépendance aux providers (safe-area, gesture-handler) pour rester
 * rendable même au niveau racine, hors SafeAreaProvider.
 */
export function UniverseErrorBoundary({
  error,
  retry,
  universe,
}: UniverseErrorBoundaryProps) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="mb-4 text-6xl">😵‍💫</Text>
      <Text className="mb-2 text-center text-xl font-semibold text-text-primary">
        {universe
          ? `${universe} a rencontré un problème`
          : 'Un problème est survenu'}
      </Text>
      <Text className="mb-6 text-center text-base text-text-secondary">
        {universe
          ? 'Cet univers est momentanément indisponible. Les autres restent accessibles.'
          : 'Réessaie, ou reviens à l’accueil.'}
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          void retry();
        }}
        className="mb-3 w-full max-w-xs rounded-xl bg-primary px-5 py-3"
        style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
      >
        <Text className="text-center text-base font-semibold text-white">
          Réessayer
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace('/(hub)')}
        className="flex-row items-center gap-1"
        hitSlop={8}
      >
        <Ionicons name="apps-outline" size={18} color="#007AFF" />
        <Text className="text-base font-semibold text-primary">
          Retour au hub
        </Text>
      </Pressable>

      {__DEV__ && error?.message ? (
        <Text className="mt-6 text-center text-xs text-text-muted" selectable>
          {error.message}
        </Text>
      ) : null}
    </View>
  );
}
