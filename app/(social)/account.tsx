import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Avatar, Button, Card, Screen, StatPill } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  deletePost,
  listPostsByAuthor,
  type Post,
} from '@/features/publications/api';
import PostCard from '@/features/publications/components/PostCard';
import { usePostLikes } from '@/features/publications/usePostLikes';
import { getMe, type Profile } from '@/features/users/api';
import { HttpError } from '@/lib/http';

const PROFILE_PAGE_SIZE = 10;

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const likes = usePostLikes();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [me, mine] = await Promise.all([
        getMe(),
        user?.sub
          ? listPostsByAuthor(user.sub, { page: 1, limit: PROFILE_PAGE_SIZE })
          : Promise.resolve({ posts: [], total: 0 }),
      ]);
      setProfile(me);
      setPosts(mine.posts);
      setTotal(mine.total);
      setPage(1);
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

  const loadMore = useCallback(async () => {
    if (loadingMore || posts.length >= total || !user?.sub) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await listPostsByAuthor(user.sub, {
        page: next,
        limit: PROFILE_PAGE_SIZE,
      });
      setTotal(res.total);
      setPage(next);
      setPosts((prev) => [...prev, ...res.posts]);
    } catch {
      // Silencieux.
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, posts.length, total, page, user?.sub]);

  const handleDelete = useCallback(
    (post: Post) => {
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      setTotal((t) => Math.max(0, t - 1));
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

  const displayName = profile?.displayName || user?.username || 'Utilisateur';
  const email = profile?.email ?? user?.email;
  const likesReceived = posts.reduce((sum, p) => sum + p.likesCount, 0);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="mt-2 items-center">
          <Avatar
            size={96}
            uri={profile?.profilePictureUrl ?? undefined}
            name={displayName}
          />
          <Text className="mt-3 text-2xl font-bold text-text-primary">
            {displayName}
          </Text>
          {user?.username ? (
            <Text className="text-base text-text-secondary">
              @{user.username}
            </Text>
          ) : null}
          {email ? (
            <Text className="mt-0.5 text-sm text-text-muted">{email}</Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => router.navigate('/profile/edit')}
            className="mt-4 flex-row items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5"
            style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
          >
            <Ionicons name="create-outline" size={18} color="#1A1A1A" />
            <Text className="text-sm font-semibold text-text-primary">
              Éditer le profil
            </Text>
          </Pressable>
        </View>

        <View className="mt-5 flex-row justify-center gap-3">
          <StatPill
            icon="document-text-outline"
            value={total}
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
          <>
            {posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                index={index}
                isMine
                liked={likes.isLiked(post)}
                likeCount={likes.countFor(post)}
                onToggleLike={() => likes.toggle(post)}
                onDelete={() => handleDelete(post)}
              />
            ))}
            {posts.length < total ? (
              <Pressable
                onPress={() => void loadMore()}
                disabled={loadingMore}
                className="items-center py-3"
              >
                {loadingMore ? (
                  <ActivityIndicator />
                ) : (
                  <Text className="text-sm font-medium text-primary">
                    Charger plus
                  </Text>
                )}
              </Pressable>
            ) : null}
          </>
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
            value={profile ? formatDate(profile.createdAt) : '—'}
          />
          <Divider />
          <InfoRow label="ID Keycloak" value={profile?.keycloakId ?? '—'} mono />
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
