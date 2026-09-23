import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogService } from '../../core/api/catalog.service';
import { AuthService } from '../../core/auth/auth.service';
import { PROPERTY_TYPE_LABELS, Property, PropertyMedia } from '../../core/models/property.model';
import { PropertyRequest } from '../../core/models/property-request.model';
import { PropertyRequestService } from '../../core/services/property-request.service';
import {
  AMENITY_CATEGORIES,
  amenityMeta,
  furnishingLabel,
  nearbyCategoryLabel,
} from '../../shared/property-features';
import {
  isPhotoMedia,
  mediaAbsoluteUrl,
  propertyCoverImage,
} from '../../shared/property-media';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-property-detail',
  imports: [RouterLink, DatePipe, InrCurrencyPipe, FormsModule],
  templateUrl: './property-detail.component.html',
  styleUrl: './property-detail.component.scss',
})
export class PropertyDetailComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly requestsApi = inject(PropertyRequestService);

  readonly typeLabels = PROPERTY_TYPE_LABELS;
  readonly amenityFilters = AMENITY_CATEGORIES;

  property: Property | null = null;
  loading = true;
  error = '';
  activePhotoIndex = 0;
  showVideo = false;
  amenityFilter: string = 'ALL';
  amenitiesExpanded = false;

  requestMessage = '';
  existingRequest: PropertyRequest | null = null;
  requestLoading = false;
  requestSubmitting = false;
  requestError = '';
  requestSuccess = false;

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
        this.activePhotoIndex = 0;
        this.showVideo = false;
        this.loading = false;
        this.loadExistingRequest(id);
      },
      error: () => {
        this.error = 'This property is unavailable or no longer listed.';
        this.loading = false;
      },
    });
  }

  private loadExistingRequest(propertyId: string): void {
    if (!this.auth.isAuthenticated() || !this.auth.isBuyer()) {
      return;
    }
    this.requestLoading = true;
    this.requestsApi.getForProperty(propertyId).subscribe({
      next: (res) => {
        this.existingRequest = res.data;
        this.requestLoading = false;
      },
      error: () => {
        this.requestLoading = false;
      },
    });
  }

  isBuyer(): boolean {
    return this.auth.isBuyer();
  }

  isSeller(): boolean {
    return this.auth.isSeller();
  }

  isLoggedIn(): boolean {
    return this.auth.isAuthenticated();
  }

  alreadyRequested(): boolean {
    return !!this.existingRequest;
  }

  submitRequest(): void {
    if (!this.property) return;

    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/properties/${this.property.id}` },
      });
      return;
    }

    if (!this.auth.isBuyer()) {
      this.requestError = 'Only buyer accounts can request a property.';
      return;
    }

    this.requestSubmitting = true;
    this.requestError = '';
    this.requestsApi.create(this.property.id, this.requestMessage.trim() || undefined).subscribe({
      next: (res) => {
        this.existingRequest = res.data;
        this.requestSuccess = true;
        this.requestSubmitting = false;
        this.requestMessage = '';
      },
      error: (err) => {
        this.requestError =
          err?.error?.error?.message ||
          err?.error?.message ||
          'Could not submit request. Please try again.';
        this.requestSubmitting = false;
      },
    });
  }

  price(): number {
    return Number(this.property?.askingPrice ?? 0);
  }

  isVerified(): boolean {
    return this.property?.verificationStatus === 'VERIFIED';
  }

  statusLabel(): string {
    return (this.property?.verificationStatus ?? '—').replaceAll('_', ' ');
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

  heroSrc(): string {
    const photos = this.photos();
    if (photos.length) {
      return this.mediaSrc(photos[this.activePhotoIndex] ?? photos[0]!);
    }
    return this.coverImage();
  }

  selectPhoto(index: number): void {
    this.activePhotoIndex = index;
    this.showVideo = false;
  }

  openVideo(): void {
    if (this.videos().length) {
      this.showVideo = true;
    }
  }

  furnishingStatusLabel(value: string | undefined): string {
    if (!value) return '—';
    return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  areaLabel(value: string | number | null | undefined): string {
    if (value == null || value === '') return '—';
    return `${Number(value).toLocaleString('en-IN')} sq.ft`;
  }

  furnishings() {
    return (this.property?.furnishingsInventory ?? []).filter((i) => i?.key && i.qty > 0);
  }

  furnishingItemLabel(key: string): string {
    return furnishingLabel(key);
  }

  allAmenities(): Array<{ key: string; label: string; category: string }> {
    const result: Array<{ key: string; label: string; category: string }> = [];
    for (const key of this.property?.amenities ?? []) {
      const meta = amenityMeta(key);
      if (meta) {
        result.push({ key, label: meta.label, category: meta.category });
      }
    }
    return result;
  }

  filteredAmenities(): Array<{ key: string; label: string; category: string }> {
    const all = this.allAmenities();
    if (this.amenityFilter === 'ALL') return all;
    return all.filter((a) => a.category === this.amenityFilter);
  }

  visibleAmenities(): Array<{ key: string; label: string; category: string }> {
    const list = this.filteredAmenities();
    if (this.amenitiesExpanded || list.length <= 11) return list;
    return list.slice(0, 11);
  }

  hiddenAmenityCount(): number {
    const list = this.filteredAmenities();
    return Math.max(0, list.length - 11);
  }

  setAmenityFilter(key: string): void {
    this.amenityFilter = key;
    this.amenitiesExpanded = false;
  }

  nearbyPlaces() {
    return this.property?.nearbyPlaces ?? [];
  }

  nearbyLabel(category: string): string {
    return nearbyCategoryLabel(category);
  }
}
