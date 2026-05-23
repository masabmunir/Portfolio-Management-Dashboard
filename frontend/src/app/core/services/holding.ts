import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Holding,
  CreateHoldingRequest,
  UpdateHoldingRequest,
  EnrichedHolding,
} from '../models';

@Injectable({ providedIn: 'root' })
export class HoldingService {
  private api = inject(ApiService);

  listForPortfolio(portfolioId: string): Observable<EnrichedHolding[]> {
    return this.api.get<EnrichedHolding[]>(`/portfolios/${portfolioId}/holdings`);
  }

  getById(id: string): Observable<EnrichedHolding> {
    return this.api.get<EnrichedHolding>(`/holdings/${id}`);
  }

  create(portfolioId: string, request: CreateHoldingRequest): Observable<EnrichedHolding> {
    return this.api.post<EnrichedHolding>(`/portfolios/${portfolioId}/holdings`, request);
  }

  update(id: string, request: UpdateHoldingRequest): Observable<EnrichedHolding> {
    return this.api.patch<EnrichedHolding>(`/holdings/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/holdings/${id}`);
  }
}