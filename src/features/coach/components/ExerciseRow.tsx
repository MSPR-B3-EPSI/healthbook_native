import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { cardShadow } from '@/lib/shadows';
import {
  exerciseFamily,
  exerciseImageUrl,
  exerciseSummary,
  formatRest,
} from '../labels';
import type { ProgramExercise } from '../types';

type ExerciseRowProps = {
  exercise: ProgramExercise;
  onPress?: () => void;
};

/**
 * Ligne d'exercice de la liste du jour : vignette, nom, "3 séries • 8 reps",
 * badges charge (violet) + repos (gris), chevron (cf. maquette accueil).
 */
export default function ExerciseRow({ exercise, onPress }: ExerciseRowProps) {
  // Les images viennent de free-exercise-db (même slug que le catalogue) ;
  // si un slug n'a pas d'image, on retombe sur une vignette icône.
  const [imageFailed, setImageFailed] = useState(false);

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
        <Text className="mt-0.5 text-sm text-text-secondary">
          {exerciseSummary(exercise)}
        </Text>
        <View className="mt-1.5 flex-row gap-2">
          <View className="rounded-full bg-coach-light px-2.5 py-0.5">
            <Text className="text-xs font-semibold text-coach">
              {exercise.weight_kg != null
                ? `${exercise.weight_kg}kg`
                : 'Poids du corps'}
            </Text>
          </View>
          {/* Badge repos : seulement en muscu (cardio/HIIT portent leur cadence
              dans le résumé ci-dessus). */}
          {exerciseFamily(exercise) === 'muscu' &&
          exercise.rest_seconds != null ? (
            <View className="rounded-full bg-background px-2.5 py-0.5">
              <Text className="text-xs font-semibold text-text-secondary">
                Repos: {formatRest(exercise.rest_seconds)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#C2C6CE" />
    </Pressable>
  );
}
