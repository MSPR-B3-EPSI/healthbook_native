import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Screen, ScreenHeader } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';

type Universe = {
  key: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: '/(social)' | '/(coach)';
  iconBg: string;
  badge?: string;
};

// Les deux univers du portail. Même compte Keycloak (SSO), deux APIs distinctes
// derrière le gateway : HealthBook → /api, HealthAI → /brain.
const UNIVERSES: Universe[] = [
  {
    key: 'social',
    title: 'HealthBook',
    description:
      'Le réseau social santé : publie, échange et like avec la communauté.',
    icon: 'people',
    route: '/(social)',
    iconBg: 'bg-coral',
  },
  {
    key: 'coach',
    title: 'HealthAI',
    description: 'Ton coach santé intelligent, propulsé par l’IA.',
    icon: 'sparkles',
    route: '/(coach)',
    iconBg: 'bg-coach',
  },
];

export default function HubScreen() {
  const { user, logout } = useAuth();

  return (
    <Screen scrollable bottomInset>
      <ScreenHeader
        title="Tes univers"
        subtitle={
          user?.username ? `Salut ${user.username} 👋` : 'Choisis où aller'
        }
      />

      <View className="gap-4">
        {UNIVERSES.map((u) => (
          <Pressable
            key={u.key}
            accessibilityRole="button"
            accessibilityLabel={u.title}
            onPress={() => router.navigate(u.route)}
            className="flex-row items-center rounded-2xl border border-border bg-surface p-4"
            style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
          >
            <View
              className={`h-14 w-14 items-center justify-center rounded-2xl ${u.iconBg}`}
            >
              <Ionicons name={u.icon} size={28} color="#FFFFFF" />
            </View>
            <View className="ml-4 flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg font-bold text-text-primary">
                  {u.title}
                </Text>
                {u.badge ? (
                  <View className="rounded-full bg-background px-2 py-0.5">
                    <Text className="text-xs font-semibold text-text-muted">
                      {u.badge}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text className="mt-1 text-sm text-text-secondary">
                {u.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9AA0A6" />
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          void logout();
        }}
        className="mt-8 self-center"
        hitSlop={8}
      >
        <Text className="text-base font-semibold text-text-muted">
          Se déconnecter
        </Text>
      </Pressable>
    </Screen>
  );
}
