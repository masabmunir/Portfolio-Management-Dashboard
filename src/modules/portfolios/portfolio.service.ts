import { AppDataSource } from '../../config/data-source';
import { Portfolio } from '../../entities/Portfolio';
import { CreatePortfolioDto, UpdatePortfolioDto } from './portfolio.dto';

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