import { Component, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Modal } from '../../../shared/components/modal/modal';
import { HoldingService } from '../../../core/services/holding';
import { AssetType, EnrichedHolding } from '../../../core/models';

@Component({
  selector: 'app-add-holding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Modal],
  templateUrl: './add-holding.html',
  styleUrl: './add-holding.scss',
})
export class AddHolding {
  portfolioId = input.required<string>();
  closed = output<void>();
  created = output<EnrichedHolding>();

  private fb = inject(FormBuilder);
  private holdingService = inject(HoldingService);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  // Expose enum to template
  assetTypes = Object.values(AssetType);

  form = this.fb.nonNullable.group({
    symbol: ['', [Validators.required, Validators.maxLength(20)]],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    assetType: [AssetType.STOCK, [Validators.required]],
    currentPrice: [0, [Validators.required, Validators.min(0)]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.holdingService.create(this.portfolioId(), this.form.getRawValue()).subscribe({
      next: (holding) => {
        this.loading.set(false);
        this.created.emit(holding);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.status === 400 ? 'Please check your input' : 'Failed to add holding',
        );
      },
    });
  }
}