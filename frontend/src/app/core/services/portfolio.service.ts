import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Portfolio,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
  PortfolioSummary,
} from '../models';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private api = inject(ApiService);

  list(): Observable<Portfolio[]> {
    return this.api.get<Portfolio[]>('/portfolios');
  }

  getById(id: string): Observable<Portfolio> {
    return this.api.get<Portfolio>(`/portfolios/${id}`);
  }

  getSummary(id: string): Observable<PortfolioSummary> {
    return this.api.get<PortfolioSummary>(`/portfolios/${id}/summary`);
  }

  create(request: CreatePortfolioRequest): Observable<Portfolio> {
    return this.api.post<Portfolio>('/portfolios', request);
  }

  update(id: string, request: UpdatePortfolioRequest): Observable<Portfolio> {
    return this.api.patch<Portfolio>(`/portfolios/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/portfolios/${id}`);
  }
}