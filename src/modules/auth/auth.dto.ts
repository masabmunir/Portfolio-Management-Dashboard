import { z } from 'zod';

/**
 * Schema for POST /api/auth/register and POST /api/auth/login.
 */
export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .max(255, 'Email too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
});

/**
 * Schema for POST /api/auth/refresh and POST /api/auth/logout.
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required'),
});

// TypeScript types inferred from schemas — DRY principle.
export type CredentialsDto = z.infer<typeof credentialsSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;