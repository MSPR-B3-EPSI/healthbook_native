import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
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
  type Comment,
  type Post,
} from '@/features/publications/api';
import CommentComposer from '@/features/publications/components/CommentComposer';
import CommentItem from '@/features/publications/components/CommentItem';
import PostCard from '@/features/publications/components/PostCard';
import { useCommentLikes } from '@/features/publications/useCommentLikes';
import { usePostLikes } from '@/features/publications/usePostLikes';
import { HttpError } from '@/lib/http';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const likes = usePostLikes();
  const commentLikes = useCommentLikes();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [p, c] = await Promise.all([getPost(id), listComments(id)]);
        if (!active) return;
        setPost(p);
        setComments(c.data);
      } catch (err) {
        if (!active) return;
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
      setComments((prev) => [...prev, optimistic]);
      setPost((p) => (p ? { ...p, commentsCount: p.commentsCount + 1 } : p));
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      void (async () => {
        try {
          const saved = await createComment({ postId: id, content });
          setComments((prev) =>
            prev.map((c) => (c.id === tempId ? saved : c)),
          );
        } catch (err) {
          // Rollback.
          setComments((prev) => prev.filter((c) => c.id !== tempId));
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
      setPost((p) =>
        p ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p,
      );
      void (async () => {
        try {
          await deleteComment(comment.id);
        } catch (err) {
          setComments(snapshot);
          setPost((p) => (p ? { ...p, commentsCount: snapshot.length } : p));
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
        {loading ? (
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

              <Text className="mb-1 mt-2 text-xs font-semibold uppercase text-text-muted">
                Commentaires
              </Text>
              {comments.length === 0 ? (
                <Text className="py-8 text-center text-sm text-text-muted">
                  Aucun commentaire pour l’instant. Sois le premier !
                </Text>
              ) : (
                comments.map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    isMine={c.authorId === user?.sub}
                    liked={commentLikes.isLiked(c.id)}
                    likeCount={commentLikes.countFor(c)}
                    onToggleLike={() => commentLikes.toggle(c)}
                    onDelete={() => removeComment(c)}
                  />
                ))
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
