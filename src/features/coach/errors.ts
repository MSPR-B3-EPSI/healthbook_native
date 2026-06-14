import { HttpError } from '@/lib/http';

/**
 * Traduit une erreur technique en message utilisateur.
 * Règles : jamais de jargon (backend, API, statut HTTP), toujours une action
 * possible pour l'utilisateur. Le détail technique reste dans les logs dev.
 */
export function userFacingError(err: unknown, fallback: string): string {
  if (err instanceof HttpError) {
    if (err.status === 401 || err.status === 403) {
      return 'Ta session a expiré. Reconnecte-toi pour continuer.';
    }
    if (err.status === 429) {
      return 'Trop de demandes en peu de temps. Patiente un instant avant de réessayer.';
    }
    if (err.status >= 500) {
      return 'Le service est momentanément indisponible. Réessaie dans quelques instants.';
    }
    return fallback;
  }
  // fetch lève une TypeError quand le serveur est injoignable (réseau, DNS…).
  return 'Connexion impossible. Vérifie ton accès internet et réessaie.';
}
