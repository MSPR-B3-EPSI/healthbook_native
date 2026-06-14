import { z } from 'zod';

export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, 'Titre requis')
    .max(120, 'Titre trop long (120 caractères max)'),
  content: z
    .string()
    .min(1, 'Contenu requis')
    .max(2000, 'Texte trop long (2000 caractères max)'),
  // Optionnel. Vide autorisé (le backend valide @IsUrl → on omet la clé si vide).
  mediaUrl: z
    .string()
    .trim()
    .url('URL d’image invalide')
    .or(z.literal(''))
    .optional(),
});

export type CreatePostValues = z.infer<typeof createPostSchema>;
