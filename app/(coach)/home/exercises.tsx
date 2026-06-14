import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/AuthProvider';
import { useCoach } from '@/features/coach/CoachProvider';
import { CoachHeader, ExerciseRow } from '@/features/coach/components';
import type { ProgramExercise } from '@/features/coach/types';
import { cardShadow } from '@/lib/shadows';

/**
 * Onglet Exercices : bibliothèque construite depuis le programme généré
 * (exercices dédupliqués), avec recherche et filtre par muscle ciblé.
 * Le catalogue complet (873 exos ClickHouse) nécessitera un endpoint brain
 * dédié — à demander côté backend.
 */
export default function CoachExercisesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile, program } = useCoach();

  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<string | null>(null);

  // Exercices uniques du programme (un même exo peut revenir plusieurs jours).
  const allExercises = useMemo(() => {
    if (!program) return [] as ProgramExercise[];
    const seen = new Map<string, ProgramExercise>();
    for (const day of program.week)
      for (const session of day.sessions)
        for (const exo of session.exos)
          if (!seen.has(exo.exercise_id)) seen.set(exo.exercise_id, exo);
    return [...seen.values()].sort((a, b) =>
      a.exercise_name.localeCompare(b.exercise_name),
    );
  }, [program]);

  const muscles = useMemo(
    () =>
      [...new Set(allExercises.flatMap((e) => e.muscles_targeted))].sort(),
    [allExercises],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allExercises.filter((e) => {
      if (q && !e.exercise_name.toLowerCase().includes(q)) return false;
      if (muscle && !e.muscles_targeted.includes(muscle)) return false;
      return true;
    });
  }, [allExercises, query, muscle]);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
      <CoachHeader name={profile?.firstName ?? user?.username} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.exercise_id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => (
          <ExerciseRow
            exercise={item}
            onPress={() =>
              router.push(`/(coach)/home/exercise/${item.exercise_id}`)
            }
          />
        )}
        ListHeaderComponent={
          <View>
            <Text className="mt-2 text-3xl font-extrabold text-text-primary">
              Tous les Exercices
            </Text>
            <Text className="mb-5 mt-1 text-base text-text-secondary">
              Les exercices de ton programme de la semaine, en détail.
            </Text>

            {/* Recherche */}
            <View
              className="flex-row items-center gap-2 rounded-2xl bg-surface px-4 py-1"
              style={cardShadow}
            >
              <Ionicons name="search-outline" size={18} color="#9AA0A6" />
              <TextInput
                className="flex-1 py-3 text-base text-text-primary"
                placeholder="Rechercher un exercice…"
                placeholderTextColor="#9AA0A6"
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color="#C2C6CE" />
                </Pressable>
              ) : null}
            </View>

            {/* Filtre par muscle ciblé */}
            {muscles.length > 0 ? (
              <View className="mb-2 mt-4">
                <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-text-muted">
                  Muscle ciblé
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {muscles.map((m) => {
                    const active = muscle === m;
                    return (
                      <Pressable
                        key={m}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => setMuscle(active ? null : m)}
                        className={`rounded-full px-3 py-1.5 ${
                          active ? 'bg-coach' : 'bg-surface'
                        }`}
                        style={active ? null : cardShadow}
                      >
                        <Text
                          className={`text-xs font-semibold capitalize ${
                            active ? 'text-white' : 'text-text-secondary'
                          }`}
                        >
                          {m}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {filtered.length > 0 ? (
              <Text className="mb-3 mt-3 text-xs font-bold uppercase tracking-widest text-text-muted">
                {filtered.length} exercice{filtered.length > 1 ? 's' : ''}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View className="items-center px-6 pt-12">
            <Ionicons
              name={allExercises.length === 0 ? 'barbell-outline' : 'search-outline'}
              size={32}
              color="#9AA0A6"
            />
            <Text className="mt-3 text-center text-lg font-bold text-text-primary">
              {allExercises.length === 0
                ? 'Aucun programme pour le moment'
                : 'Aucun résultat'}
            </Text>
            <Text className="mt-1 text-center text-sm text-text-secondary">
              {allExercises.length === 0
                ? 'Génère ton programme depuis l’onglet Séance pour retrouver tes exercices ici.'
                : 'Modifie ta recherche ou retire le filtre.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
