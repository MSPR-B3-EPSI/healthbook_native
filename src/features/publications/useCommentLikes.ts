import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { HttpError } from '@/lib/http';
import { toggleCommentLike, type Comment } from './api';

// Même principe que usePostLikes : l'API ne renvoie pas `likedByMe`, on suit
// l'état liké en local (par session) ; le compteur devient la vérité serveur.
export function useCommentLikes() {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [countOverrides, setCountOverrides] = useState<Record<string, number>>(
    {},
  );

  const isLiked = useCallback((id: string) => likedIds.has(id), [likedIds]);

  const countFor = useCallback(
    (comment: Comment) => countOverrides[comment.id] ?? comment.likesCount,
    [countOverrides],
  );

  const toggle = useCallback(
    (comment: Comment) => {
      const wasLiked = likedIds.has(comment.id);
      const baseCount = countOverrides[comment.id] ?? comment.likesCount;

      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(comment.id);
        else next.add(comment.id);
        return next;
      });
      setCountOverrides((prev) => ({
        ...prev,
        [comment.id]: Math.max(0, baseCount + (wasLiked ? -1 : 1)),
      }));

      void (async () => {
        try {
          const res = await toggleCommentLike(comment.id);
          setLikedIds((prev) => {
            const next = new Set(prev);
            if (res.liked) next.add(comment.id);
            else next.delete(comment.id);
            return next;
          });
          setCountOverrides((prev) => ({
            ...prev,
            [comment.id]: res.likesCount,
          }));
        } catch (err) {
          setLikedIds((prev) => {
            const next = new Set(prev);
            if (wasLiked) next.add(comment.id);
            else next.delete(comment.id);
            return next;
          });
          setCountOverrides((prev) => ({ ...prev, [comment.id]: baseCount }));
          const msg =
            err instanceof HttpError
              ? `Impossible d’aimer ce commentaire (${err.status}).`
              : 'Vérifie ta connexion.';
          Alert.alert('Oups', msg);
        }
      })();
    },
    [likedIds, countOverrides],
  );

  return { isLiked, countFor, toggle };
}
