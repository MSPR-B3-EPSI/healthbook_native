import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { HttpError } from '@/lib/http';
import { toggleLike, type Post } from './api';

// L'API GET /post ne renvoie pas `likedByMe` → on suit l'état liké en local (par
// session). Les compteurs, eux, deviennent la vérité serveur après chaque toggle.
export function usePostLikes() {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [countOverrides, setCountOverrides] = useState<Record<string, number>>(
    {},
  );

  const isLiked = useCallback((id: string) => likedIds.has(id), [likedIds]);

  const countFor = useCallback(
    (post: Post) => countOverrides[post.id] ?? post.likesCount,
    [countOverrides],
  );

  const toggle = useCallback(
    (post: Post) => {
      const wasLiked = likedIds.has(post.id);
      const baseCount = countOverrides[post.id] ?? post.likesCount;

      // Optimiste.
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(post.id);
        else next.add(post.id);
        return next;
      });
      setCountOverrides((prev) => ({
        ...prev,
        [post.id]: Math.max(0, baseCount + (wasLiked ? -1 : 1)),
      }));

      void (async () => {
        try {
          const res = await toggleLike(post.id);
          // Source de vérité serveur.
          setLikedIds((prev) => {
            const next = new Set(prev);
            if (res.liked) next.add(post.id);
            else next.delete(post.id);
            return next;
          });
          setCountOverrides((prev) => ({ ...prev, [post.id]: res.likesCount }));
        } catch (err) {
          // Rollback.
          setLikedIds((prev) => {
            const next = new Set(prev);
            if (wasLiked) next.add(post.id);
            else next.delete(post.id);
            return next;
          });
          setCountOverrides((prev) => ({ ...prev, [post.id]: baseCount }));
          const msg =
            err instanceof HttpError
              ? `Impossible d’aimer ce post (${err.status}).`
              : 'Vérifie ta connexion.';
          Alert.alert('Oups', msg);
        }
      })();
    },
    [likedIds, countOverrides],
  );

  return { isLiked, countFor, toggle };
}
