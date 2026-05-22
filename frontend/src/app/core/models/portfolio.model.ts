export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePortfolioRequest {
  name: string;
}

export interface UpdatePortfolioRequest {
  name: string;
}

export interface PortfolioSummary {
  portfolio: {
    id: string;
    name: string;
    createdAt: string;
  };
  totals: {
    marketValue: string;
    costBasis: string;
    unrealizedGain: string;
    unrealizedGainPct: string;
    holdingsCount: number;
  };
  byAssetType: Record<string, { marketValue: string; costBasis: string }>;
  holdings: EnrichedHolding[];
}

export interface EnrichedHolding extends Holding {
  marketValue: string;
  costBasis: string;
  unrealizedGain: string;
  unrealizedGainPct: string;
}

// Import Holding from holding.model
import { Holding } from './holding.model';