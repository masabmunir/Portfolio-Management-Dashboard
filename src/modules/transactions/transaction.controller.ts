import { Request, Response, NextFunction } from 'express';
import * as transactionService from './transaction.service';
import { CreateTransactionDto, TransactionHistoryQueryDto } from './transaction.dto';

export async function listForHolding(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const holdingId = req.params.holdingId as string;
    const transactions = await transactionService.findAllForHolding(holdingId, userId);
    res.json(transactions);
  } catch (err) {
    if (err instanceof transactionService.HoldingNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export async function history(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const query = req.query as unknown as TransactionHistoryQueryDto;
    const transactions = await transactionService.findHistoryForPortfolio(query, userId);
    res.json(transactions);
  } catch (err) {
    if (err instanceof transactionService.PortfolioNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const holdingId = req.params.holdingId as string;
    const dto = req.body as CreateTransactionDto;
    const tx = await transactionService.create(holdingId, userId, dto);
    res.status(201).json(tx);
  } catch (err) {
    if (err instanceof transactionService.HoldingNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    if (err instanceof transactionService.InsufficientQuantityError) {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    await transactionService.remove(id, userId);
    res.status(204).send();
  } catch (err) {
    if (err instanceof transactionService.TransactionNotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    next(err);
  }
}