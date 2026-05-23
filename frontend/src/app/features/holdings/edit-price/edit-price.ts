import { Component, input, output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Modal } from '../../../shared/components/modal/modal';
import { HoldingService } from '../../../core/services/holding';
import { EnrichedHolding } from '../../../core/models';

@Component({
  selector: 'app-edit-price',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Modal],
  templateUrl: './edit-price.html',
  styleUrl: './edit-price.scss',
})
export class EditPrice implements OnInit {
  holding = input.required<EnrichedHolding>();
  closed = output<void>();
  updated = output<EnrichedHolding>();

  private fb = inject(FormBuilder);
  private holdingService = inject(HoldingService);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    currentPrice: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    // Pre-fill with current price
    this.form.patchValue({
      currentPrice: Number(this.holding().currentPrice),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.holdingService
      .update(this.holding().id, { currentPrice: this.form.controls.currentPrice.value })
      .subscribe({
        next: (updated) => {
          this.loading.set(false);
          this.updated.emit(updated);
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set('Failed to update price');
        },
      });
  }
}