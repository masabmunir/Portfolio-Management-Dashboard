import { Request, Response, NextFunction } from 'express';
import * as holdingService from './holding.service';
import { CreateHoldingDto, UpdateHoldingDto } from './holding.dto';

export async function listForPortfolio(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const portfolioId = req.params.portfolioId as string;
    const holdings = await holdingService.findAllInPortfolio(portfolioId, userId);
    res.json(holdings);
  } catch (err) {
    if (err instanceof holdingService.PortfolioNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const holding = await holdingService.findByIdForUser(id, userId);
    res.json(holding);
  } catch (err) {
    if (err instanceof holdingService.HoldingNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const portfolioId = req.params.portfolioId as string;
    const dto = req.body as CreateHoldingDto;
    const holding = await holdingService.create(portfolioId, userId, dto);
    res.status(201).json(holding);
  } catch (err) {
    if (err instanceof holdingService.PortfolioNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const dto = req.body as UpdateHoldingDto;
    const holding = await holdingService.update(id, userId, dto);
    res.json(holding);
  } catch (err) {
    if (err instanceof holdingService.HoldingNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    await holdingService.remove(id, userId);
    res.status(204).send();
  } catch (err) {
    if (err instanceof holdingService.HoldingNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    next(err);
  }
}