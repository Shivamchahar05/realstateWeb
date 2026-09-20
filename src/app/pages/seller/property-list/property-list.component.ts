import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { SellerPropertyService } from '../../../core/services/seller-property.service';
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

  properties: Property[] = [];
  loading = true;
  errorMessage = '';
  page = 1;
  limit = 10;
  total = 0;

  readonly searchControl = new FormControl('', { nonNullable: true });

  ngOnInit(): void {
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

  formatStatus(value: string): string {
    return value.replaceAll('_', ' ');
  }

  canEdit(property: Property): boolean {
    return ['DRAFT', 'REVIEW_REQUIRED', 'REJECTED'].includes(property.verificationStatus);
  }
}
