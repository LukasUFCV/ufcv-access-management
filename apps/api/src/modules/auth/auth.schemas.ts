import { z } from 'zod';

export const loginSchema = z.object({
  login: z.string().min(2, 'Le login est requis.'),
  password: z.string().min(4, 'Le mot de passe est requis.'),
});

