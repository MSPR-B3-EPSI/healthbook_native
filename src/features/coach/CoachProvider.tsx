import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { HttpError } from '@/lib/http';
import { generateWeeklyProgram, getExercises, getLatestProgram } from './api';
import { userFacingError } from './errors';
import {
  clearCoachProfile,
  loadCoachProfile,
  saveCoachProfile,
  toWeeklyProgramRequest,
  type CoachProfile,
  type EquipmentKey,
  type ExperienceLevel,
  type UiObjective,
} from './profile';
import type { CatalogExercise, Gender, WeeklyProgram } from './types';

// Contexte de l'univers coach, monté dans app/(coach)/_layout.tsx :
// - profil onboarding (persisté en SecureStore, source de vérité du gate)
// - brouillon d'onboarding partagé entre les 4 étapes
// - programme hebdo : restauré depuis le brain (GET latest) au premier
//   besoin, généré sinon ; régénéré uniquement après modification du profil
//   ou demande explicite.

export type OnboardingDraft = {
  firstName?: string;
  age?: number;
  weightKg?: number;
  heightCm?: number;
  gender?: Gender;
  objective?: UiObjective;
  equipment?: EquipmentKey[];
  level?: ExperienceLevel;
};

type CoachContextValue = {
  /** loading = lecture SecureStore en cours (gate d'entrée de l'univers). */
  status: 'loading' | 'ready';
  profile: CoachProfile | null;
  draft: OnboardingDraft;
  updateDraft: (patch: Partial<OnboardingDraft>) => void;
  /** Finalise l'onboarding : persiste le profil et invalide l'ancien programme. */
  completeOnboarding: (profile: CoachProfile) => Promise<void>;
  resetProfile: () => Promise<void>;
  program: WeeklyProgram | null;
  generating: boolean;
  programError: string | null;
  /** Restaure le dernier programme persisté, ou en génère un si aucun. */
  ensureProgram: () => Promise<void>;
  /** Force une nouvelle génération (écrase le programme courant). */
  generateProgram: () => Promise<void>;
  /** Catalogue d'exercices (bibliothèque), chargé une fois à la demande. */
  catalog: CatalogExercise[] | null;
  ensureCatalog: () => Promise<void>;
};

const CoachContext = createContext<CoachContextValue | null>(null);

export function CoachProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [draft, setDraft] = useState<OnboardingDraft>({});
  const [program, setProgram] = useState<WeeklyProgram | null>(null);
  const [generating, setGenerating] = useState(false);
  const [programError, setProgramError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogExercise[] | null>(null);
  const busyRef = useRef(false);
  const catalogBusyRef = useRef(false);
  // true = le profil vient de changer : le programme persisté côté brain ne
  // correspond plus, il faut régénérer au lieu de restaurer.
  const staleRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void loadCoachProfile().then((p) => {
      if (cancelled) return;
      setProfile(p);
      setStatus('ready');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const completeOnboarding = useCallback(async (next: CoachProfile) => {
    await saveCoachProfile(next);
    setProfile(next);
    setDraft({});
    setProgram(null);
    setProgramError(null);
    staleRef.current = true;
  }, []);

  const resetProfile = useCallback(async () => {
    await clearCoachProfile();
    setProfile(null);
    setProgram(null);
    setProgramError(null);
    staleRef.current = false;
  }, []);

  /** Génération via le brain (POST). Partagé par ensureProgram/generateProgram. */
  const runGeneration = useCallback(async (p: CoachProfile) => {
    const result = await generateWeeklyProgram(toWeeklyProgramRequest(p));
    staleRef.current = false;
    setProgram(result);
  }, []);

  const ensureProgram = useCallback(async () => {
    if (!profile || busyRef.current) return;
    busyRef.current = true;
    setGenerating(true);
    setProgramError(null);
    try {
      if (!staleRef.current) {
        try {
          const latest = await getLatestProgram();
          setProgram(latest);
          return;
        } catch (err) {
          // 404 = aucun programme encore persisté → on en génère un.
          if (!(err instanceof HttpError && err.status === 404)) throw err;
        }
      }
      await runGeneration(profile);
    } catch (err) {
      if (__DEV__) console.log('[Coach] Échec chargement programme :', err);
      setProgramError(
        userFacingError(err, 'Le chargement du programme a échoué. Réessaie.'),
      );
    } finally {
      busyRef.current = false;
      setGenerating(false);
    }
  }, [profile, runGeneration]);

  const generateProgram = useCallback(async () => {
    if (!profile || busyRef.current) return;
    busyRef.current = true;
    setGenerating(true);
    setProgramError(null);
    try {
      await runGeneration(profile);
    } catch (err) {
      if (__DEV__) console.log('[Coach] Échec génération programme :', err);
      setProgramError(
        userFacingError(err, 'La génération du programme a échoué. Réessaie.'),
      );
    } finally {
      busyRef.current = false;
      setGenerating(false);
    }
  }, [profile, runGeneration]);

  // Catalogue d'exercices (bibliothèque) : chargé une fois, indépendant du
  // programme. Échec silencieux (l'écran affiche un état vide / réessaie).
  const ensureCatalog = useCallback(async () => {
    if (catalog || catalogBusyRef.current) return;
    catalogBusyRef.current = true;
    try {
      setCatalog(await getExercises());
    } catch (err) {
      if (__DEV__) console.log('[Coach] Échec chargement catalogue :', err);
    } finally {
      catalogBusyRef.current = false;
    }
  }, [catalog]);

  const value = useMemo<CoachContextValue>(
    () => ({
      status,
      profile,
      draft,
      updateDraft,
      completeOnboarding,
      resetProfile,
      program,
      generating,
      programError,
      ensureProgram,
      generateProgram,
      catalog,
      ensureCatalog,
    }),
    [
      status,
      profile,
      draft,
      updateDraft,
      completeOnboarding,
      resetProfile,
      program,
      generating,
      programError,
      ensureProgram,
      generateProgram,
      catalog,
      ensureCatalog,
    ],
  );

  return <CoachContext.Provider value={value}>{children}</CoachContext.Provider>;
}

export function useCoach(): CoachContextValue {
  const ctx = useContext(CoachContext);
  if (!ctx) throw new Error('useCoach doit être utilisé sous <CoachProvider>.');
  return ctx;
}
