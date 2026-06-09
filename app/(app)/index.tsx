import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Card, EmptyState, Screen, ScreenHeader } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { listPublishedPosts, type Post } from '@/features/publications/api';
import PublicationCard from '@/features/publications/components/PublicationCard';
import { HttpError } from '@/lib/http';

export default function FeedScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const data = await listPublishedPosts();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof HttpError) {
        setError(`Erreur API (${err.status})`);
      } else {
        setError('Impossible de joindre le serveur');
      }
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

  return (
    <Screen>
      <ScreenHeader
        title="Fil d’actualité"
        subtitle={user?.username ? `Salut ${user.username} 👋` : undefined}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
      >
        {loading && posts.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : error ? (
          <Card>
            <Text className="text-base text-danger">{error}</Text>
          </Card>
        ) : posts.length === 0 ? (
          <EmptyState
            emoji="📭"
            title="Aucune publication"
            description="Sois le premier à partager quelque chose ! Touche « Publier » en bas pour commencer."
          />
        ) : (
          posts.map((post) => (
            <PublicationCard
              key={post.id}
              post={post}
              isMine={post.authorId === user?.sub}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
