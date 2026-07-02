import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
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
import SortChip from '@/features/publications/components/SortChip';
import { usePostLikes } from '@/features/publications/usePostLikes';
import { HttpError } from '@/lib/http';

const PAGE_SIZE = 10;
type Sort = 'recent' | 'popular';

export default function FeedScreen() {
  const { user } = useAuth();
  const likes = usePostLikes();

  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [sort, setSort] = useState<Sort>('recent');

  // Anti-rebond : on n'interroge l'API que 300 ms après la dernière frappe.
  useEffect(() => {
    const t = setTimeout(() => setAppliedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const sortBy = sort === 'popular' ? ('likes' as const) : ('createdAt' as const);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await listPosts({
        page: 1,
        limit: PAGE_SIZE,
        search: appliedSearch || undefined,
        sortBy,
        sortOrder: 'desc',
      });
      setTotal(res.total);
      setPage(1);
      setPosts(res.data);
    } catch (err) {
      setError(
        err instanceof HttpError
          ? `Erreur API (${err.status})`
          : 'Impossible de joindre le serveur',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [appliedSearch, sortBy]);

  // Recharge à l'arrivée sur l'écran, et quand la recherche/le tri changent
  // (useFocusEffect relance l'effet si la callback change pendant qu'on est dessus).
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || posts.length >= total) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await listPosts({
        page: next,
        limit: PAGE_SIZE,
        search: appliedSearch || undefined,
        sortBy,
        sortOrder: 'desc',
      });
      setTotal(res.total);
      setPage(next);
      setPosts((prev) => [...prev, ...res.data]);
    } catch {
      // Silencieux : on ne casse pas le scroll pour une page en échec.
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, posts.length, total, page, appliedSearch, sortBy]);

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
          void reload();
        }
      })();
    },
    [reload],
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
              onPress={() => reload()}
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
        emoji={appliedSearch ? '🔎' : '📭'}
        title={appliedSearch ? 'Aucun résultat' : 'Aucune publication'}
        description={
          appliedSearch
            ? 'Essaie d’autres mots-clés.'
            : 'Sois le premier à partager quelque chose ! Touche « Publier » en bas pour commencer.'
        }
      />
    );
  };

  return (
    <Screen>
      <ScreenHeader
        title="Fil d’actualité"
        subtitle={user?.username ? `Salut ${user.username} 👋` : undefined}
      />

      <View className="mb-3 flex-row items-center rounded-xl bg-input px-3">
        <Ionicons name="search" size={18} color="#9AA0A6" />
        <TextInput
          className="ml-2 flex-1 py-2.5 text-base text-text-primary"
          placeholder="Rechercher une publication…"
          placeholderTextColor="#9AA0A6"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#9AA0A6" />
          </Pressable>
        ) : null}
      </View>

      <View className="mb-3 flex-row gap-2">
        <SortChip
          label="Récents"
          active={sort === 'recent'}
          onPress={() => setSort('recent')}
        />
        <SortChip
          label="Populaires"
          active={sort === 'popular'}
          onPress={() => setSort('popular')}
        />
      </View>

      <FlatList
        className="flex-1"
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item, index }) => (
          <PostCard
            post={item}
            index={index}
            isMine={item.authorId === user?.sub}
            liked={likes.isLiked(item)}
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
            onRefresh={() => {
              setRefreshing(true);
              void reload();
            }}
            tintColor="#FC5200"
            colors={['#FC5200']}
          />
        }
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator className="py-4" /> : null
        }
        ListEmptyComponent={renderEmpty}
      />
    </Screen>
  );
}
