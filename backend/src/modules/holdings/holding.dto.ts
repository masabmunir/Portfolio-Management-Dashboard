import { z } from 'zod';
import { AssetType } from '../../entities/Holding';

/**
 * Schema for creating a new holding under a portfolio.
 */
export const createHoldingSchema = z.object({
  symbol: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, 'Symbol is required')
    .max(20, 'Symbol too long'),
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(200, 'Name too long'),
  assetType: z.nativeEnum(AssetType, {
  message: 'Asset type must be STOCK, BOND, MUTUAL_FUND, or ETF',
 }),
  currentPrice: z
    .number()
    .nonnegative('Current price must be non-negative')
    .finite('Current price must be a valid number'),
});

/**
 * Schema for updating a holding. Both fields optional — partial update.
 */
export const updateHoldingSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    currentPrice: z.number().nonnegative().finite().optional(),
  })
  .refine((data) => data.name !== undefined || data.currentPrice !== undefined, {
    message: 'At least one field must be provided',
  });

export const holdingIdParamSchema = z.object({
  id: z.string().uuid('Invalid holding ID'),
});

export const portfolioIdParamSchema = z.object({
  portfolioId: z.string().uuid('Invalid portfolio ID'),
});

export type CreateHoldingDto = z.infer<typeof createHoldingSchema>;
export type UpdateHoldingDto = z.infer<typeof updateHoldingSchema>;