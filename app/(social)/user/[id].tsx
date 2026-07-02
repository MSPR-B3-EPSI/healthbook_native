import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Card, IconButton, StatPill } from '@/components';
import { listPostsByAuthor, type Post } from '@/features/publications/api';
import PostCard from '@/features/publications/components/PostCard';
import { usePostLikes } from '@/features/publications/usePostLikes';
import { getUser, type Profile } from '@/features/users/api';
import { HttpError } from '@/lib/http';

const PROFILE_PAGE_SIZE = 10;

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const likes = usePostLikes();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [p, mine] = await Promise.all([
          getUser(id),
          listPostsByAuthor(id, { page: 1, limit: PROFILE_PAGE_SIZE }),
        ]);
        if (!active) return;
        setProfile(p);
        setPosts(mine.posts);
        setTotal(mine.total);
      } catch (err) {
        if (active)
          setError(
            err instanceof HttpError
              ? `Erreur API (${err.status})`
              : 'Impossible de joindre le serveur',
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const loadMore = useCallback(async () => {
    if (loadingMore || posts.length >= total) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await listPostsByAuthor(id, {
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
  }, [loadingMore, posts.length, total, page, id]);

  const displayName = profile?.displayName || profile?.username || 'Utilisateur';
  const likesReceived = posts.reduce((sum, p) => sum + p.likesCount, 0);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-2">
        <IconButton
          name="arrow-back"
          onPress={() => router.back()}
          accessibilityLabel="Retour"
          color="#1A1A1A"
        />
        <Text className="ml-2 text-lg font-semibold text-text-primary">
          Profil
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-base text-danger">{error}</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
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
            {profile?.username ? (
              <Text className="text-base text-text-secondary">
                @{profile.username}
              </Text>
            ) : null}
          </View>

          <View className="mt-5 flex-row justify-center gap-3">
            <StatPill
              icon="document-text-outline"
              value={total}
              label="publications"
            />
            <StatPill icon="heart" value={likesReceived} label="j’aime" />
          </View>

          <Text className="mb-3 mt-7 text-xs font-semibold uppercase text-text-muted">
            Publications
          </Text>
          {posts.length === 0 ? (
            <Card>
              <Text className="text-sm text-text-muted">
                Aucune publication pour l’instant.
              </Text>
            </Card>
          ) : (
            <>
              {posts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={index}
                  liked={likes.isLiked(post)}
                  likeCount={likes.countFor(post)}
                  onToggleLike={() => likes.toggle(post)}
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
        </ScrollView>
      )}
    </View>
  );
}
