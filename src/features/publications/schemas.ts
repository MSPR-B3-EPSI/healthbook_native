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
});

export type CreatePostValues = z.infer<typeof createPostSchema>;
