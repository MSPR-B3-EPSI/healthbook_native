import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type ScanMealCardProps = {
  onPress: () => void;
  loading?: boolean;
};

/**
 * Carte "Scanne ton plat" (bord pointillé, cf. maquette Nutrition).
 * Le parent ouvre caméra/galerie puis envoie l'image à /brain/vision/analyze.
 */
export default function ScanMealCard({ onPress, loading = false }: ScanMealCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Scanner ton plat"
      onPress={onPress}
      disabled={loading}
      className="items-center rounded-3xl border-2 border-dashed border-coach/30 bg-surface px-6 py-8"
      style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
    >
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-coach-light">
        {loading ? (
          <ActivityIndicator color="#5B2EE5" />
        ) : (
          <Ionicons name="camera-outline" size={26} color="#5B2EE5" />
        )}
      </View>
      <Text className="mt-3 text-lg font-bold text-text-primary">
        {loading ? 'Analyse en cours' : 'Scanne ton plat'}
      </Text>
      <Text className="mt-1 text-center text-sm text-text-secondary">
        {loading
          ? 'Identification des aliments sur la photo.'
          : 'Prends en photo ton assiette, l’IA identifie ton plat.'}
      </Text>
    </Pressable>
  );
}
