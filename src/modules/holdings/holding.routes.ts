import { Router } from 'express';
import * as holdingController from './holding.controller';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import {
  createHoldingSchema,
  updateHoldingSchema,
  holdingIdParamSchema,
  portfolioIdParamSchema,
} from './holding.dto';

/**
 * Routes nested under /api/portfolios/:portfolioId/holdings
 * mergeParams: true → so req.params.portfolioId is accessible
 */
export const holdingsUnderPortfolioRouter = Router({ mergeParams: true });

holdingsUnderPortfolioRouter.use(requireAuth);

holdingsUnderPortfolioRouter.get(
  '/',
  validate(portfolioIdParamSchema, 'params'),
  holdingController.listForPortfolio,
);

holdingsUnderPortfolioRouter.post(
  '/',
  validate(portfolioIdParamSchema, 'params'),
  validate(createHoldingSchema),
  holdingController.create,
);

/**
 * Top-level /api/holdings/:id router
 */
export const holdingsRouter = Router();

holdingsRouter.use(requireAuth);

holdingsRouter.get(
  '/:id',
  validate(holdingIdParamSchema, 'params'),
  holdingController.getOne,
);

holdingsRouter.patch(
  '/:id',
  validate(holdingIdParamSchema, 'params'),
  validate(updateHoldingSchema),
  holdingController.update,
);

holdingsRouter.delete(
  '/:id',
  validate(holdingIdParamSchema, 'params'),
  holdingController.remove,
);