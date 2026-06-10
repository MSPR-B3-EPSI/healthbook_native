import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { generateWeeklyProgram } from './api';
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
import type { Gender, WeeklyProgram } from './types';

// Contexte de l'univers coach, monté dans app/(coach)/_layout.tsx :
// - profil onboarding (persisté en SecureStore, source de vérité du gate)
// - brouillon d'onboarding partagé entre les 4 étapes
// - programme hebdo (en mémoire : pas de GET côté brain pour l'instant,
//   on régénère à la demande — le backend persiste de son côté).

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
  /** Appelle le brain (idempotent si déjà en cours). */
  generateProgram: () => Promise<void>;
};

const CoachContext = createContext<CoachContextValue | null>(null);

export function CoachProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [draft, setDraft] = useState<OnboardingDraft>({});
  const [program, setProgram] = useState<WeeklyProgram | null>(null);
  const [generating, setGenerating] = useState(false);
  const [programError, setProgramError] = useState<string | null>(null);
  const generatingRef = useRef(false);

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
    // Le profil a changé : l'ancien programme ne correspond plus.
    setProgram(null);
    setProgramError(null);
  }, []);

  const resetProfile = useCallback(async () => {
    await clearCoachProfile();
    setProfile(null);
    setProgram(null);
    setProgramError(null);
  }, []);

  const generateProgram = useCallback(async () => {
    if (!profile || generatingRef.current) return;
    generatingRef.current = true;
    setGenerating(true);
    setProgramError(null);
    try {
      const result = await generateWeeklyProgram(toWeeklyProgramRequest(profile));
      setProgram(result);
    } catch (err) {
      if (__DEV__) console.log('[Coach] Échec génération programme :', err);
      setProgramError(
        'Impossible de générer ton programme. Vérifie que le backend tourne, puis réessaie.',
      );
    } finally {
      generatingRef.current = false;
      setGenerating(false);
    }
  }, [profile]);

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
      generateProgram,
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
      generateProgram,
    ],
  );

  return <CoachContext.Provider value={value}>{children}</CoachContext.Provider>;
}

export function useCoach(): CoachContextValue {
  const ctx = useContext(CoachContext);
  if (!ctx) throw new Error('useCoach doit être utilisé sous <CoachProvider>.');
  return ctx;
}
