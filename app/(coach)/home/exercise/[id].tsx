import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCoach } from '@/features/coach/CoachProvider';
import { exerciseImageUrl, exerciseSpecs } from '@/features/coach/labels';
import type { CatalogExercise, ProgramExercise } from '@/features/coach/types';
import { cardShadow } from '@/lib/shadows';

/**
 * Détail d'un exercice. Deux provenances :
 * - depuis la **Séance** → exo du programme (consignes séries/reps/repos) ;
 * - depuis la **Bibliothèque** → exo du catalogue (niveau, catégorie, muscles).
 * On cherche d'abord dans le programme, puis dans le catalogue (caché).
 */
export default function ExerciseDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { program, catalog, ensureCatalog } = useCoach();
  const [imageFailed, setImageFailed] = useState(false);

  // Au cas où on arrive ici sans avoir ouvert l'onglet Exercices (deep-link).
  useEffect(() => {
    void ensureCatalog();
  }, [ensureCatalog]);

  const programExo = useMemo<ProgramExercise | null>(() => {
    if (!program || !id) return null;
    for (const day of program.week)
      for (const session of day.sessions)
        for (const exo of session.exos)
          if (exo.exercise_id === id) return exo;
    return null;
  }, [program, id]);

  const catalogExo = useMemo<CatalogExercise | null>(() => {
    if (programExo || !catalog || !id) return null;
    return catalog.find((e) => e.exercise_id === id) ?? null;
  }, [programExo, catalog, id]);

  const exo = programExo ?? catalogExo;

  // Pas encore trouvé et catalogue en cours de chargement → loader.
  if (!exo && catalog === null) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator color="#5B2EE5" />
      </View>
    );
  }

  if (!exo) {
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
          Cet exercice n’est pas dans le catalogue.
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

  // Consignes (programme) OU repères catalogue (bibliothèque).
  const specs = programExo
    ? exerciseSpecs(programExo)
    : catalogExo
      ? [
          { label: 'Niveau', value: catalogExo.level || '—' },
          { label: 'Catégorie', value: catalogExo.category || '—' },
        ]
      : [];

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
              source={exerciseImageUrl(exo.exercise_id)}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              onError={() => setImageFailed(true)}
              accessibilityLabel={exo.exercise_name}
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
            {exo.exercise_name}
          </Text>
          {exo.equipment ? (
            <View className="mt-2 flex-row items-center gap-1.5">
              <Ionicons name="construct-outline" size={14} color="#6B6B6B" />
              <Text className="text-sm capitalize text-text-secondary">
                {exo.equipment}
              </Text>
            </View>
          ) : null}

          {/* Consignes / repères */}
          {specs.length > 0 ? (
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
                  <Text className="mt-1 text-xl font-extrabold capitalize text-text-primary">
                    {s.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Muscles ciblés */}
          {exo.muscles_targeted.length > 0 ? (
            <>
              <Text className="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-text-muted">
                Muscles ciblés
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {exo.muscles_targeted.map((m) => (
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
