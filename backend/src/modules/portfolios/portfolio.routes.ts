import { Router } from 'express';
import * as portfolioController from './portfolio.controller';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import {
  createPortfolioSchema,
  updatePortfolioSchema,
  portfolioIdParamSchema,
} from './portfolio.dto';
import { holdingsUnderPortfolioRouter } from '../holdings/holding.routes';

const router = Router();

router.use(requireAuth);

router.get('/', portfolioController.list);

router.post(
  '/',
  validate(createPortfolioSchema),
  portfolioController.create,
);

router.get(
  '/:id/summary',
  validate(portfolioIdParamSchema, 'params'),
  portfolioController.getSummary,
);

router.get(
  '/:id',
  validate(portfolioIdParamSchema, 'params'),
  portfolioController.getOne,
);

router.patch(
  '/:id',
  validate(portfolioIdParamSchema, 'params'),
  validate(updatePortfolioSchema),
  portfolioController.update,
);

router.delete(
  '/:id',
  validate(portfolioIdParamSchema, 'params'),
  portfolioController.remove,
);

router.use('/:portfolioId/holdings', holdingsUnderPortfolioRouter);

export default router;