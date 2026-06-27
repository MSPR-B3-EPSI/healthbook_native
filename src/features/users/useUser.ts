import { useEffect, useState } from 'react';
import { getUser, type Profile } from './api';

// Cache mémoire partagé : un même auteur n'est récupéré qu'une fois par session,
// même s'il apparaît dans plusieurs posts/commentaires (évite les appels N+1).
const cache = new Map<string, Profile>();
const inflight = new Map<string, Promise<Profile>>();

export function useUser(id: string | undefined): Profile | null {
  const [profile, setProfile] = useState<Profile | null>(
    id ? (cache.get(id) ?? null) : null,
  );

  useEffect(() => {
    if (!id) return;
    const cached = cache.get(id);
    if (cached) {
      setProfile(cached);
      return;
    }

    let active = true;
    let req = inflight.get(id);
    if (!req) {
      req = getUser(id)
        .then((u) => {
          cache.set(id, u);
          return u;
        })
        .finally(() => {
          inflight.delete(id);
        });
      inflight.set(id, req);
    }

    void (async () => {
      try {
        const u = await req;
        if (active) setProfile(u);
      } catch {
        // Auteur introuvable / hors-ligne : on garde le libellé de repli.
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  return profile;
}

export function profileLabel(
  profile: Profile | null,
  fallback: string,
): string {
  return profile?.displayName || profile?.username || fallback;
}
