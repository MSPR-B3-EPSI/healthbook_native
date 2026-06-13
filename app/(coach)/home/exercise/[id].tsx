import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCoach } from '@/features/coach/CoachProvider';
import { exerciseImageUrl, formatRest } from '@/features/coach/labels';
import type { ProgramExercise } from '@/features/coach/types';
import { cardShadow } from '@/lib/shadows';

/**
 * Détail d'un exercice du programme : visuel du catalogue, consignes
 * (séries/répétitions/repos/charge), muscles ciblés et équipement.
 * Données entièrement issues de la réponse weekly-program — aucun appel
 * supplémentaire nécessaire.
 */
export default function ExerciseDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { program } = useCoach();
  const [imageFailed, setImageFailed] = useState(false);

  const exercise = useMemo<ProgramExercise | null>(() => {
    if (!program || !id) return null;
    for (const day of program.week)
      for (const session of day.sessions)
        for (const exo of session.exos)
          if (exo.exercise_id === id) return exo;
    return null;
  }, [program, id]);

  if (!exercise) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background px-6"
        style={{ paddingTop: insets.top }}
      >
        <Ionicons name="barbell-outline" size={32} color="#9AA0A6" />
        <Text className="mt-3 text-center text-lg font-bold text-text-primary">
          Exercice introuvable
        </Text>
        <Text className="mt-1 text-center text-sm text-text-secondary">
          Cet exercice ne fait plus partie de ton programme actuel.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="mt-6 rounded-full bg-coach px-6 py-3"
        >
          <Text className="text-base font-bold text-white">Retour</Text>
        </Pressable>
      </View>
    );
  }

  const specs = [
    { label: 'Séries', value: String(exercise.sets) },
    { label: 'Répétitions', value: String(exercise.reps) },
    { label: 'Repos', value: formatRest(exercise.rest_seconds) },
    {
      label: 'Charge',
      value:
        exercise.weight_kg != null ? `${exercise.weight_kg} kg` : 'Poids du corps',
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Visuel plein écran + bouton retour en surimpression. */}
        <View className="h-72 bg-[#23242B]">
          {!imageFailed ? (
            <Image
              source={exerciseImageUrl(exercise.exercise_id)}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              onError={() => setImageFailed(true)}
              accessibilityLabel={exercise.exercise_name}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="barbell-outline" size={48} color="#6B6B6B" />
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={() => router.back()}
            className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-black/50"
            style={{ top: insets.top + 8 }}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View className="px-5 pt-5">
          <Text className="text-3xl font-extrabold text-text-primary">
            {exercise.exercise_name}
          </Text>
          {exercise.equipment ? (
            <View className="mt-2 flex-row items-center gap-1.5">
              <Ionicons name="construct-outline" size={14} color="#6B6B6B" />
              <Text className="text-sm capitalize text-text-secondary">
                {exercise.equipment}
              </Text>
            </View>
          ) : null}

          {/* Consignes */}
          <View className="mt-5 flex-row flex-wrap gap-3">
            {specs.map((s) => (
              <View
                key={s.label}
                className="rounded-2xl bg-surface px-4 py-3"
                style={[{ flexBasis: '47%', flexGrow: 1 }, cardShadow]}
              >
                <Text className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  {s.label}
                </Text>
                <Text className="mt-1 text-xl font-extrabold text-text-primary">
                  {s.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Muscles ciblés */}
          {exercise.muscles_targeted.length > 0 ? (
            <>
              <Text className="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-text-muted">
                Muscles ciblés
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {exercise.muscles_targeted.map((m) => (
                  <View
                    key={m}
                    className="rounded-full bg-coach-light px-3 py-1.5"
                  >
                    <Text className="text-xs font-semibold capitalize text-coach">
                      {m}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
