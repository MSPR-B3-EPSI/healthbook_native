import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  createComment,
  deleteComment,
  getPost,
  listComments,
  updateComment,
  type Comment,
  type Post,
} from '@/features/publications/api';
import CommentComposer from '@/features/publications/components/CommentComposer';
import CommentItem from '@/features/publications/components/CommentItem';
import PostCard from '@/features/publications/components/PostCard';
import SortChip from '@/features/publications/components/SortChip';
import { useCommentLikes } from '@/features/publications/useCommentLikes';
import { usePostLikes } from '@/features/publications/usePostLikes';
import { HttpError } from '@/lib/http';

const COMMENTS_PAGE_SIZE = 10;
type Sort = 'recent' | 'popular';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const likes = usePostLikes();
  const commentLikes = useCommentLikes();

  const [post, setPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentTotal, setCommentTotal] = useState(0);
  const [commentPage, setCommentPage] = useState(1);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState<Sort>('recent');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const sortBy = sort === 'popular' ? ('likes' as const) : ('createdAt' as const);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const p = await getPost(id);
        if (active) setPost(p);
      } catch (err) {
        if (active)
          setError(
            err instanceof HttpError
              ? `Erreur API (${err.status})`
              : 'Impossible de joindre le serveur',
          );
      } finally {
        if (active) setLoadingPost(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  // Anti-rebond de la recherche de commentaires.
  useEffect(() => {
    const t = setTimeout(() => setAppliedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const reloadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const res = await listComments(id, {
        page: 1,
        limit: COMMENTS_PAGE_SIZE,
        search: appliedSearch || undefined,
        sortBy,
        sortOrder: 'desc',
      });
      setComments(res.data);
      setCommentTotal(res.total);
      setCommentPage(1);
    } catch {
      // On garde la liste précédente en cas d'échec.
    } finally {
      setCommentsLoading(false);
    }
  }, [id, appliedSearch, sortBy]);

  useEffect(() => {
    void reloadComments();
  }, [reloadComments]);

  const loadMoreComments = useCallback(async () => {
    if (loadingMore || comments.length >= commentTotal) return;
    setLoadingMore(true);
    try {
      const next = commentPage + 1;
      const res = await listComments(id, {
        page: next,
        limit: COMMENTS_PAGE_SIZE,
        search: appliedSearch || undefined,
        sortBy,
        sortOrder: 'desc',
      });
      setCommentTotal(res.total);
      setCommentPage(next);
      setComments((prev) => [...prev, ...res.data]);
    } catch {
      // Silencieux.
    } finally {
      setLoadingMore(false);
    }
  }, [
    loadingMore,
    comments.length,
    commentTotal,
    commentPage,
    id,
    appliedSearch,
    sortBy,
  ]);

  const addComment = useCallback(
    (content: string) => {
      const tempId = `local-${Date.now()}`;
      const optimistic: Comment = {
        id: tempId,
        postId: id,
        authorId: user?.sub ?? 'me',
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likesCount: 0,
      };
      setComments((prev) => [optimistic, ...prev]);
      setCommentTotal((t) => t + 1);
      setPost((p) => (p ? { ...p, commentsCount: p.commentsCount + 1 } : p));
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      void (async () => {
        try {
          const saved = await createComment({ postId: id, content });
          setComments((prev) => prev.map((c) => (c.id === tempId ? saved : c)));
        } catch (err) {
          setComments((prev) => prev.filter((c) => c.id !== tempId));
          setCommentTotal((t) => Math.max(0, t - 1));
          setPost((p) =>
            p ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p,
          );
          const msg =
            err instanceof HttpError
              ? `Commentaire refusé (${err.status}).`
              : 'Vérifie ta connexion.';
          Alert.alert('Oups', msg);
        } finally {
          setSubmitting(false);
        }
      })();
    },
    [id, user?.sub],
  );

  const removeComment = useCallback(
    (comment: Comment) => {
      const snapshot = comments;
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
      setCommentTotal((t) => Math.max(0, t - 1));
      setPost((p) =>
        p ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p,
      );
      void (async () => {
        try {
          await deleteComment(comment.id);
        } catch (err) {
          setComments(snapshot);
          setCommentTotal((t) => t + 1);
          setPost((p) =>
            p ? { ...p, commentsCount: p.commentsCount + 1 } : p,
          );
          const msg =
            err instanceof HttpError
              ? `Suppression impossible (${err.status}).`
              : 'Vérifie ta connexion.';
          Alert.alert('Oups', msg);
        }
      })();
    },
    [comments],
  );

  const editComment = useCallback(
    (commentId: string, content: string) => {
      const snapshot = comments;
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content } : c)),
      );
      void (async () => {
        try {
          await updateComment(commentId, content);
        } catch (err) {
          setComments(snapshot);
          const msg =
            err instanceof HttpError
              ? `Modification impossible (${err.status}).`
              : 'Vérifie ta connexion.';
          Alert.alert('Oups', msg);
        }
      })();
    },
    [comments],
  );

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
          Publication
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loadingPost ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : error || !post ? (
          <View className="flex-1 items-center justify-center px-5">
            <Text className="text-base text-danger">
              {error ?? 'Publication introuvable'}
            </Text>
          </View>
        ) : (
          <>
            <ScrollView
              className="flex-1 px-5"
              contentContainerStyle={{ paddingBottom: 16 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="pt-3">
                <PostCard
                  post={post}
                  expanded
                  isMine={post.authorId === user?.sub}
                  liked={likes.isLiked(post.id)}
                  likeCount={likes.countFor(post)}
                  onToggleLike={() => likes.toggle(post)}
                  onComment={() => {}}
                />
              </View>

              <Text className="mb-2 mt-2 text-xs font-semibold uppercase text-text-muted">
                Commentaires
              </Text>

              <View className="mb-2 flex-row items-center rounded-xl bg-input px-3">
                <Ionicons name="search" size={16} color="#9AA0A6" />
                <TextInput
                  className="ml-2 flex-1 py-2 text-sm text-text-primary"
                  placeholder="Rechercher un commentaire…"
                  placeholderTextColor="#9AA0A6"
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {search ? (
                  <Pressable onPress={() => setSearch('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color="#9AA0A6" />
                  </Pressable>
                ) : null}
              </View>

              <View className="mb-2 flex-row gap-2">
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

              {commentsLoading && comments.length === 0 ? (
                <ActivityIndicator className="py-6" />
              ) : comments.length === 0 ? (
                <Text className="py-8 text-center text-sm text-text-muted">
                  {appliedSearch
                    ? 'Aucun commentaire ne correspond.'
                    : 'Aucun commentaire pour l’instant. Sois le premier !'}
                </Text>
              ) : (
                <>
                  {comments.map((c) => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      isMine={c.authorId === user?.sub}
                      liked={commentLikes.isLiked(c.id)}
                      likeCount={commentLikes.countFor(c)}
                      onToggleLike={() => commentLikes.toggle(c)}
                      onDelete={() => removeComment(c)}
                      onUpdate={(content) => editComment(c.id, content)}
                    />
                  ))}
                  {comments.length < commentTotal ? (
                    <Pressable
                      onPress={() => void loadMoreComments()}
                      disabled={loadingMore}
                      className="items-center py-3"
                    >
                      {loadingMore ? (
                        <ActivityIndicator />
                      ) : (
                        <Text className="text-sm font-medium text-primary">
                          Charger plus de commentaires
                        </Text>
                      )}
                    </Pressable>
                  ) : null}
                </>
              )}
            </ScrollView>

            <View style={{ paddingBottom: insets.bottom }}>
              <CommentComposer onSubmit={addComment} submitting={submitting} />
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
