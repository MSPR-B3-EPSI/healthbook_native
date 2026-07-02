import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { HttpError } from '@/lib/http';
import { toggleLike, type Post } from './api';

// L'état liké part de `post.likedByMe` (vérité serveur, persistante) ; les
// overrides ne couvrent que les bascules faites pendant la session.
export function usePostLikes() {
  const [likedOverrides, setLikedOverrides] = useState<
    Record<string, boolean>
  >({});
  const [countOverrides, setCountOverrides] = useState<Record<string, number>>(
    {},
  );

  const isLiked = useCallback(
    (post: Post) => likedOverrides[post.id] ?? post.likedByMe,
    [likedOverrides],
  );

  const countFor = useCallback(
    (post: Post) => countOverrides[post.id] ?? post.likesCount,
    [countOverrides],
  );

  const toggle = useCallback(
    (post: Post) => {
      const wasLiked = likedOverrides[post.id] ?? post.likedByMe;
      const baseCount = countOverrides[post.id] ?? post.likesCount;

      // Optimiste.
      setLikedOverrides((prev) => ({ ...prev, [post.id]: !wasLiked }));
      setCountOverrides((prev) => ({
        ...prev,
        [post.id]: Math.max(0, baseCount + (wasLiked ? -1 : 1)),
      }));

      void (async () => {
        try {
          const res = await toggleLike(post.id);
          setLikedOverrides((prev) => ({ ...prev, [post.id]: res.liked }));
          setCountOverrides((prev) => ({
            ...prev,
            [post.id]: res.likesCount,
          }));
        } catch (err) {
          // Rollback.
          setLikedOverrides((prev) => ({ ...prev, [post.id]: wasLiked }));
          setCountOverrides((prev) => ({ ...prev, [post.id]: baseCount }));
          const msg =
            err instanceof HttpError
              ? `Impossible d’aimer ce post (${err.status}).`
              : 'Vérifie ta connexion.';
          Alert.alert('Oups', msg);
        }
      })();
    },
    [likedOverrides, countOverrides],
  );

  return { isLiked, countFor, toggle };
}
