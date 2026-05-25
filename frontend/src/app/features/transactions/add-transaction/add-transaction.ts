import { Component, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Modal } from '../../../shared/components/modal/modal';
import { TransactionService } from '../../../core/services/transaction';
import { Transaction, TransactionType } from '../../../core/models';

@Component({
  selector: 'app-add-transaction',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Modal],
  templateUrl: './add-transaction.html',
  styleUrl: './add-transaction.scss',
})
export class AddTransaction {
  holdingId = input.required<string>();
  holdingSymbol = input.required<string>();
  closed = output<void>();
  created = output<Transaction>();

  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionService);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  transactionTypes = Object.values(TransactionType);

  form = this.fb.nonNullable.group({
    type: [TransactionType.BUY, [Validators.required]],
    quantity: [0, [Validators.required, Validators.min(0.000001)]],
    price: [0, [Validators.required, Validators.min(0)]],
    fees: [0, [Validators.min(0)]],
    executedAt: [this.todayISO(), [Validators.required]],
    notes: [''],
  });

  /**
   * Default date is today in YYYY-MM-DD format (matches <input type="date">).
   */
  private todayISO(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();

    // Convert date string to ISO 8601 datetime (backend expects datetime, not just date)
    const executedAtISO = new Date(raw.executedAt + 'T12:00:00Z').toISOString();

    this.transactionService
      .create(this.holdingId(), {
        type: raw.type,
        quantity: raw.quantity,
        price: raw.price,
        fees: raw.fees || 0,
        executedAt: executedAtISO,
        notes: raw.notes?.trim() || undefined,
      })
      .subscribe({
        next: (tx) => {
          this.loading.set(false);
          this.created.emit(tx);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          // Backend sends 400 for "Cannot sell X: only Y available"
          if (err.status === 400 && err.error?.error) {
            this.errorMessage.set(err.error.error);
          } else {
            this.errorMessage.set('Failed to add transaction');
          }
        },
      });
  }
}