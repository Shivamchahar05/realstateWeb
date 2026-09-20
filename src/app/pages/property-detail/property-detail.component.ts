import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogService } from '../../core/api/catalog.service';
import { PROPERTY_TYPE_LABELS, Property, PropertyMedia } from '../../core/models/property.model';
import {
  isPhotoMedia,
  mediaAbsoluteUrl,
  propertyCoverImage,
} from '../../shared/property-media';

@Component({
  selector: 'app-property-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './property-detail.component.html',
  styleUrl: './property-detail.component.scss',
})
export class PropertyDetailComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);

  readonly typeLabels = PROPERTY_TYPE_LABELS;

  property: Property | null = null;
  loading = true;
  error = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Property not found.';
      this.loading = false;
      return;
    }

    this.catalog.getById(id).subscribe({
      next: (res) => {
        this.property = res.data;
        this.loading = false;
      },
      error: () => {
        this.error = 'This property is unavailable or no longer listed.';
        this.loading = false;
      },
    });
  }

  price(): number {
    return Number(this.property?.askingPrice ?? 0);
  }

  isVerified(): boolean {
    return this.property?.verificationStatus === 'VERIFIED';
  }

  coverImage(): string {
    return this.property ? propertyCoverImage(this.property) : '';
  }

  photos(): PropertyMedia[] {
    return (this.property?.media ?? []).filter((m) => isPhotoMedia(m));
  }

  videos(): PropertyMedia[] {
    return (this.property?.media ?? []).filter(
      (m) => (m.type || m.mediaType || '').toUpperCase() === 'VIDEO',
    );
  }

  mediaSrc(item: PropertyMedia): string {
    return mediaAbsoluteUrl(item.url);
  }
}
