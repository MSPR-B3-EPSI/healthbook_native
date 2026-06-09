import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Button, Card, Screen } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { apiFetch, HttpError } from '@/lib/http';

type WhoamiResponse = {
  dbuser: {
    keycloakId: string;
    email: string | null;
    username: string | null;
    createdAt: string;
    updatedAt: string;
  };
  jwtuser: {
    sub: string;
    preferred_username?: string;
    email?: string;
  };
};

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<WhoamiResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<WhoamiResponse>('/status/whoami');
        setProfile(data);
      } catch (err) {
        if (err instanceof HttpError) {
          setLoadError(`Erreur API (${err.status})`);
        } else {
          setLoadError('Impossible de joindre le serveur');
        }
      }
    })();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      Alert.alert('Erreur', 'Impossible de se déconnecter.');
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="mt-6 mb-6 items-center">
          <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-3">
            <Ionicons name="person" size={48} color="#007AFF" />
          </View>
          <Text className="text-2xl font-bold text-text-primary">
            {user?.username ?? 'Utilisateur'}
          </Text>
          {user?.email ? (
            <Text className="text-base text-text-secondary mt-1">
              {user.email}
            </Text>
          ) : null}
        </View>

        <SectionTitle>Profil</SectionTitle>
        <Card className="mb-4">
          <InfoRow label="Identifiant" value={user?.username ?? '—'} />
          <Divider />
          <InfoRow label="Email" value={user?.email ?? '—'} />
          <Divider />
          <InfoRow
            label="Rôles"
            value={user?.roles?.length ? user.roles.join(', ') : 'Aucun'}
          />
        </Card>

        <SectionTitle>Compte</SectionTitle>
        <Card className="mb-6">
          {loadError ? (
            <Text className="text-sm text-danger">{loadError}</Text>
          ) : profile ? (
            <>
              <InfoRow
                label="Créé le"
                value={formatDate(profile.dbuser.createdAt)}
              />
              <Divider />
              <InfoRow
                label="Dernière activité"
                value={formatDate(profile.dbuser.updatedAt)}
              />
              <Divider />
              <InfoRow
                label="ID Keycloak"
                value={profile.dbuser.keycloakId}
                mono
              />
            </>
          ) : (
            <Text className="text-sm text-text-muted">Chargement…</Text>
          )}
        </Card>

        <Button label="Se déconnecter" onPress={handleLogout} />
      </ScrollView>
    </Screen>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-xs font-semibold uppercase text-text-muted mb-2 ml-1">
      {children}
    </Text>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View className="py-2">
      <Text className="text-xs text-text-muted mb-1">{label}</Text>
      <Text
        className={`text-base text-text-primary ${mono ? 'font-mono text-xs' : ''}`}
        selectable
      >
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-border my-1" />;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
