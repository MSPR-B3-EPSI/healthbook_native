import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Identifiant requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().email('Email invalide'),
    username: z.string().min(1, "Nom d'utilisateur requis"),
    password: z.string().min(8, 'Mot de passe trop court'),
    confirmPassword: z.string().min(1, 'Confirmation requise'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Les mots de passe ne correspondent pas',
  });

export type RegisterValues = z.infer<typeof registerSchema>;
