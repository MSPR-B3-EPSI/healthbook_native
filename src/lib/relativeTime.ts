// Temps relatif en français, fait main (pas de dépendance date ; Intl.RelativeTimeFormat
// est partiellement supporté par Hermes). Ex : "à l'instant", "il y a 2 h", "hier".

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const diffSec = Math.floor((Date.now() - then) / 1000);

  if (diffSec < 45) return 'à l’instant';
  if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `il y a ${Math.floor(diffSec / 3600)} h`;
  if (diffSec < 172800) return 'hier';
  if (diffSec < 604800) return `il y a ${Math.floor(diffSec / 86400)} j`;

  // Plus ancien → date courte FR.
  return new Date(then).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });
}
