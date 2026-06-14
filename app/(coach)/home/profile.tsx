import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/AuthProvider';
import { useCoach } from '@/features/coach/CoachProvider';
import { CoachButton, CoachHeader, SettingRow } from '@/features/coach/components';
import {
  equipmentSummary,
  LEVEL_LABELS,
  OBJECTIVE_LABELS,
} from '@/features/coach/displayNames';
import { cardShadow } from '@/lib/shadows';

/** Alerte commune des réglages non câblés (pas de backend dédié pour l'instant). */
function comingSoon() {
  Alert.alert('Bientôt disponible', 'Cette section arrive dans une prochaine version.');
}

/**
 * Onglet Profil — écran "Paramètres" : carte compte (Keycloak), infos
 * sportives (édition = relance de l'onboarding pré-rempli), réglages à venir
 * et zone danger (réinitialisation profil coach, déconnexion).
 */
export default function CoachProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { profile, generating, generateProgram, updateDraft, resetProfile } =
    useCoach();

  // Modifier = refaire le parcours d'onboarding avec les valeurs pré-remplies.
  const startEdit = () => {
    if (profile) updateDraft({ ...profile });
    router.push('/(coach)/onboarding');
  };

  const onReset = () => {
    Alert.alert(
      'Réinitialiser ton profil coach ?',
      'Ton profil et ton programme seront effacés, tu repasseras par l’onboarding.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            void resetProfile().then(() =>
              router.replace('/(coach)/onboarding'),
            );
          },
        },
      ],
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
        <Text className="mt-2 text-3xl font-extrabold text-text-primary">
          Paramètres
        </Text>
        <Text className="mb-5 mt-1 text-base text-text-secondary">
          Gère tes données de santé personnelles et la sécurité de ton compte.
        </Text>

        {/* Carte profil (compte Keycloak + prénom onboarding). */}
        <View className="items-center rounded-3xl bg-surface p-5" style={cardShadow}>
          <View className="h-20 w-20 items-center justify-center rounded-full border-4 border-coach-light bg-coach-soft">
            <Text className="text-3xl font-extrabold text-coach">
              {(profile?.firstName ?? user?.username ?? '?')
                .trim()
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>
          <Text className="mt-3 text-2xl font-extrabold text-text-primary">
            {profile?.firstName ?? user?.username ?? 'Utilisateur'}
          </Text>
          <Text className="mt-0.5 text-xs text-text-muted">
            Compte HealthAI
          </Text>

          <View className="mt-4 self-stretch">
            <CoachButton label="Modifier le profil" onPress={startEdit} />
          </View>

          <View className="mt-4 self-stretch">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Nom d&apos;affichage
            </Text>
            <Text className="mt-1 border-b border-border/60 pb-3 text-base font-semibold text-text-primary">
              {profile?.firstName ?? user?.username ?? '—'}
            </Text>
            <Text className="mt-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Adresse e-mail
            </Text>
            <Text className="mt-1 border-b border-border/60 pb-3 text-base font-semibold text-text-primary">
              {user?.email ?? '—'}
            </Text>
            <Text className="mt-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Identifiant Keycloak
            </Text>
            <Text className="mt-1 text-base font-semibold text-text-primary">
              {user?.username ?? '—'}
            </Text>
          </View>
        </View>

        {/* Infos sportives (issues de l'onboarding). */}
        <View className="mt-6 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-text-primary">
            Mes Informations Sportives
          </Text>
          <Pressable accessibilityRole="button" onPress={startEdit} hitSlop={8}>
            <Text className="text-sm font-bold text-coach">Modifier tout</Text>
          </Pressable>
        </View>

        {profile ? (
          <View className="mt-3 gap-3">
            <View className="rounded-2xl bg-surface px-4" style={cardShadow}>
              <SettingRow
                icon="trending-up-outline"
                iconBg="#D8F5E5"
                iconColor="#22B573"
                overline="Niveau sportif"
                title={LEVEL_LABELS[profile.level]}
                onPress={startEdit}
              />
            </View>
            <View className="rounded-2xl bg-surface px-4" style={cardShadow}>
              <SettingRow
                icon="disc-outline"
                iconBg="#EDE8FC"
                iconColor="#5B2EE5"
                overline="Objectif principal"
                title={OBJECTIVE_LABELS[profile.objective]}
                onPress={startEdit}
              />
            </View>
            <View className="rounded-2xl bg-surface px-4" style={cardShadow}>
              <SettingRow
                icon="file-tray-full-outline"
                iconBg="#FDE8E8"
                iconColor="#E53935"
                overline="Matériel disponible"
                title={equipmentSummary(profile.equipment)}
                onPress={startEdit}
              />
            </View>
          </View>
        ) : null}

        {/* Réglages compte (sections à venir). */}
        <View className="mt-6 rounded-3xl bg-surface px-4 py-1" style={cardShadow}>
          <SettingRow
            icon="lock-closed-outline"
            iconBg="#EDE8FC"
            iconColor="#5B2EE5"
            title="Privée et Visibilité"
            subtitle="Décide qui peut voir tes informations"
            onPress={comingSoon}
          />
          <View className="h-px bg-border/60" />
          <SettingRow
            icon="notifications-outline"
            iconBg="#EDE8FC"
            iconColor="#5B2EE5"
            title="Notification"
            subtitle="Rappels de séances et alertes"
            onPress={comingSoon}
          />
          <View className="h-px bg-border/60" />
          <SettingRow
            icon="shield-half-outline"
            iconBg="#EDE8FC"
            iconColor="#5B2EE5"
            title="Sécurité du compte"
            subtitle="2FA, changement de mot de passe"
            onPress={comingSoon}
          />
          <View className="h-px bg-border/60" />
          <SettingRow
            icon="settings-outline"
            iconBg="#F5F5F5"
            iconColor="#1A1A1A"
            title="Autres"
            subtitle="Autres informations relatives au compte"
            onPress={comingSoon}
          />
        </View>

        {/* Programme */}
        <View className="mt-6">
          <CoachButton
            label="Régénérer mon programme"
            onPress={() => void generateProgram()}
            loading={generating}
          />
        </View>

        {/* Zone danger. */}
        <View className="mt-6 rounded-3xl bg-danger/5 p-5">
          <View className="flex-row items-center gap-2">
            <Ionicons name="warning-outline" size={18} color="#E53935" />
            <Text className="text-base font-bold text-danger">Attention</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onReset}
            className="mt-4 flex-row items-center justify-between"
          >
            <Text className="text-base font-semibold text-text-primary">
              Réinitialiser mon profil coach
            </Text>
            <Ionicons name="refresh-outline" size={20} color="#E53935" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => void logout()}
            className="mt-4 flex-row items-center justify-between"
          >
            <Text className="text-base font-bold text-danger">
              Se déconnecter
            </Text>
            <Ionicons name="log-out-outline" size={20} color="#E53935" />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.navigate('/(hub)')}
          className="mt-6 self-center"
          hitSlop={8}
        >
          <Text className="text-base font-semibold text-text-muted">
            Changer d&apos;univers
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
