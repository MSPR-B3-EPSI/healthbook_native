import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/AuthProvider';
import { useCoach } from '@/features/coach/CoachProvider';
import { CatalogExerciseRow, CoachHeader } from '@/features/coach/components';
import { cardShadow } from '@/lib/shadows';

/**
 * Onglet Exercices : bibliothèque complète issue du catalogue brain
 * (`GET /brain/exercise-recommendation/exercises`, ~873 exos ClickHouse),
 * avec recherche et filtre par muscle ciblé. Indépendant du programme.
 */
export default function CoachExercisesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile, catalog, ensureCatalog } = useCoach();

  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<string | null>(null);

  // Chargé une fois (caché dans CoachProvider) à l'ouverture de l'onglet.
  useEffect(() => {
    void ensureCatalog();
  }, [ensureCatalog]);

  const allExercises = useMemo(() => catalog ?? [], [catalog]);

  const muscles = useMemo(
    () => [...new Set(allExercises.flatMap((e) => e.muscles_targeted))].sort(),
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

  const loading = catalog === null;

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
          <CatalogExerciseRow
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
              La bibliothèque complète, recherche et filtre par muscle.
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
          loading ? (
            <View className="items-center px-6 pt-12">
              <ActivityIndicator color="#5B2EE5" />
              <Text className="mt-3 text-center text-sm text-text-secondary">
                Chargement de la bibliothèque…
              </Text>
            </View>
          ) : (
            <View className="items-center px-6 pt-12">
              <Ionicons
                name={
                  allExercises.length === 0
                    ? 'barbell-outline'
                    : 'search-outline'
                }
                size={32}
                color="#9AA0A6"
              />
              <Text className="mt-3 text-center text-lg font-bold text-text-primary">
                {allExercises.length === 0
                  ? 'Bibliothèque indisponible'
                  : 'Aucun résultat'}
              </Text>
              <Text className="mt-1 text-center text-sm text-text-secondary">
                {allExercises.length === 0
                  ? 'Réessaie plus tard — le catalogue n’a pas pu être chargé.'
                  : 'Modifie ta recherche ou retire le filtre.'}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}
