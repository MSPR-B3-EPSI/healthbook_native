import { z } from 'zod';

// Validation de l'étape "Faisons connaissance !" (onboarding coach).
// Les bornes miroirent les @Min/@Max du WeeklyProgramRequestDto côté Nest,
// pour échouer tôt côté client plutôt qu'en 400 backend.
//
// Les champs numériques restent des `string` (valeurs de TextInput) et sont
// validés comme tels — la conversion Number() se fait à la soumission, ce qui
// évite les frictions de typage entre zod.coerce et react-hook-form.

function numericString(opts: {
  required: string;
  invalid: string;
  min: number;
  max: number;
  rangeMsg: string;
  int?: boolean;
}) {
  return z
    .string()
    .trim()
    .min(1, opts.required)
    .refine((v) => {
      const n = Number(v.replace(',', '.'));
      if (!Number.isFinite(n)) return false;
      if (opts.int && !Number.isInteger(n)) return false;
      return true;
    }, opts.invalid)
    .refine((v) => {
      const n = Number(v.replace(',', '.'));
      return n >= opts.min && n <= opts.max;
    }, opts.rangeMsg);
}

export const identitySchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'Ton prénom est requis.')
    .max(40, '40 caractères maximum.'),
  age: numericString({
    required: 'Ton âge est requis.',
    invalid: 'Un âge entier, sans virgule.',
    min: 18,
    max: 80,
    rangeMsg: 'Entre 18 et 80 ans.',
    int: true,
  }),
  weightKg: numericString({
    required: 'Ton poids est requis.',
    invalid: 'Un nombre, ex: 65 ou 65.5.',
    min: 30,
    max: 200,
    rangeMsg: 'Entre 30 et 200 kg.',
  }),
  heightCm: numericString({
    required: 'Ta taille est requise.',
    invalid: 'Un nombre entier de centimètres.',
    min: 120,
    max: 230,
    rangeMsg: 'Entre 120 et 230 cm.',
    int: true,
  }),
  gender: z.enum(['Male', 'Female'], { message: 'Sélectionne une option.' }),
});

export type IdentityValues = z.infer<typeof identitySchema>;

/** Convertit une saisie numérique validée ("65,5" → 65.5). */
export function parseNumericInput(value: string): number {
  return Number(value.trim().replace(',', '.'));
}
