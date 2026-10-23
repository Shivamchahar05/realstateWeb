import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { SellerPropertyService } from '../../../core/services/seller-property.service';
import { SeoService } from '../../../core/seo/seo.service';
import { Property } from '../../../core/models/seller-property.model';
import { InrCurrencyPipe } from '../../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-seller-property-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, InrCurrencyPipe],
  templateUrl: './property-list.component.html',
  styleUrl: './property-list.component.scss',
})
export class PropertyListComponent implements OnInit {
  private readonly propertyService = inject(SellerPropertyService);
  private readonly seo = inject(SeoService);

  properties: Property[] = [];
  loading = true;
  errorMessage = '';
  page = 1;
  limit = 10;
  total = 0;

  readonly searchControl = new FormControl('', { nonNullable: true });

  ngOnInit(): void {
    this.seo.privatePage('My properties', 'Listings on your Titlefolio seller account.');
    this.loadProperties();
    this.searchControl.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.page = 1;
      this.loadProperties();
    });
  }

  loadProperties(): void {
    this.loading = true;
    this.errorMessage = '';
    this.propertyService
      .list({
        page: this.page,
        limit: this.limit,
        search: this.searchControl.value.trim() || undefined,
      })
      .subscribe({
        next: ({ items, meta }) => {
          this.properties = items;
          this.total = meta.total;
          this.page = meta.page;
          this.limit = meta.limit;
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'Unable to load properties.';
          this.loading = false;
        },
      });
  }

  goToPage(nextPage: number): void {
    if (nextPage < 1 || nextPage > this.totalPages) return;
    this.page = nextPage;
    this.loadProperties();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  statusLabel(value: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      SUBMITTED: 'Submitted',
      DOCUMENT_COLLECTION: 'Documents',
      AI_ANALYSIS: 'Document check',
      LEGAL_REVIEW: 'Legal review',
      GOVERNMENT_CHECK: 'Records check',
      PHYSICAL_INSPECTION: 'Inspection',
      VALUATION: 'Valuation',
      RISK_ASSESSMENT: 'Risk check',
      FINAL_REVIEW: 'Final review',
      VERIFIED: 'Verified',
      REVIEW_REQUIRED: 'Needs changes',
      REJECTED: 'Rejected',
      PENDING_VERIFICATION: 'In review',
      LIVE: 'Live',
      ARCHIVED: 'Archived',
    };
    return labels[value] ?? value.replaceAll('_', ' ');
  }

  tone(value: string): 'good' | 'progress' | 'warn' | 'bad' | 'draft' {
    if (value === 'VERIFIED' || value === 'LIVE') return 'good';
    if (value === 'REVIEW_REQUIRED') return 'warn';
    if (value === 'REJECTED') return 'bad';
    if (value === 'DRAFT' || value === 'ARCHIVED') return 'draft';
    return 'progress';
  }

  canEdit(property: Property): boolean {
    return ['DRAFT', 'REVIEW_REQUIRED', 'REJECTED'].includes(property.verificationStatus);
  }
}
