import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CatalogService } from '../../core/api/catalog.service';
import { PROPERTY_TYPE_LABELS, Property, PropertyType } from '../../core/models/property.model';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

interface CitySpot {
  name: string;
  tagline: string;
  image: string;
}

interface TypeSpot {
  type: PropertyType;
  label: string;
  image: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, FormsModule, InrCurrencyPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);

  readonly propertyTypes = Object.entries(PROPERTY_TYPE_LABELS) as [PropertyType, string][];

  city = 'Gurgaon';
  propertyType: PropertyType | '' = '';
  budget = '';

  featured: Property[] = [];
  featuredLoading = true;

  readonly cities: CitySpot[] = [
    {
      name: 'Gurgaon',
      tagline: 'Golf Course Road · DLF · Sector 67',
      image:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Noida',
      tagline: 'Sector 150 · Expressway corridors',
      image:
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Delhi',
      tagline: 'South Delhi · Dwarka · Rohini',
      image:
        'https://images.unsplash.com/photo-1582407947309-97d4cc461a70?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Faridabad',
      tagline: 'Neharpar · Sector 75–89',
      image:
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  readonly types: TypeSpot[] = [
    {
      type: 'APARTMENT',
      label: 'Apartments',
      image:
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
    },
    {
      type: 'VILLA',
      label: 'Villas',
      image:
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1000&q=80',
    },
    {
      type: 'INDEPENDENT_HOUSE',
      label: 'Independent houses',
      image:
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1000&q=80',
    },
    {
      type: 'PLOT',
      label: 'Plots',
      image:
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80',
    },
  ];

  readonly steps = [
    {
      title: 'Documents checked',
      text: 'Ownership, sale deed, encumbrance and tax records reviewed by legal experts.',
    },
    {
      title: 'Physical inspection',
      text: 'On-ground visit confirms layout, condition and what the papers claim.',
    },
    {
      title: 'Admin publish',
      text: 'Only after final approval does a listing go LIVE for buyers to browse.',
    },
  ];

  ngOnInit(): void {
    this.catalog.list({ page: 1, limit: 4 }).subscribe({
      next: (res) => {
        this.featured = res.data ?? [];
        this.featuredLoading = false;
      },
      error: () => {
        this.featured = [];
        this.featuredLoading = false;
      },
    });
  }

  search(): void {
    let maxPrice: number | null = null;
    if (this.budget === '50') maxPrice = 5000000;
    if (this.budget === '100') maxPrice = 10000000;
    if (this.budget === '200') maxPrice = 20000000;
    if (this.budget === '500') maxPrice = 50000000;

    void this.router.navigate(['/browse'], {
      queryParams: {
        city: this.city || null,
        propertyType: this.propertyType || null,
        maxPrice,
        page: 1,
      },
    });
  }

  browseCity(city: string): void {
    void this.router.navigate(['/browse'], { queryParams: { city, page: 1 } });
  }

  browseType(type: PropertyType): void {
    void this.router.navigate(['/browse'], {
      queryParams: { propertyType: type, page: 1 },
    });
  }

  priceOf(property: Property): number {
    return Number(property.askingPrice);
  }
}
