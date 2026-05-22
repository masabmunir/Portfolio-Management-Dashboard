import { AppDataSource } from '../../config/data-source';
import { Transaction, TransactionType } from '../../entities/Transaction';
import { Holding } from '../../entities/Holding';
import { Portfolio } from '../../entities/Portfolio';
import { CreateTransactionDto, TransactionHistoryQueryDto } from './transaction.dto';

export class TransactionNotFoundError extends Error {
  constructor() {
    super('Transaction not found');
  }
}

export class HoldingNotFoundError extends Error {
  constructor() {
    super('Holding not found');
  }
}

export class PortfolioNotFoundError extends Error {
  constructor() {
    super('Portfolio not found');
  }
}

export class InsufficientQuantityError extends Error {
  constructor(available: number, requested: number) {
    super(`Cannot sell ${requested}: only ${available} available`);
  }
}

const txRepo = () => AppDataSource.getRepository(Transaction);
const holdingRepo = () => AppDataSource.getRepository(Holding);
const portfolioRepo = () => AppDataSource.getRepository(Portfolio);

/**
 * Internal: load holding only if user owns its parent portfolio.
 */
async function findHoldingForUser(holdingId: string, userId: string): Promise<Holding> {
  const holding = await holdingRepo()
    .createQueryBuilder('h')
    .innerJoin('h.portfolio', 'p')
    .where('h.id = :holdingId', { holdingId })
    .andWhere('p.user_id = :userId', { userId })
    .getOne();

  if (!holding) throw new HoldingNotFoundError();
  return holding;
}

/**
 * List all transactions for a holding (chronological).
 */
export async function findAllForHolding(
  holdingId: string,
  userId: string,
): Promise<Transaction[]> {
  await findHoldingForUser(holdingId, userId);
  return txRepo().find({
    where: { holdingId },
    order: { executedAt: 'DESC' },
  });
}

/**
 * Cross-holding history within a portfolio. Optional date filtering.
 */
export async function findHistoryForPortfolio(
  query: TransactionHistoryQueryDto,
  userId: string,
): Promise<Transaction[]> {
  // Verify portfolio ownership
  const portfolio = await portfolioRepo().findOne({
    where: { id: query.portfolioId, userId },
  });
  if (!portfolio) throw new PortfolioNotFoundError();

  const qb = txRepo()
    .createQueryBuilder('t')
    .innerJoin('t.holding', 'h')
    .where('h.portfolio_id = :portfolioId', { portfolioId: query.portfolioId });

  if (query.from) {
    qb.andWhere('t.executed_at >= :from', { from: query.from });
  }
  if (query.to) {
    qb.andWhere('t.executed_at <= :to', { to: query.to });
  }

  return qb.orderBy('t.executed_at', 'DESC').getMany();
}

/**
 * Create a transaction AND atomically update the holding's quantity + avg_cost.
 */
export async function create(
  holdingId: string,
  userId: string,
  dto: CreateTransactionDto,
): Promise<Transaction> {
  // Ownership check OUTSIDE the transaction — no need to lock anything yet
  await findHoldingForUser(holdingId, userId);

  return AppDataSource.transaction(async (manager) => {
    // Re-fetch holding INSIDE the transaction for consistency.
    const holding = await manager
      .getRepository(Holding)
      .createQueryBuilder('h')
      .setLock('pessimistic_write')
      .where('h.id = :id', { id: holdingId })
      .getOne();

    if (!holding) throw new HoldingNotFoundError();

    const oldQuantity = Number(holding.quantity);
    const oldAvgCost = Number(holding.avgCost);
    const txQuantity = dto.quantity;
    const txPrice = dto.price;
    const txFees = dto.fees ?? 0;

    let newQuantity: number;
    let newAvgCost: number;

    if (dto.type === TransactionType.BUY) {
      // Weighted-average cost basis update.
      const oldTotalCost = oldQuantity * oldAvgCost;
      const newCostAdded = txQuantity * txPrice + txFees;

      newQuantity = oldQuantity + txQuantity;
      newAvgCost = newQuantity > 0 ? (oldTotalCost + newCostAdded) / newQuantity : 0;
    } else {
      // SELL: validate we have enough
      if (txQuantity > oldQuantity) {
        throw new InsufficientQuantityError(oldQuantity, txQuantity);
      }

      newQuantity = oldQuantity - txQuantity;
      // Avg cost unchanged on sell (we're not computing realized gains here).
      newAvgCost = newQuantity > 0 ? oldAvgCost : 0;
    }

    // Update holding within the same transaction
    await manager.getRepository(Holding).update(holding.id, {
      quantity: newQuantity.toFixed(6),
      avgCost: newAvgCost.toFixed(4),
    });

    // Insert the transaction record
    const tx = manager.getRepository(Transaction).create({
      holdingId,
      type: dto.type,
      quantity: txQuantity.toFixed(6),
      price: txPrice.toFixed(4),
      fees: txFees.toFixed(4),
      executedAt: dto.executedAt,
      notes: dto.notes ?? null,
    });
    return manager.getRepository(Transaction).save(tx);
  });
}

/**
 * Delete a transaction and reverse its effect on the holding.
 * Also wrapped in a DB transaction for atomicity.
 *
 * Reversal logic:
 * - Deleting a BUY: subtract qty, recompute avg_cost from REMAINING transactions
 * - Deleting a SELL: add qty back, avg_cost unchanged
 *
 */
export async function remove(id: string, userId: string): Promise<void> {
  return AppDataSource.transaction(async (manager) => {
    // Load transaction + holding + ownership in one go
    const tx = await manager
      .getRepository(Transaction)
      .createQueryBuilder('t')
      .innerJoinAndSelect('t.holding', 'h')
      .innerJoin('h.portfolio', 'p')
      .where('t.id = :id', { id })
      .andWhere('p.user_id = :userId', { userId })
      .setLock('pessimistic_write')
      .getOne();

    if (!tx) throw new TransactionNotFoundError();

    // Delete the transaction first
    await manager.getRepository(Transaction).delete(tx.id);

    // Now recompute the holding's state from all remaining transactions
    const remaining = await manager.getRepository(Transaction).find({
      where: { holdingId: tx.holdingId },
      order: { executedAt: 'ASC' },
    });

    let qty = 0;
    let avgCost = 0;

    for (const t of remaining) {
      const tQty = Number(t.quantity);
      const tPrice = Number(t.price);
      const tFees = Number(t.fees);

      if (t.type === TransactionType.BUY) {
        const oldTotalCost = qty * avgCost;
        const newCostAdded = tQty * tPrice + tFees;
        qty = qty + tQty;
        avgCost = qty > 0 ? (oldTotalCost + newCostAdded) / qty : 0;
      } else {
        // SELL
        qty = qty - tQty;
        if (qty <= 0) {
          qty = 0;
          avgCost = 0;
        }
      }
    }

    await manager.getRepository(Holding).update(tx.holdingId, {
      quantity: qty.toFixed(6),
      avgCost: avgCost.toFixed(4),
    });
  });
}