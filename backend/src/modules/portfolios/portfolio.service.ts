import { AppDataSource } from '../../config/data-source';
import { Portfolio } from '../../entities/Portfolio';
import { CreatePortfolioDto, UpdatePortfolioDto } from './portfolio.dto';
import { Holding } from '../../entities/Holding';
import * as holdingService from '../holdings/holding.service';

/**
 * Thrown when a portfolio doesn't exist OR belongs to another user.
 */
export class PortfolioNotFoundError extends Error {
  constructor() {
    super('Portfolio not found');
  }
}

const repo = () => AppDataSource.getRepository(Portfolio);

/**
 * List all portfolios owned by the user.
 */
export async function findAllByUser(userId: string): Promise<Portfolio[]> {
  return repo().find({
    where: { userId },
    order: { createdAt: 'ASC' },
  });
}

/**
 * Get a single portfolio by ID, scoped to the user.
 */
export async function findByIdForUser(id: string, userId: string): Promise<Portfolio> {
  const portfolio = await repo().findOne({ where: { id, userId } });
  if (!portfolio) throw new PortfolioNotFoundError();
  return portfolio;
}

/**
 * Create a new portfolio for the user.
 */
export async function create(userId: string, dto: CreatePortfolioDto): Promise<Portfolio> {
  const portfolio = repo().create({
    userId,
    name: dto.name,
  });
  return repo().save(portfolio);
}

/**
 * Update a portfolio's name. Scoped to user.
 */
export async function update(
  id: string,
  userId: string,
  dto: UpdatePortfolioDto,
): Promise<Portfolio> {
  const portfolio = await findByIdForUser(id, userId); // throws if not user's
  portfolio.name = dto.name;
  return repo().save(portfolio);
}

/**
 * Delete a portfolio. CASCADE in the schema deletes holdings + transactions.
 */
export async function remove(id: string, userId: string): Promise<void> {
  const result = await repo().delete({ id, userId });
  if (result.affected === 0) throw new PortfolioNotFoundError();
}

/**
 * Aggregated summary of a portfolio's value and performance.
 */
export interface PortfolioSummary {
  portfolio: {
    id: string;
    name: string;
    createdAt: Date;
  };
  totals: {
    marketValue: string;
    costBasis: string;
    unrealizedGain: string;
    unrealizedGainPct: string;
    holdingsCount: number;
  };
  byAssetType: Record<string, { marketValue: string; costBasis: string }>;
  holdings: holdingService.EnrichedHolding[];
}

/**
 * Build a portfolio summary: aggregate metrics + per-asset-type breakdown + holdings list.
 */
export async function getSummary(id: string, userId: string): Promise<PortfolioSummary> {
  const portfolio = await findByIdForUser(id, userId); // reuses existing ownership check
  const holdings = await holdingService.findAllInPortfolio(id, userId);

  // Aggregate totals across all holdings.
  let totalMarketValue = 0;
  let totalCostBasis = 0;
  const byAssetType: Record<string, { marketValue: number; costBasis: number }> = {};

  for (const h of holdings) {
    const mv = Number(h.marketValue);
    const cb = Number(h.costBasis);

    totalMarketValue += mv;
    totalCostBasis += cb;

    // Group by asset type
    if (!byAssetType[h.assetType]) {
      byAssetType[h.assetType] = { marketValue: 0, costBasis: 0 };
    }
    byAssetType[h.assetType].marketValue += mv;
    byAssetType[h.assetType].costBasis += cb;
  }

  const unrealizedGain = totalMarketValue - totalCostBasis;
  const unrealizedGainPct = totalCostBasis > 0 ? (unrealizedGain / totalCostBasis) * 100 : 0;

  // Stringify the breakdown for output
  const byAssetTypeOut: Record<string, { marketValue: string; costBasis: string }> = {};
  for (const [type, sums] of Object.entries(byAssetType)) {
    byAssetTypeOut[type] = {
      marketValue: sums.marketValue.toFixed(4),
      costBasis: sums.costBasis.toFixed(4),
    };
  }

  return {
    portfolio: {
      id: portfolio.id,
      name: portfolio.name,
      createdAt: portfolio.createdAt,
    },
    totals: {
      marketValue: totalMarketValue.toFixed(4),
      costBasis: totalCostBasis.toFixed(4),
      unrealizedGain: unrealizedGain.toFixed(4),
      unrealizedGainPct: unrealizedGainPct.toFixed(2),
      holdingsCount: holdings.length,
    },
    byAssetType: byAssetTypeOut,
    holdings,
  };
}