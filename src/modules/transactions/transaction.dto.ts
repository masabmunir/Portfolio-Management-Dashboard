import { z } from 'zod';
import { TransactionType } from '../../entities/Transaction';

/**
 * Schema for creating a new transaction on a holding.
 * executedAt is when the trade actually happened (may be backdated).
 */
export const createTransactionSchema = z.object({
  type: z.nativeEnum(TransactionType, {
    error: 'Type must be BUY or SELL',
  }),

  quantity: z
    .number()
    .positive('Quantity must be positive')
    .finite('Quantity must be a valid number'),

  price: z
    .number()
    .nonnegative('Price must be non-negative')
    .finite('Price must be a valid number'),

  fees: z
    .number()
    .nonnegative('Fees must be non-negative')
    .finite('Fees must be a valid number')
    .optional()
    .default(0),

  executedAt: z
    .string()
    .datetime({ message: 'executedAt must be ISO 8601 date string' })
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),

  notes: z
    .string()
    .max(1000, 'Notes too long')
    .optional()
    .nullable(),
});

/**
 * Query schema for the cross-portfolio history endpoint.
 * portfolioId is required to scope results.
 * Date range is optional for filtering.
 */
export const transactionHistoryQuerySchema = z.object({
  portfolioId: z.string().uuid('Invalid portfolio ID'),

  from: z.string().datetime().optional(),

  to: z.string().datetime().optional(),
});

export const transactionIdParamSchema = z.object({
  id: z.string().uuid('Invalid transaction ID'),
});

export const holdingIdParamSchema = z.object({
  holdingId: z.string().uuid('Invalid holding ID'),
});

export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;

export type TransactionHistoryQueryDto = z.infer<
  typeof transactionHistoryQuerySchema
>;