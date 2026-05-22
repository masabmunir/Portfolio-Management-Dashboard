export enum AssetType {
  STOCK = 'STOCK',
  BOND = 'BOND',
  MUTUAL_FUND = 'MUTUAL_FUND',
  ETF = 'ETF',
}

export interface Holding {
  id: string;
  portfolioId: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  quantity: string;
  avgCost: string;
  currentPrice: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHoldingRequest {
  symbol: string;
  name: string;
  assetType: AssetType;
  currentPrice: number;
}

export interface UpdateHoldingRequest {
  name?: string;
  currentPrice?: number;
}