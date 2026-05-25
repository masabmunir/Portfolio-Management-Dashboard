import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Transaction, CreateTransactionRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private api = inject(ApiService);

  listForHolding(holdingId: string): Observable<Transaction[]> {
    return this.api.get<Transaction[]>(`/holdings/${holdingId}/transactions`);
  }

  /**
   * History across all holdings in a portfolio.
   * Used by the Transaction History view in the dashboard later.
   */
  historyForPortfolio(
    portfolioId: string,
    from?: string,
    to?: string,
  ): Observable<Transaction[]> {
    const params: Record<string, string> = { portfolioId };
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.api.get<Transaction[]>('/transactions', params);
  }

  create(holdingId: string, request: CreateTransactionRequest): Observable<Transaction> {
    return this.api.post<Transaction>(`/holdings/${holdingId}/transactions`, request);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/transactions/${id}`);
  }
}