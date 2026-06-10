import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/AuthProvider';
import { useCoach } from '@/features/coach/CoachProvider';
import {
  BmiGauge,
  CoachButton,
  CoachHeader,
  StatTile,
} from '@/features/coach/components';
import { bmi, bmiCategory, bodyFatEstimate } from '@/features/coach/metrics';
import { cardShadow, floatingShadow } from '@/lib/shadows';

/**
 * Onglet Stats : mesures dérivées du profil onboarding (IMC, masse grasse
 * estimée). L'historique (évolution du poids, séances réalisées) viendra
 * avec le futur tracking-api.
 */
export default function CoachStatsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile, updateDraft } = useCoach();

  const imc = profile ? bmi(profile) : null;
  const category = imc != null ? bmiCategory(imc) : null;
  const fatPct = profile ? bodyFatEstimate(profile) : null;

  const badgeClass =
    category?.tone === 'mint'
      ? 'bg-mint-light'
      : category?.tone === 'sun'
        ? 'bg-sun-light'
        : 'bg-danger/10';
  const badgeTextClass =
    category?.tone === 'mint'
      ? 'text-mint'
      : category?.tone === 'sun'
        ? 'text-sun'
        : 'text-danger';

  // "Mettre à jour mes mesures" : pré-remplit le brouillon d'onboarding avec
  // le profil actuel puis relance le parcours (4 étapes, valeurs déjà saisies).
  const onUpdateMeasures = () => {
    if (profile) updateDraft({ ...profile });
    router.push('/(coach)/onboarding');
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
      <CoachHeader name={profile?.firstName ?? user?.username} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
      >
        <Text className="mt-2 text-3xl font-extrabold text-text-primary">
          Ton Tableau de Bord Santé
        </Text>
        <Text className="mb-5 mt-1 text-base text-text-secondary">
          Visualise tes progrès et optimise ton bien-être au quotidien.
        </Text>

        {profile && imc != null && category != null ? (
          <View className="rounded-3xl bg-surface p-5" style={floatingShadow}>
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-text-primary">
                Aperçu Global
              </Text>
              <Text className="text-xs font-semibold text-text-muted">
                Selon ton profil
              </Text>
            </View>

            {/* IMC + jauge */}
            <View className="mt-4 rounded-2xl bg-background p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="body-outline" size={14} color="#5B2EE5" />
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    Indice de masse corporelle
                  </Text>
                </View>
                <View className={`rounded-full px-2.5 py-1 ${badgeClass}`}>
                  <Text className={`text-xs font-bold ${badgeTextClass}`}>
                    {category.label}
                  </Text>
                </View>
              </View>
              <View className="mt-2 flex-row items-baseline gap-1">
                <Text className="text-3xl font-extrabold text-text-primary">
                  {imc}
                </Text>
                <Text className="text-sm text-text-muted">kg/m²</Text>
              </View>
              <BmiGauge position={category.position} />
            </View>

            <View className="mt-3 flex-row gap-3">
              <StatTile
                icon="barbell-outline"
                label="Poids actuel"
                value={String(profile.weightKg)}
                unit="kg"
              />
              <StatTile
                icon="resize-outline"
                label="Taille"
                value={String(profile.heightCm)}
                unit="cm"
              />
            </View>

            <View className="mt-3">
              <StatTile
                icon="analytics-outline"
                label="Masse grasse estimée"
                value={String(fatPct)}
                unit="%"
                caption="Estimation (formule de Deurenberg)"
              />
            </View>

            <View className="mt-4">
              <CoachButton
                label="Mettre à jour mes mesures"
                onPress={onUpdateMeasures}
              />
            </View>
          </View>
        ) : null}

        {/* Carte coach (citation, cf. maquette). */}
        <View className="mt-5 rounded-3xl bg-coach p-6" style={cardShadow}>
          <Ionicons name="sparkles" size={18} color="#FFFFFF" />
          <Text className="mt-2 text-base italic leading-6 text-white">
            La régularité bat l&apos;intensité. Chaque séance complétée te
            rapproche de ton objectif.
          </Text>
          <Text className="mt-3 text-[11px] font-bold tracking-widest text-white/70">
            —  HEALTH IA COACH
          </Text>
        </View>

        <Text className="mt-4 text-center text-xs text-text-muted">
          L&apos;historique de tes séances et l&apos;évolution de ton poids
          arrivent avec le suivi d&apos;activité.
        </Text>
      </ScrollView>
    </View>
  );
}
