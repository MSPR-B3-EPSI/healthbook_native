import { z } from 'zod';

export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, 'Titre requis')
    .max(120, 'Titre trop long (120 caractères max)'),
  content: z.string().max(2000, 'Texte trop long (2000 caractères max)').optional(),
});

export type CreatePostValues = z.infer<typeof createPostSchema>;
