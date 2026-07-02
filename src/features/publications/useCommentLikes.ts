import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { HttpError } from '@/lib/http';
import { toggleCommentLike, type Comment } from './api';

// Même principe que usePostLikes : l'état liké part de `comment.likedByMe`.
export function useCommentLikes() {
  const [likedOverrides, setLikedOverrides] = useState<
    Record<string, boolean>
  >({});
  const [countOverrides, setCountOverrides] = useState<Record<string, number>>(
    {},
  );

  const isLiked = useCallback(
    (comment: Comment) => likedOverrides[comment.id] ?? comment.likedByMe,
    [likedOverrides],
  );

  const countFor = useCallback(
    (comment: Comment) => countOverrides[comment.id] ?? comment.likesCount,
    [countOverrides],
  );

  const toggle = useCallback(
    (comment: Comment) => {
      const wasLiked = likedOverrides[comment.id] ?? comment.likedByMe;
      const baseCount = countOverrides[comment.id] ?? comment.likesCount;

      setLikedOverrides((prev) => ({ ...prev, [comment.id]: !wasLiked }));
      setCountOverrides((prev) => ({
        ...prev,
        [comment.id]: Math.max(0, baseCount + (wasLiked ? -1 : 1)),
      }));

      void (async () => {
        try {
          const res = await toggleCommentLike(comment.id);
          setLikedOverrides((prev) => ({ ...prev, [comment.id]: res.liked }));
          setCountOverrides((prev) => ({
            ...prev,
            [comment.id]: res.likesCount,
          }));
        } catch (err) {
          setLikedOverrides((prev) => ({ ...prev, [comment.id]: wasLiked }));
          setCountOverrides((prev) => ({ ...prev, [comment.id]: baseCount }));
          const msg =
            err instanceof HttpError
              ? `Impossible d’aimer ce commentaire (${err.status}).`
              : 'Vérifie ta connexion.';
          Alert.alert('Oups', msg);
        }
      })();
    },
    [likedOverrides, countOverrides],
  );

  return { isLiked, countFor, toggle };
}
