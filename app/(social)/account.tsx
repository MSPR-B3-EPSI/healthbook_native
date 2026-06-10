import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Avatar, Button, Card, Screen, StatPill } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  deletePost,
  listPostsByAuthor,
  type Post,
} from '@/features/publications/api';
import PostCard from '@/features/publications/components/PostCard';
import { usePostLikes } from '@/features/publications/usePostLikes';
import { apiFetch, HttpError } from '@/lib/http';

type WhoamiResponse = {
  dbuser: {
    keycloakId: string;
    email: string | null;
    username: string | null;
    displayName: string | null;
    profilePictureUrl: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const likes = usePostLikes();
  const [profile, setProfile] = useState<WhoamiResponse | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [who, mine] = await Promise.all([
        apiFetch<WhoamiResponse>('/status/whoami'),
        user?.sub
          ? listPostsByAuthor(user.sub)
          : Promise.resolve({ posts: [], total: 0 }),
      ]);
      setProfile(who);
      setPosts(mine.posts);
    } catch (err) {
      if (err instanceof HttpError) setLoadError(`Erreur API (${err.status})`);
      else setLoadError('Impossible de joindre le serveur');
    }
  }, [user?.sub]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleDelete = useCallback(
    (post: Post) => {
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      void (async () => {
        try {
          await deletePost(post.id);
        } catch (err) {
          const msg =
            err instanceof HttpError
              ? `Suppression impossible (${err.status}).`
              : 'Vérifie ta connexion.';
          Alert.alert('Oups', msg);
          void load();
        }
      })();
    },
    [load],
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      Alert.alert('Erreur', 'Impossible de se déconnecter.');
    }
  };

  const db = profile?.dbuser;
  const displayName = db?.displayName || user?.username || 'Utilisateur';
  const likesReceived = posts.reduce((sum, p) => sum + p.likesCount, 0);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="mt-2 items-center">
          <Avatar size={96} uri={db?.profilePictureUrl} name={displayName} />
          <Text className="mt-3 text-2xl font-bold text-text-primary">
            {displayName}
          </Text>
          {user?.username ? (
            <Text className="text-base text-text-secondary">
              @{user.username}
            </Text>
          ) : null}
          {user?.email ? (
            <Text className="mt-0.5 text-sm text-text-muted">{user.email}</Text>
          ) : null}
        </View>

        <View className="mt-5 flex-row justify-center gap-3">
          <StatPill
            icon="document-text-outline"
            value={posts.length}
            label="publications"
          />
          <StatPill icon="heart" value={likesReceived} label="j’aime" />
        </View>

        {loadError ? (
          <Card className="mt-5">
            <Text className="text-sm text-danger">{loadError}</Text>
          </Card>
        ) : null}

        <Text className="mb-3 mt-7 text-xs font-semibold uppercase text-text-muted">
          Mes publications
        </Text>
        {posts.length === 0 ? (
          <Card>
            <Text className="text-sm text-text-muted">
              Tu n’as encore rien publié.
            </Text>
          </Card>
        ) : (
          posts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              index={index}
              isMine
              liked={likes.isLiked(post.id)}
              likeCount={likes.countFor(post)}
              onToggleLike={() => likes.toggle(post)}
              onDelete={() => handleDelete(post)}
            />
          ))
        )}

        <Text className="mb-3 mt-5 text-xs font-semibold uppercase text-text-muted">
          Compte
        </Text>
        <Card className="mb-6">
          <InfoRow
            label="Rôles"
            value={user?.roles?.length ? user.roles.join(', ') : 'Aucun'}
          />
          <Divider />
          <InfoRow
            label="Membre depuis"
            value={db ? formatDate(db.createdAt) : '—'}
          />
          <Divider />
          <InfoRow label="ID Keycloak" value={db?.keycloakId ?? '—'} mono />
        </Card>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.navigate('/(hub)')}
          className="mt-4 flex-row items-center justify-center gap-2 rounded-xl border border-primary px-4 py-3"
          style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
        >
          <Ionicons name="apps-outline" size={18} color="#007AFF" />
          <Text className="text-base font-semibold text-primary">
            Changer d’univers
          </Text>
        </Pressable>

        <Button label="Se déconnecter" onPress={handleLogout} />
      </ScrollView>
    </Screen>
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
      <Text className="mb-1 text-xs text-text-muted">{label}</Text>
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
  return <View className="my-1 h-px bg-border" />;
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
