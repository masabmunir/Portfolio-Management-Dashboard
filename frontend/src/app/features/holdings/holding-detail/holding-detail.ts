import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HoldingService } from '../../../core/services/holding';
import { TransactionService } from '../../../core/services/transaction';
import { EnrichedHolding, Transaction, TransactionType } from '../../../core/models';
import { AddTransaction } from '../../transactions/add-transaction/add-transaction';

@Component({
  selector: 'app-holding-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, RouterLink, AddTransaction],
  templateUrl: './holding-detail.html',
  styleUrl: './holding-detail.scss',
})
export class HoldingDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private holdingService = inject(HoldingService);
  private transactionService = inject(TransactionService);

  holdingId = signal<string>('');
  holding = signal<EnrichedHolding | null>(null);
  transactions = signal<Transaction[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  showAddTransaction = signal(false);

  // Expose enum for template
  TransactionType = TransactionType;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/portfolios']);
      return;
    }
    this.holdingId.set(id);
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    // Load holding and transactions in parallel
    this.holdingService.getById(this.holdingId()).subscribe({
      next: (h) => {
        this.holding.set(h);
        // Now load transactions
        this.transactionService.listForHolding(this.holdingId()).subscribe({
          next: (txs) => {
            this.transactions.set(txs);
            this.loading.set(false);
          },
          error: () => {
            this.errorMessage.set('Failed to load transactions');
            this.loading.set(false);
          },
        });
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.errorMessage.set('Holding not found');
        } else {
          this.errorMessage.set('Failed to load holding');
        }
      },
    });
  }

  onTransactionAdded(): void {
    this.showAddTransaction.set(false);
    // Reload everything — holding's quantity/avgCost changed
    this.loadAll();
  }

  onDeleteTransaction(tx: Transaction): void {
    const confirmed = confirm(
      `Delete this ${tx.type} transaction? The holding's quantity and average cost will be recalculated.`,
    );
    if (!confirmed) return;

    this.transactionService.delete(tx.id).subscribe({
      next: () => this.loadAll(),
      error: () => alert('Failed to delete transaction'),
    });
  }

  goBack(): void {
    const h = this.holding();
    if (h) {
      this.router.navigate(['/portfolios', h.portfolioId]);
    } else {
      this.router.navigate(['/portfolios']);
    }
  }

  gainClass(value: string): string {
    const n = Number(value);
    if (n > 0) return 'positive';
    if (n < 0) return 'negative';
    return 'neutral';
  }
}