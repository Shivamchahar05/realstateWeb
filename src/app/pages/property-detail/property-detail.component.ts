import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
import { BuyerLibraryService } from '../../core/services/buyer-library.service';
import { BlogCard, BlogService } from '../../core/services/blog.service';

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
  private readonly sanitizer = inject(DomSanitizer);
  readonly library = inject(BuyerLibraryService);
  private readonly blog = inject(BlogService);
  relatedGuide: BlogCard | null = null;
  similar: Property[] = [];
  similarReady = false;

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

  emiOpen = false;
  downPayment = 0;
  interestRate = 8.5;
  tenureYears = 20;
  actionNote = '';
  mapUrl: SafeResourceUrl | null = null;

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
        this.downPayment = Math.round(this.price() * 0.2);
        this.mapUrl = this.buildMapUrl(res.data);
        this.library.remember(res.data);
        this.loading = false;
        this.loadExistingRequest(id);
        this.loadRelatedGuide(res.data.city, res.data.locality);
        this.loadSimilar(res.data);
      },
      error: () => {
        this.error = 'This property is unavailable or no longer listed.';
        this.loading = false;
      },
    });
  }

  coverFor(property: Property): string {
    return propertyCoverImage(property);
  }

  homePrice(property: Property): number {
    if (
      property.propertyType === 'SOCIETY' &&
      property.estimatedMinPrice &&
      property.estimatedMaxPrice
    ) {
      return Math.round((Number(property.estimatedMinPrice) + Number(property.estimatedMaxPrice)) / 2);
    }
    return Number(property.askingPrice ?? 0);
  }

  private loadSimilar(property: Property): void {
    const price = this.homePrice(property);
    const band = price > 0 ? { minPrice: Math.round(price * 0.7), maxPrice: Math.round(price * 1.3) } : {};
    this.catalog.list({ city: property.city, limit: 12, page: 1, ...band }).subscribe({
      next: (res) => {
        const picked = this.pickSimilar(res.data ?? [], property);
        if (picked.length || price <= 0) {
          this.similar = picked;
          this.similarReady = true;
          return;
        }
        this.catalog.list({ city: property.city, limit: 12, page: 1 }).subscribe({
          next: (wide) => {
            this.similar = this.pickSimilar(wide.data ?? [], property);
            this.similarReady = true;
          },
          error: () => {
            this.similarReady = true;
          },
        });
      },
      error: () => {
        this.similarReady = true;
      },
    });
  }

  private pickSimilar(items: Property[], current: Property): Property[] {
    return items
      .filter((item) => item.id !== current.id)
      .sort((a, b) => {
        const local = Number(a.locality !== current.locality) - Number(b.locality !== current.locality);
        if (local !== 0) return local;
        return Number(a.propertyType !== current.propertyType) - Number(b.propertyType !== current.propertyType);
      })
      .slice(0, 4);
  }

  private loadRelatedGuide(city: string, locality: string): void {
    this.blog.related(city, locality).subscribe({
      next: (post) => {
        this.relatedGuide = post;
      },
      error: () => {
        this.relatedGuide = null;
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

  dutyBase(): number {
    const property = this.property;
    if (
      property?.propertyType === 'SOCIETY' &&
      property.estimatedMinPrice &&
      property.estimatedMaxPrice
    ) {
      return Math.round((Number(property.estimatedMinPrice) + Number(property.estimatedMaxPrice)) / 2);
    }
    return this.price();
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

  toggleSave(): void {
    if (!this.property) return;
    const result = this.library.toggleSave(this.property);
    if (result === 'login') {
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/properties/${this.property.id}` },
      });
      return;
    }
    this.actionNote = result === 'saved' ? 'Saved to your homes.' : 'Removed from saved homes.';
  }

  toggleCompare(): void {
    if (!this.property) return;
    const result = this.library.toggleCompare(this.property.id);
    if (result === 'full') {
      this.actionNote = 'You can compare up to 3 homes. Remove one to add this.';
      return;
    }
    this.actionNote = result === 'added' ? 'Added to compare.' : 'Removed from compare.';
  }

  emiPrincipal(): number {
    return Math.max(this.price() - Math.max(this.downPayment || 0, 0), 0);
  }

  monthlyEmi(): number {
    const principal = this.emiPrincipal();
    const months = Math.round((this.tenureYears || 0) * 12);
    if (principal <= 0 || months <= 0) return 0;
    const annual = this.interestRate || 0;
    if (annual <= 0) return principal / months;
    const monthlyRate = annual / 12 / 100;
    const growth = Math.pow(1 + monthlyRate, months);
    return (principal * monthlyRate * growth) / (growth - 1);
  }

  totalInterest(): number {
    const months = Math.round((this.tenureYears || 0) * 12);
    return Math.max(this.monthlyEmi() * months - this.emiPrincipal(), 0);
  }

  private buildMapUrl(property: Property): SafeResourceUrl {
    const lat = Number(property.latitude);
    const lng = Number(property.longitude);
    const query =
      Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0
        ? `${lat},${lng}`
        : `${property.locality}, ${property.city}, India`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`,
    );
  }
}
