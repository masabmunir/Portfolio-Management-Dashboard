import { Request, Response, NextFunction } from 'express';
import * as portfolioService from './portfolio.service';
import { CreatePortfolioDto, UpdatePortfolioDto } from './portfolio.dto';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const portfolios = await portfolioService.findAllByUser(userId);
    res.json(portfolios);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const portfolio = await portfolioService.findByIdForUser(id, userId);
    res.json(portfolio);
  } catch (err) {
    if (err instanceof portfolioService.PortfolioNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const dto = req.body as CreatePortfolioDto;
    const portfolio = await portfolioService.create(userId, dto);
    res.status(201).json(portfolio);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const dto = req.body as UpdatePortfolioDto;
    const portfolio = await portfolioService.update(id, userId, dto);
    res.json(portfolio);
  } catch (err) {
    if (err instanceof portfolioService.PortfolioNotFoundError) {
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
    await portfolioService.remove(id, userId);
    res.status(204).send();
  } catch (err) {
    if (err instanceof portfolioService.PortfolioNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export async function getSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const summary = await portfolioService.getSummary(id, userId);
    res.json(summary);
  } catch (err) {
    if (err instanceof portfolioService.PortfolioNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    next(err);
  }
}