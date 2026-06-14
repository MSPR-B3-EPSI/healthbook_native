import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Text, View } from 'react-native';
import { floatingShadow } from '@/lib/shadows';
import type { VisionPrediction } from '../api';

type MealAnalysisCardProps = {
  /** URI locale de la photo envoyée. */
  imageUri: string;
  predictions: VisionPrediction[];
};

/** "pizza" (slug du dataset food-101) → "Pizza". */
function prettyLabel(label: string): string {
  const clean = label.replace(/_/g, ' ');
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Résultat du scan de plat : photo + badge "ANALYSE IA" + top prédictions du
 * modèle vision (nateraw/food) avec barres de confiance.
 */
export default function MealAnalysisCard({
  imageUri,
  predictions,
}: MealAnalysisCardProps) {
  const top = predictions[0];

  return (
    <View className="overflow-hidden rounded-3xl bg-surface" style={floatingShadow}>
      <View className="h-44">
        <Image
          source={imageUri}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          accessibilityLabel="Photo de ton plat"
        />
        <View className="absolute right-3 top-3 flex-row items-center gap-1 rounded-full bg-black/55 px-3 py-1.5">
          <Ionicons name="sparkles" size={12} color="#FFFFFF" />
          <Text className="text-[11px] font-bold tracking-wider text-white">
            ANALYSE IA
          </Text>
        </View>
      </View>

      <View className="p-4">
        {top ? (
          <Text className="text-xl font-extrabold text-text-primary">
            {prettyLabel(top.label)}
          </Text>
        ) : null}
        <Text className="mt-1 text-sm text-text-secondary">
          Aliments reconnus sur la photo :
        </Text>

        <View className="mt-3 gap-2.5">
          {predictions.map((p) => (
            <View key={p.label} className="flex-row items-center gap-3">
              <Text
                className="w-32 text-sm font-semibold text-text-primary"
                numberOfLines={1}
              >
                {prettyLabel(p.label)}
              </Text>
              <View className="h-2 flex-1 overflow-hidden rounded-full bg-coach-light">
                <View
                  className="h-2 rounded-full bg-coach"
                  style={{ width: `${Math.round(p.score * 100)}%` }}
                />
              </View>
              <Text className="w-10 text-right text-xs font-bold text-coach">
                {Math.round(p.score * 100)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
