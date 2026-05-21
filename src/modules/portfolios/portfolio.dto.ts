import { z } from 'zod';

export const createPortfolioSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name too long'),
});

export const updatePortfolioSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name too long'),
});

// Validates UUID format in URL params like /portfolios/:id
export const portfolioIdParamSchema = z.object({
  id: z.string().uuid('Invalid portfolio ID'),
});

export type CreatePortfolioDto = z.infer<typeof createPortfolioSchema>;
export type UpdatePortfolioDto = z.infer<typeof updatePortfolioSchema>;