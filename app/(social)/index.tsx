import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import {
  Button,
  EmptyState,
  Screen,
  ScreenHeader,
  SkeletonPostCard,
} from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { deletePost, listPosts, type Post } from '@/features/publications/api';
import PostCard from '@/features/publications/components/PostCard';
import { usePostLikes } from '@/features/publications/usePostLikes';
import { HttpError } from '@/lib/http';

export default function FeedScreen() {
  const { user } = useAuth();
  const likes = usePostLikes();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const data = await listPosts();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof HttpError) setError(`Erreur API (${err.status})`);
      else setError('Impossible de joindre le serveur');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  const renderEmpty = () => {
    if (loading) {
      return (
        <View>
          <SkeletonPostCard />
          <SkeletonPostCard />
          <SkeletonPostCard />
        </View>
      );
    }
    if (error) {
      // HealthBook indisponible : on garantit une sortie visible (réessayer OU
      // basculer d'univers) pour ne jamais rester bloqué sur un écran en erreur.
      return (
        <View className="flex-1 items-center justify-center px-2">
          <Text className="mb-4 text-6xl">📡</Text>
          <Text className="mb-2 text-center text-xl font-semibold text-text-primary">
            HealthBook est indisponible
          </Text>
          <Text className="mb-6 text-center text-base text-text-secondary">
            {error}. Réessaie, ou bascule sur un autre univers — ils restent
            accessibles.
          </Text>
          <View className="w-full max-w-xs">
            <Button
              label="Réessayer"
              onPress={() => load(true)}
              loading={refreshing}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.navigate('/(hub)')}
            className="mt-4 flex-row items-center gap-1"
            hitSlop={8}
          >
            <Ionicons name="apps-outline" size={18} color="#007AFF" />
            <Text className="text-base font-semibold text-primary">
              Changer d’univers
            </Text>
          </Pressable>
        </View>
      );
    }
    return (
      <EmptyState
        emoji="📭"
        title="Aucune publication"
        description="Sois le premier à partager quelque chose ! Touche « Publier » en bas pour commencer."
      />
    );
  };

  return (
    <Screen>
      <ScreenHeader
        title="Fil d’actualité"
        subtitle={user?.username ? `Salut ${user.username} 👋` : undefined}
      />

      <FlatList
        className="flex-1"
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item, index }) => (
          <PostCard
            post={item}
            index={index}
            isMine={item.authorId === user?.sub}
            liked={likes.isLiked(item.id)}
            likeCount={likes.countFor(item)}
            onToggleLike={() => likes.toggle(item)}
            onDelete={
              item.authorId === user?.sub ? () => handleDelete(item) : undefined
            }
          />
        )}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor="#FC5200"
            colors={['#FC5200']}
          />
        }
        ListEmptyComponent={renderEmpty}
      />
    </Screen>
  );
}
