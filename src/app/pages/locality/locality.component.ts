import { Component, OnInit, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogService } from '../../core/api/catalog.service';
import { Property } from '../../core/models/property.model';
import { nearbyCategoryLabel } from '../../shared/property-features';
import { propertyCoverImage } from '../../shared/property-media';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

interface NearbyGroup {
  category: string;
  label: string;
  places: Array<{ name: string; distance: string }>;
}

@Component({
  selector: 'app-locality',
  imports: [RouterLink, InrCurrencyPipe],
  templateUrl: './locality.component.html',
  styleUrl: './locality.component.scss',
})
export class LocalityComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
  private readonly sanitizer = inject(DomSanitizer);

  city = '';
  locality = '';
  properties: Property[] = [];
  nearby: NearbyGroup[] = [];
  loading = true;
  error = '';
  mapUrl: SafeResourceUrl | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.city = params.get('city') ?? '';
      this.locality = params.get('locality') ?? '';
      this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://maps.google.com/maps?q=${encodeURIComponent(`${this.locality}, ${this.city}, India`)}&z=14&output=embed`,
      );
      this.load();
    });
  }

  private load(): void {
    this.loading = true;
    this.error = '';
    this.catalog.list({ city: this.city, locality: this.locality, limit: 24, page: 1 }).subscribe({
      next: (res) => {
        this.properties = res.data ?? [];
        this.nearby = this.groupNearby(this.properties);
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load this locality.';
        this.loading = false;
      },
    });
  }

  cover(property: Property): string {
    return propertyCoverImage(property);
  }

  priceLabel(property: Property): number {
    return Number(property.askingPrice);
  }

  private groupNearby(properties: Property[]): NearbyGroup[] {
    const groups = new Map<string, NearbyGroup>();
    for (const property of properties) {
      for (const place of property.nearbyPlaces ?? []) {
        if (!place?.name) continue;
        const category = place.category || 'OTHER';
        const group = groups.get(category) ?? {
          category,
          label: nearbyCategoryLabel(category),
          places: [],
        };
        if (!group.places.some((item) => item.name === place.name)) {
          group.places.push({ name: place.name, distance: place.distance });
        }
        groups.set(category, group);
      }
    }
    return [...groups.values()];
  }
}
