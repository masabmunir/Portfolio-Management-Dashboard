import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { PortfolioService } from '../../core/services/portfolio.service';
import { TransactionService } from '../../core/services/transaction';
import {
  Portfolio,
  PortfolioSummary,
  Transaction,
  TransactionType,
} from '../../core/models';

interface DashboardPortfolio {
  portfolio: Portfolio;
  summary: PortfolioSummary;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe,
    RouterLink,
    BaseChartDirective,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private router = inject(Router);
  private portfolioService = inject(PortfolioService);
  private transactionService = inject(TransactionService);

  loading = signal(true);
  errorMessage = signal<string | null>(null);

  portfolios = signal<DashboardPortfolio[]>([]);
  recentTransactions = signal<Array<Transaction & { portfolioName: string }>>([]);

  TransactionType = TransactionType;

  totals = computed(() => {
    const list = this.portfolios();
    let marketValue = 0;
    let costBasis = 0;
    let totalHoldings = 0;

    for (const item of list) {
      marketValue += Number(item.summary.totals.marketValue);
      costBasis += Number(item.summary.totals.costBasis);
      totalHoldings += item.summary.totals.holdingsCount;
    }

    const unrealizedGain = marketValue - costBasis;
    const unrealizedGainPct = costBasis > 0 ? (unrealizedGain / costBasis) * 100 : 0;

    return {
      marketValue,
      costBasis,
      unrealizedGain,
      unrealizedGainPct,
      portfolioCount: list.length,
      holdingsCount: totalHoldings,
    };
  });

  // Pie chart: aggregate asset type breakdown across all portfolios
  assetChartData = computed<ChartData<'doughnut'>>(() => {
    const breakdown: Record<string, number> = {};

    for (const item of this.portfolios()) {
      for (const [type, sums] of Object.entries(item.summary.byAssetType)) {
        breakdown[type] = (breakdown[type] ?? 0) + Number(sums.marketValue);
      }
    }

    const labels = Object.keys(breakdown);
    const values = Object.values(breakdown);

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
          borderColor: 'white',
          borderWidth: 2,
        },
      ],
    };
  });

  assetChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 16,
          font: { size: 13 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed;
            const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${ctx.label}: $${value.toFixed(2)} (${pct}%)`;
          },
        },
      },
    },
  };

  hasAnyData = computed(() => this.portfolios().some((p) => p.summary.holdings.length > 0));

  ngOnInit(): void {
    this.loadDashboard();
  }

  /**
   * Loads all portfolios
   */
  loadDashboard(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.portfolioService
      .list()
      .pipe(
        switchMap((portfolios) => {
          if (portfolios.length === 0) {
            return of({ portfolios: [], summaries: [] });
          }

          // Fetch all summaries in parallel
          const summaryRequests = portfolios.map((p) =>
            this.portfolioService.getSummary(p.id),
          );

          return forkJoin(summaryRequests).pipe(
            switchMap((summaries) => of({ portfolios, summaries })),
          );
        }),
        catchError(() => {
          this.errorMessage.set('Failed to load dashboard');
          return of({ portfolios: [], summaries: [] });
        }),
      )
      .subscribe(({ portfolios, summaries }) => {
        const dashboardPortfolios: DashboardPortfolio[] = portfolios.map((p, i) => ({
          portfolio: p,
          summary: summaries[i],
        }));
        this.portfolios.set(dashboardPortfolios);

        // After portfolios load, fetch recent transactions
        this.loadRecentTransactions(dashboardPortfolios);
      });
  }

  private loadRecentTransactions(dashboardPortfolios: DashboardPortfolio[]): void {
    if (dashboardPortfolios.length === 0) {
      this.loading.set(false);
      return;
    }

    // Fetch transactions from all portfolios in parallel
    const requests = dashboardPortfolios.map((dp) =>
      this.transactionService.historyForPortfolio(dp.portfolio.id).pipe(
        catchError(() => of([] as Transaction[])),
      ),
    );

    forkJoin(requests).subscribe((results) => {
      // Flatten and annotate with portfolio name
      const allTxs: Array<Transaction & { portfolioName: string }> = [];
      results.forEach((txs, i) => {
        const portfolioName = dashboardPortfolios[i].portfolio.name;
        for (const tx of txs) {
          allTxs.push({ ...tx, portfolioName });
        }
      });

      // Sort by executedAt DESC and take top 10
      allTxs.sort(
        (a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime(),
      );
      this.recentTransactions.set(allTxs.slice(0, 10));
      this.loading.set(false);
    });
  }

  openPortfolio(portfolio: Portfolio): void {
    this.router.navigate(['/portfolios', portfolio.id]);
  }

  gainClass(value: number | string): string {
    const n = typeof value === 'number' ? value : Number(value);
    if (n > 0) return 'positive';
    if (n < 0) return 'negative';
    return 'neutral';
  }
}