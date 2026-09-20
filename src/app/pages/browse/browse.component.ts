import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogService } from '../../core/api/catalog.service';
import {
  PROPERTY_TYPE_LABELS,
  Property,
  PropertyFilters,
  PropertyType,
} from '../../core/models/property.model';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { propertyCoverImage } from '../../shared/property-media';

@Component({
  selector: 'app-browse',
  imports: [FormsModule, RouterLink, InrCurrencyPipe],
  templateUrl: './browse.component.html',
  styleUrl: './browse.component.scss',
})
export class BrowseComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly propertyTypes = Object.entries(PROPERTY_TYPE_LABELS) as [PropertyType, string][];
  readonly typeLabels = PROPERTY_TYPE_LABELS;
  readonly cities = ['Gurgaon', 'Noida', 'Delhi', 'Faridabad'];

  properties: Property[] = [];
  loading = false;
  error = '';
  notice = '';

  filters: PropertyFilters = {
    page: 1,
    limit: 12,
    city: '',
    locality: '',
    propertyType: '',
    minPrice: null,
    maxPrice: null,
    search: '',
  };

  total = 0;
  totalPages = 1;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.notice =
        params.get('notice') === 'seller-account'
          ? 'You signed in with a seller account. Browse listings here, or manage your properties from the seller menu.'
          : '';

      this.filters = {
        page: Number(params.get('page') ?? 1),
        limit: 12,
        city: params.get('city') ?? '',
        locality: params.get('locality') ?? '',
        propertyType: (params.get('propertyType') as PropertyType) ?? '',
        minPrice: params.get('minPrice') ? Number(params.get('minPrice')) : null,
        maxPrice: params.get('maxPrice') ? Number(params.get('maxPrice')) : null,
        search: params.get('search') ?? '',
      };

      this.loadProperties();
    });
  }

  applyFilters(): void {
    void this.router.navigate(['/browse'], {
      queryParams: {
        page: 1,
        city: this.filters.city || null,
        locality: this.filters.locality || null,
        propertyType: this.filters.propertyType || null,
        minPrice: this.filters.minPrice ?? null,
        maxPrice: this.filters.maxPrice ?? null,
        search: this.filters.search || null,
      },
    });
  }

  clearFilters(): void {
    void this.router.navigate(['/browse'], { queryParams: { page: 1 } });
  }

  quickCity(city: string): void {
    this.filters.city = city;
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    void this.router.navigate(['/browse'], {
      queryParams: {
        page,
        city: this.filters.city || null,
        locality: this.filters.locality || null,
        propertyType: this.filters.propertyType || null,
        minPrice: this.filters.minPrice ?? null,
        maxPrice: this.filters.maxPrice ?? null,
        search: this.filters.search || null,
      },
    });
  }

  priceOf(property: Property): number {
    return Number(property.askingPrice);
  }

  coverImage(property: Property): string {
    return propertyCoverImage(property);
  }

  areaLabel(property: Property): string {
    const area = property.carpetAreaSqft ?? property.builtUpAreaSqft;
    return area ? `${area} sq ft` : '';
  }

  private loadProperties(): void {
    this.loading = true;
    this.error = '';

    this.catalog.list(this.filters).subscribe({
      next: (res) => {
        this.properties = res.data;
        this.total = res.meta?.total ?? res.data.length;
        this.totalPages = Math.max(1, Math.ceil(this.total / (this.filters.limit ?? 12)));
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load listings. Please try again.';
        this.loading = false;
      },
    });
  }
}
