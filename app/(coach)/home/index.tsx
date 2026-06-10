import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/AuthProvider';
import { useCoach } from '@/features/coach/CoachProvider';
import {
  CoachButton,
  CoachHeader,
  ExerciseRow,
  NutritionTipCard,
  SegmentedToggle,
  SessionHeroCard,
  WeekStrip,
} from '@/features/coach/components';
import {
  DAY_LABELS,
  sessionLabel,
  todayKey,
  WEEK_ORDER,
} from '@/features/coach/labels';
import { cardShadow } from '@/lib/shadows';

// Conseils statiques en attendant POST /brain/recommendation/diet (qui demande
// un profil santé plus riche que l'onboarding actuel).
const NUTRITION_TIPS = [
  'Pense à consommer 30g de protéines dans les 60 min après ta séance pour optimiser ta récupération musculaire.',
  'Hydrate-toi tout au long de la journée : vise 2 à 2,5 L d’eau, davantage les jours de séance.',
  'Privilégie des glucides complexes (riz complet, patate douce) 2 à 3 h avant l’entraînement.',
  'Les jours de repos, garde un apport en protéines régulier : la récupération, c’est là que le muscle se construit.',
];

type ViewMode = 'day' | 'week';

export default function CoachHomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile, program, generating, programError, generateProgram } =
    useCoach();
  const [mode, setMode] = useState<ViewMode>('day');
  const [showAllExercises, setShowAllExercises] = useState(false);

  // Le programme vit en mémoire : on le (re)génère à l'arrivée si absent.
  useEffect(() => {
    if (profile && !program && !generating && !programError) {
      void generateProgram();
    }
  }, [profile, program, generating, programError, generateProgram]);

  const today = todayKey();
  const todayPlan = useMemo(
    () => program?.week.find((d) => d.day_of_week === today) ?? null,
    [program, today],
  );
  const todaySession = todayPlan?.sessions[0] ?? null;
  const workoutDays = useMemo(
    () =>
      program
        ? [...program.week]
            .filter((d) => !d.is_recovery && d.sessions.length > 0)
            .sort(
              (a, b) =>
                WEEK_ORDER.indexOf(a.day_of_week) -
                WEEK_ORDER.indexOf(b.day_of_week),
            )
        : [],
    [program],
  );

  const tip = NUTRITION_TIPS[new Date().getDay() % NUTRITION_TIPS.length];

  const onStartSession = () => {
    Alert.alert(
      'Bientôt disponible',
      'Le suivi de séance en direct arrive dans une prochaine version. 💪',
    );
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
      <CoachHeader name={profile?.firstName ?? user?.username} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
      >
        <SegmentedToggle
          options={[
            { key: 'day', label: 'Jour' },
            { key: 'week', label: 'Semaine' },
          ]}
          value={mode}
          onChange={setMode}
        />

        {/* États transverses : génération en cours / erreur backend. */}
        {generating ? (
          <View
            className="mt-6 items-center rounded-3xl bg-surface px-6 py-10"
            style={cardShadow}
          >
            <ActivityIndicator color="#5B2EE5" size="large" />
            <Text className="mt-4 text-center text-lg font-bold text-text-primary">
              Création de ton programme…
            </Text>
            <Text className="mt-2 text-center text-sm text-text-secondary">
              Ton coach analyse ton profil pour composer ta semaine idéale.
            </Text>
          </View>
        ) : programError ? (
          <View
            className="mt-6 items-center rounded-3xl bg-surface px-6 py-8"
            style={cardShadow}
          >
            <Ionicons name="cloud-offline-outline" size={36} color="#9AA0A6" />
            <Text className="mt-3 text-center text-lg font-bold text-text-primary">
              Oups, pas de programme
            </Text>
            <Text className="mb-5 mt-2 text-center text-sm text-text-secondary">
              {programError}
            </Text>
            <View className="self-stretch">
              <CoachButton label="Réessayer" onPress={() => void generateProgram()} />
            </View>
          </View>
        ) : mode === 'day' ? (
          <>
            <Text className="mt-6 text-3xl font-extrabold text-text-primary">
              Ton Planning d&apos;Aujourd&apos;hui
            </Text>
            <Text className="mb-5 mt-1 text-base text-text-secondary">
              Prêt à dépasser tes limites ? Voici ta session du jour.
            </Text>

            {todaySession && program ? (
              <>
                <SessionHeroCard
                  session={todaySession}
                  durationHours={program.duration_predicted_hours}
                  weightKg={profile?.weightKg ?? 70}
                  onStart={onStartSession}
                />

                <View className="mb-3 mt-6 flex-row items-center justify-between">
                  <Text className="text-xs font-bold uppercase tracking-widest text-text-muted">
                    Liste des exercices
                  </Text>
                  {todaySession.exos.length > 3 ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setShowAllExercises((v) => !v)}
                      hitSlop={8}
                    >
                      <Text className="text-sm font-bold text-coach">
                        {showAllExercises ? 'Réduire' : 'Voir tout'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                <View className="gap-3">
                  {(showAllExercises
                    ? todaySession.exos
                    : todaySession.exos.slice(0, 3)
                  ).map((exo) => (
                    <ExerciseRow key={exo.exercise_id} exercise={exo} />
                  ))}
                </View>

                <View className="mt-5">
                  <NutritionTipCard tip={tip} />
                </View>
              </>
            ) : (
              <>
                {/* Jour de repos : pas de séance aujourd'hui. */}
                <View
                  className="items-center rounded-3xl bg-surface px-6 py-10"
                  style={cardShadow}
                >
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-coach-light">
                    <Ionicons name="moon-outline" size={26} color="#5B2EE5" />
                  </View>
                  <Text className="mt-4 text-center text-xl font-bold text-text-primary">
                    Jour de récupération
                  </Text>
                  <Text className="mt-2 text-center text-sm text-text-secondary">
                    Pas de séance aujourd&apos;hui : ton corps se reconstruit.
                    Marche légère, étirements et bonne nuit de sommeil !
                  </Text>
                </View>
                <View className="mt-5">
                  <NutritionTipCard tip={NUTRITION_TIPS[3]} />
                </View>
              </>
            )}
          </>
        ) : (
          <>
            <Text className="mt-6 text-3xl font-extrabold text-text-primary">
              Ton Planning de la Semaine
            </Text>
            <Text className="mb-5 mt-1 text-base text-text-secondary">
              Voici ton planning pour la semaine !
            </Text>

            {program ? (
              <>
                <WeekStrip week={program.week} />

                <Text className="mb-3 mt-6 text-xs font-bold uppercase tracking-widest text-text-muted">
                  Planning hebdomadaire
                </Text>
                <View className="gap-3">
                  {workoutDays.map((day) => (
                    <View
                      key={day.day_of_week}
                      className="flex-row items-center rounded-2xl bg-surface p-4"
                      style={cardShadow}
                    >
                      <View className="h-12 w-12 items-center justify-center rounded-xl bg-coach-light">
                        <Ionicons
                          name="barbell-outline"
                          size={22}
                          color="#5B2EE5"
                        />
                      </View>
                      <View className="ml-4 flex-1">
                        <Text className="text-xs font-bold uppercase tracking-wider text-coach">
                          {DAY_LABELS[day.day_of_week].long}
                        </Text>
                        <Text className="mt-0.5 text-base font-bold text-text-primary">
                          {sessionLabel(day.sessions[0].session_kind)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
