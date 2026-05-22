export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export interface Transaction {
  id: string;
  holdingId: string;
  type: TransactionType;
  quantity: string;
  price: string;
  fees: string;
  executedAt: string;
  notes: string | null;
  createdAt: string;
}

export interface CreateTransactionRequest {
  type: TransactionType;
  quantity: number;
  price: number;
  fees?: number;
  executedAt: string;
  notes?: string;
}