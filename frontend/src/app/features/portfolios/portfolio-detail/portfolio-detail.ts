import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PortfolioService } from '../../../core/services/portfolio.service';
import { HoldingService } from '../../../core/services/holding';
import { PortfolioSummary, EnrichedHolding } from '../../../core/models';
import { AddHolding } from '../../holdings/add-holding/add-holding';
import { EditPrice } from '../../holdings/edit-price/edit-price';

@Component({
  selector: 'app-portfolio-detail',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterLink, AddHolding, EditPrice],
  templateUrl: './portfolio-detail.html',
  styleUrl: './portfolio-detail.scss',
})
export class PortfolioDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private portfolioService = inject(PortfolioService);
  private holdingService = inject(HoldingService);

  portfolioId = signal<string>('');
  summary = signal<PortfolioSummary | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  // Modal state
  showAddHolding = signal(false);
  editingHolding = signal<EnrichedHolding | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/portfolios']);
      return;
    }
    this.portfolioId.set(id);
    this.loadSummary();
  }

  loadSummary(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.portfolioService.getSummary(this.portfolioId()).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.errorMessage.set('Portfolio not found');
        } else {
          this.errorMessage.set('Failed to load portfolio');
        }
      },
    });
  }

  onHoldingAdded(): void {
    this.showAddHolding.set(false);
    this.loadSummary(); // refresh to get updated totals
  }

  onPriceUpdated(): void {
    this.editingHolding.set(null);
    this.loadSummary(); // refresh metrics
  }

  onDeleteHolding(holding: EnrichedHolding, event: Event): void {
    event.stopPropagation();
    const confirmed = confirm(
      `Delete "${holding.symbol}"? This will also delete all its transactions.`,
    );
    if (!confirmed) return;

    this.holdingService.delete(holding.id).subscribe({
      next: () => this.loadSummary(),
      error: () => alert('Failed to delete holding'),
    });
  }

  openHolding(holding: EnrichedHolding): void {
    this.router.navigate(['/holdings', holding.id]);
  }

  // Helper for template — gain color class
  gainClass(value: string): string {
    const n = Number(value);
    if (n > 0) return 'positive';
    if (n < 0) return 'negative';
    return 'neutral';
  }
}