import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { switchMap, of } from 'rxjs';
import {
  FURNISHING_STATUSES,
  PROPERTY_TYPES,
  PropertyMedia,
  PropertyType,
} from '../../../core/models/seller-property.model';
import { SellerPropertyService } from '../../../core/services/seller-property.service';
import { environment } from '../../../../environments/environment';

interface PendingMedia {
  file: File;
  previewUrl: string;
  kind: 'image' | 'video';
}

@Component({
  selector: 'app-seller-property-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './property-form.component.html',
  styleUrl: './property-form.component.scss',
})
export class PropertyFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly propertyService = inject(SellerPropertyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly propertyTypes = PROPERTY_TYPES;
  readonly furnishingStatuses = FURNISHING_STATUSES;

  propertyId: string | null = null;
  loading = false;
  loadingProperty = false;
  errorMessage = '';

  pendingMedia: PendingMedia[] = [];
  existingMedia: PropertyMedia[] = [];
  mediaError = '';
  removingMediaId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(5000)]],
    propertyType: ['APARTMENT' as PropertyType, Validators.required],
    city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    locality: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
    state: ['Haryana', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    pincode: ['', [Validators.pattern(/^\d{6}$/)]],
    bhk: [null as number | null],
    carpetAreaSqft: [null as number | null],
    builtUpAreaSqft: [null as number | null],
    floor: [null as number | null],
    totalFloors: [null as number | null],
    ageYears: [null as number | null],
    parkingSpaces: [null as number | null],
    furnishing: ['UNFURNISHED'],
    readyToMove: [true],
    askingPrice: [null as number | null, [Validators.required, Validators.min(1)]],
    estimatedMinPrice: [null as number | null],
    estimatedMaxPrice: [null as number | null],
  });

  get isEditMode(): boolean {
    return !!this.propertyId;
  }

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id');
    if (this.propertyId) {
      this.loadProperty(this.propertyId);
    }
  }

  onMediaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.mediaError = '';

    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) {
        this.mediaError = 'Only images (JPG/PNG/WEBP) or videos (MP4/WEBM) are allowed.';
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        this.mediaError = `"${file.name}" is larger than 50 MB.`;
        continue;
      }
      if (this.pendingMedia.length + this.existingMedia.length >= 20) {
        this.mediaError = 'Maximum 20 media files per property.';
        break;
      }

      this.pendingMedia = [
        ...this.pendingMedia,
        {
          file,
          previewUrl: URL.createObjectURL(file),
          kind: isVideo ? 'video' : 'image',
        },
      ];
    }

    input.value = '';
  }

  removePending(index: number): void {
    const item = this.pendingMedia[index];
    if (item) {
      URL.revokeObjectURL(item.previewUrl);
    }
    this.pendingMedia = this.pendingMedia.filter((_, i) => i !== index);
  }

  removeExisting(media: PropertyMedia): void {
    if (!this.propertyId || this.removingMediaId) return;
    const ok = window.confirm('Remove this photo/video?');
    if (!ok) return;

    this.removingMediaId = media.id;
    this.propertyService.deleteMedia(this.propertyId, media.id).subscribe({
      next: () => {
        this.existingMedia = this.existingMedia.filter((m) => m.id !== media.id);
        this.removingMediaId = null;
      },
      error: (err: HttpErrorResponse) => {
        this.mediaError = err.error?.error?.message ?? 'Could not remove media.';
        this.removingMediaId = null;
      },
    });
  }

  mediaHref(media: PropertyMedia): string {
    if (media.url.startsWith('http')) return media.url;
    return `${environment.assetsUrl}${media.url}`;
  }

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.mediaError = '';
    const payload = this.buildPayload();
    const files = this.pendingMedia.map((m) => m.file);

    const save$ = this.isEditMode
      ? this.propertyService.update(this.propertyId!, payload)
      : this.propertyService.create(payload);

    save$
      .pipe(
        switchMap((property) => {
          if (!files.length) {
            return of(property);
          }
          return this.propertyService.uploadMedia(property.id, files).pipe(
            switchMap(() => of(property)),
          );
        }),
      )
      .subscribe({
        next: (property) => {
          this.loading = false;
          this.pendingMedia.forEach((m) => URL.revokeObjectURL(m.previewUrl));
          this.pendingMedia = [];
          void this.router.navigate(['/seller/properties', property.id]);
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.errorMessage =
            err.error?.error?.message ?? 'Unable to save property or upload media.';
        },
      });
  }

  private loadProperty(id: string): void {
    this.loadingProperty = true;

    this.propertyService.get(id).subscribe({
      next: (property) => {
        this.form.patchValue({
          title: property.title,
          description: property.description ?? '',
          propertyType: property.propertyType,
          city: property.city,
          locality: property.locality,
          address: property.address,
          state: property.state,
          pincode: property.pincode ?? '',
          bhk: property.bhk,
          carpetAreaSqft: property.carpetAreaSqft,
          builtUpAreaSqft: property.builtUpAreaSqft,
          floor: property.floor,
          totalFloors: property.totalFloors,
          ageYears: property.ageYears,
          parkingSpaces: property.parkingSpaces,
          furnishing: property.furnishing ?? 'UNFURNISHED',
          readyToMove: property.readyToMove ?? true,
          askingPrice: property.askingPrice,
          estimatedMinPrice: property.estimatedMinPrice,
          estimatedMaxPrice: property.estimatedMaxPrice,
        });
        this.existingMedia = property.media ?? [];
        this.loadingProperty = false;

        this.propertyService.listMedia(id).subscribe({
          next: (media) => {
            this.existingMedia = media;
          },
        });
      },
      error: () => {
        this.loadingProperty = false;
        this.errorMessage = 'Property not found or unavailable for editing.';
      },
    });
  }

  private buildPayload() {
    const raw = this.form.getRawValue();
    return {
      title: raw.title.trim(),
      description: raw.description.trim() || undefined,
      propertyType: raw.propertyType,
      city: raw.city.trim(),
      locality: raw.locality.trim(),
      address: raw.address.trim(),
      state: raw.state.trim(),
      pincode: raw.pincode.trim() || undefined,
      bhk: raw.bhk ?? undefined,
      carpetAreaSqft: raw.carpetAreaSqft ?? undefined,
      builtUpAreaSqft: raw.builtUpAreaSqft ?? undefined,
      floor: raw.floor ?? undefined,
      totalFloors: raw.totalFloors ?? undefined,
      ageYears: raw.ageYears ?? undefined,
      parkingSpaces: raw.parkingSpaces ?? undefined,
      furnishing: raw.furnishing as (typeof FURNISHING_STATUSES)[number],
      readyToMove: raw.readyToMove,
      askingPrice: Number(raw.askingPrice),
      estimatedMinPrice: raw.estimatedMinPrice ?? undefined,
      estimatedMaxPrice: raw.estimatedMaxPrice ?? undefined,
    };
  }
}
