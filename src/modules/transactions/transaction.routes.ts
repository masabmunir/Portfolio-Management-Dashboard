import { Router } from 'express';
import * as transactionController from './transaction.controller';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import {
  createTransactionSchema,
  transactionHistoryQuerySchema,
  transactionIdParamSchema,
  holdingIdParamSchema,
} from './transaction.dto';

/**
 * Routes nested under /api/holdings/:holdingId/transactions
 */
export const transactionsUnderHoldingRouter = Router({ mergeParams: true });

transactionsUnderHoldingRouter.use(requireAuth);

transactionsUnderHoldingRouter.get(
  '/',
  validate(holdingIdParamSchema, 'params'),
  transactionController.listForHolding,
);

transactionsUnderHoldingRouter.post(
  '/',
  validate(holdingIdParamSchema, 'params'),
  validate(createTransactionSchema),
  transactionController.create,
);

/**
 * Top-level /api/transactions router (for history + delete)
 */
export const transactionsRouter = Router();

transactionsRouter.use(requireAuth);

transactionsRouter.get(
  '/',
  validate(transactionHistoryQuerySchema, 'query'),
  transactionController.history,
);

transactionsRouter.delete(
  '/:id',
  validate(transactionIdParamSchema, 'params'),
  transactionController.remove,
);