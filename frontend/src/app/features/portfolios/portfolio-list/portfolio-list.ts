import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PortfolioService } from '../../../core/services/portfolio.service';
import { Portfolio } from '../../../core/models';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-portfolio-list',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, ReactiveFormsModule],
  templateUrl: './portfolio-list.html',
  styleUrl: './portfolio-list.scss',
})
export class PortfolioList implements OnInit {
  private portfolioService = inject(PortfolioService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  portfolios = signal<Portfolio[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  showCreateForm = signal(false);
  creating = signal(false);
  createError = signal<string | null>(null);

  createForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
  });

  ngOnInit(): void {
    this.loadPortfolios();
  }

  loadPortfolios(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.portfolioService.list().subscribe({
      next: (portfolios) => {
        this.portfolios.set(portfolios);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load portfolios');
        this.loading.set(false);
      },
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm.update((v) => !v);
    if (!this.showCreateForm()) {
      this.createForm.reset();
      this.createError.set(null);
    }
  }

  onCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.creating.set(true);
    this.createError.set(null);

    this.portfolioService.create(this.createForm.getRawValue()).subscribe({
      next: (newPortfolio) => {
        this.creating.set(false);
        this.portfolios.update((list) => [...list, newPortfolio]);
        this.createForm.reset();
        this.showCreateForm.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.creating.set(false);
        this.createError.set(
          err.status === 400 ? 'Please check the name' : 'Failed to create portfolio',
        );
      },
    });
  }

  onDelete(portfolio: Portfolio, event: Event): void {
    event.stopPropagation(); // prevent navigation to portfolio detail
    const confirmed = confirm(
      `Delete "${portfolio.name}"? This will also delete all its holdings and transactions.`,
    );
    if (!confirmed) return;

    this.portfolioService.delete(portfolio.id).subscribe({
      next: () => {
        this.portfolios.update((list) => list.filter((p) => p.id !== portfolio.id));
      },
      error: () => {
        alert('Failed to delete portfolio');
      },
    });
  }

  openPortfolio(portfolio: Portfolio): void {
    this.router.navigate(['/portfolios', portfolio.id]);
  }
}