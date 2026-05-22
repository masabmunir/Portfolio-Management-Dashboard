import { AppDataSource } from '../../config/data-source';
import { Holding } from '../../entities/Holding';
import { Portfolio } from '../../entities/Portfolio';
import { CreateHoldingDto, UpdateHoldingDto } from './holding.dto';

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

/**
 * Computed metrics returned alongside holding data.
 */
export interface HoldingMetrics {
  marketValue: string;
  costBasis: string;
  unrealizedGain: string;
  unrealizedGainPct: string;
}

export type EnrichedHolding = Holding & HoldingMetrics;

const holdingRepo = () => AppDataSource.getRepository(Holding);
const portfolioRepo = () => AppDataSource.getRepository(Portfolio);

/**
 * Internal: ensure a portfolio belongs to the user.
 */
async function assertPortfolioOwned(portfolioId: string, userId: string): Promise<Portfolio> {
  const portfolio = await portfolioRepo().findOne({ where: { id: portfolioId, userId } });
  if (!portfolio) throw new PortfolioNotFoundError();
  return portfolio;
}

/**
 * Internal: load a holding and verify the user owns its portfolio.
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
 * Compute performance metrics for a holding.
 */
export function enrichWithMetrics(holding: Holding): EnrichedHolding {
  const quantity = Number(holding.quantity);
  const avgCost = Number(holding.avgCost);
  const currentPrice = Number(holding.currentPrice);

  const marketValue = quantity * currentPrice;
  const costBasis = quantity * avgCost;
  const unrealizedGain = marketValue - costBasis;
  const unrealizedGainPct = costBasis > 0 ? (unrealizedGain / costBasis) * 100 : 0;

  return Object.assign(holding, {
    marketValue: marketValue.toFixed(4),
    costBasis: costBasis.toFixed(4),
    unrealizedGain: unrealizedGain.toFixed(4),
    unrealizedGainPct: unrealizedGainPct.toFixed(2),
  });
}

/**
 * List all holdings in a portfolio, with computed metrics.
 */
export async function findAllInPortfolio(
  portfolioId: string,
  userId: string,
): Promise<EnrichedHolding[]> {
  await assertPortfolioOwned(portfolioId, userId);

  const holdings = await holdingRepo().find({
    where: { portfolioId },
    order: { createdAt: 'ASC' },
  });

  return holdings.map(enrichWithMetrics);
}

/**
 * Get one holding with metrics, scoped to user via portfolio ownership.
 */
export async function findByIdForUser(id: string, userId: string): Promise<EnrichedHolding> {
  const holding = await findHoldingForUser(id, userId);
  return enrichWithMetrics(holding);
}

/**
 * Create a new holding in a user's portfolio.
 */
export async function create(
  portfolioId: string,
  userId: string,
  dto: CreateHoldingDto,
): Promise<EnrichedHolding> {
  await assertPortfolioOwned(portfolioId, userId);

  const holding = holdingRepo().create({
    portfolioId,
    symbol: dto.symbol,
    name: dto.name,
    assetType: dto.assetType,
    quantity: '0',
    avgCost: '0',
    currentPrice: dto.currentPrice.toString(),
  });
  const saved = await holdingRepo().save(holding);
  return enrichWithMetrics(saved);
}

/**
 * Update name and/or current price.
 */
export async function update(
  id: string,
  userId: string,
  dto: UpdateHoldingDto,
): Promise<EnrichedHolding> {
  const holding = await findHoldingForUser(id, userId);

  if (dto.name !== undefined) holding.name = dto.name;
  if (dto.currentPrice !== undefined) holding.currentPrice = dto.currentPrice.toString();

  const saved = await holdingRepo().save(holding);
  return enrichWithMetrics(saved);
}

/**
 * Delete a holding. CASCADE removes its transactions.
 */
export async function remove(id: string, userId: string): Promise<void> {
  // Ownership verified before delete
  await findHoldingForUser(id, userId);
  await holdingRepo().delete({ id });
}