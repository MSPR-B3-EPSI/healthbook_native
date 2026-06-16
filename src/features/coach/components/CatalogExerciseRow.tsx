import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { cardShadow } from '@/lib/shadows';
import { exerciseImageUrl } from '../labels';
import type { CatalogExercise } from '../types';

type Props = {
  exercise: CatalogExercise;
  onPress?: () => void;
};

/**
 * Ligne d'exercice de la bibliothèque (catalogue) : vignette, nom, niveau +
 * équipement, muscle principal. Pas de séries/reps — c'est du parcours, pas une
 * prescription (≠ `ExerciseRow`, qui sert la séance du jour).
 */
export default function CatalogExerciseRow({ exercise, onPress }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const primaryMuscle = exercise.muscles_targeted[0];
  const subtitle =
    [exercise.level, exercise.equipment].filter(Boolean).join(' • ') ||
    'Poids du corps';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={exercise.exercise_name}
      onPress={onPress}
      className="flex-row items-center rounded-2xl bg-surface p-3"
      style={({ pressed }) => [cardShadow, pressed ? { opacity: 0.92 } : null]}
    >
      <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-background">
        {imageFailed ? (
          <Ionicons name="barbell-outline" size={22} color="#9AA0A6" />
        ) : (
          <Image
            source={exerciseImageUrl(exercise.exercise_id)}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
            onError={() => setImageFailed(true)}
            accessibilityLabel={exercise.exercise_name}
          />
        )}
      </View>

      <View className="ml-3 flex-1">
        <Text
          className="text-base font-bold text-text-primary"
          numberOfLines={1}
        >
          {exercise.exercise_name}
        </Text>
        <Text
          className="mt-0.5 text-sm capitalize text-text-secondary"
          numberOfLines={1}
        >
          {subtitle}
        </Text>
        {primaryMuscle ? (
          <View className="mt-1.5 flex-row">
            <View className="rounded-full bg-coach-light px-2.5 py-0.5">
              <Text className="text-xs font-semibold capitalize text-coach">
                {primaryMuscle}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color="#C2C6CE" />
    </Pressable>
  );
}
