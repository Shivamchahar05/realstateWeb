import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import {
  DOCUMENT_CATEGORIES,
  Property,
  PropertyDocument,
  VerificationHistoryEntry,
} from '../../../core/models/seller-property.model';
import { SellerPropertyService } from '../../../core/services/seller-property.service';
import { PropertyRequestService } from '../../../core/services/property-request.service';
import { PropertyRequest } from '../../../core/models/property-request.model';
import { InrCurrencyPipe } from '../../../shared/pipes/inr-currency.pipe';
import { environment } from '../../../../environments/environment';

const SUBMITTABLE = ['DRAFT', 'REVIEW_REQUIRED', 'REJECTED'] as const;
const UPLOADABLE = [
  'DRAFT',
  'REVIEW_REQUIRED',
  'REJECTED',
  'DOCUMENT_COLLECTION',
  'LEGAL_REVIEW',
  'SUBMITTED',
] as const;

@Component({
  selector: 'app-seller-property-detail',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, InrCurrencyPipe],
  templateUrl: './property-detail.component.html',
  styleUrl: './property-detail.component.scss',
})
export class PropertyDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly propertyService = inject(SellerPropertyService);
  private readonly requestService = inject(PropertyRequestService);

  readonly documentCategories = DOCUMENT_CATEGORIES;

  property: Property | null = null;
  documents: PropertyDocument[] = [];
  timeline: VerificationHistoryEntry[] = [];
  buyerRequests: PropertyRequest[] = [];
  loading = true;
  uploading = false;
  submitting = false;
  errorMessage = '';
  uploadError = '';
  submitError = '';
  submitSuccess = '';
  selectedFile: File | null = null;
  removingId: string | null = null;
  removeError = '';
  replacingId: string | null = null;
  replaceError = '';
  replaceFile: File | null = null;

  readonly uploadForm = this.fb.nonNullable.group({
    category: ['OWNERSHIP', Validators.required],
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    notes: ['', [Validators.maxLength(2000)]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadProperty(id);
  }

  loadProperty(id: string): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      property: this.propertyService.get(id),
      documents: this.propertyService.listDocuments(id),
      requests: this.requestService.listForSellerProperty(id),
    }).subscribe({
      next: ({ property, documents, requests }) => {
        this.property = property;
        this.documents = documents;
        this.buyerRequests = requests.data ?? [];
        this.timeline = [...(property.verificationHistory ?? [])].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load property details.';
        this.loading = false;
      },
    });
  }

  reloadDocuments(): void {
    if (!this.property) return;
    this.propertyService.listDocuments(this.property.id).subscribe({
      next: (documents) => {
        this.documents = documents;
      },
    });
  }

  canRemoveDocument(doc: PropertyDocument): boolean {
    return doc.status !== 'VERIFIED' && doc.status !== 'MISSING';
  }

  needsReupload(doc: PropertyDocument): boolean {
    return (
      this.canUploadDocuments &&
      (doc.status === 'REJECTED' || doc.status === 'MISSING' || doc.status === 'PENDING')
    );
  }

  actionDocs(): PropertyDocument[] {
    return this.documents.filter((d) => d.status === 'REJECTED' || d.status === 'MISSING');
  }

  startReplace(doc: PropertyDocument): void {
    this.replacingId = doc.id;
    this.replaceFile = null;
    this.replaceError = '';
  }

  cancelReplace(): void {
    this.replacingId = null;
    this.replaceFile = null;
    this.replaceError = '';
  }

  onReplaceFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.replaceFile = input.files?.[0] ?? null;
  }

  replaceDocument(doc: PropertyDocument): void {
    if (!this.property || !this.replaceFile || this.uploading) return;

    this.uploading = true;
    this.replaceError = '';

    this.propertyService.replaceDocument(this.property.id, doc.id, this.replaceFile).subscribe({
      next: () => {
        this.uploading = false;
        this.cancelReplace();
        this.reloadDocuments();
        this.propertyService.get(this.property!.id).subscribe({
          next: (property) => {
            this.property = property;
            this.timeline = [...(property.verificationHistory ?? [])].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.replaceError = err.error?.error?.message ?? 'Could not upload replacement.';
        this.uploading = false;
      },
    });
  }

  removeDocument(doc: PropertyDocument): void {
    if (!this.property || !this.canRemoveDocument(doc) || this.removingId) {
      return;
    }

    const ok = window.confirm(`Remove “${doc.title}”? This cannot be undone.`);
    if (!ok) return;

    this.removingId = doc.id;
    this.removeError = '';

    this.propertyService.deleteDocument(this.property.id, doc.id).subscribe({
      next: () => {
        this.removingId = null;
        this.reloadDocuments();
      },
      error: (err: HttpErrorResponse) => {
        this.removeError = err.error?.error?.message ?? 'Could not remove document.';
        this.removingId = null;
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  uploadDocument(): void {
    if (!this.property || this.uploadForm.invalid || !this.selectedFile || this.uploading) {
      this.uploadForm.markAllAsTouched();
      return;
    }

    this.uploading = true;
    this.uploadError = '';
    const { category, title, notes } = this.uploadForm.getRawValue();

    this.propertyService
      .uploadDocument(this.property.id, this.selectedFile, category, title.trim(), notes.trim() || undefined)
      .subscribe({
        next: () => {
          this.uploadForm.reset({ category: 'OWNERSHIP', title: '', notes: '' });
          this.selectedFile = null;
          this.uploading = false;
          this.reloadDocuments();
        },
        error: (err: HttpErrorResponse) => {
          this.uploadError = err.error?.error?.message ?? 'Document upload failed.';
          this.uploading = false;
        },
      });
  }

  submitForVerification(): void {
    if (!this.property || this.submitting) return;
    this.submitting = true;
    this.submitError = '';
    this.submitSuccess = '';

    this.propertyService.submit(this.property.id).subscribe({
      next: (property) => {
        this.property = property;
        this.timeline = [...(property.verificationHistory ?? [])].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        this.submitting = false;
        this.submitSuccess = 'Submitted for legal review.';
        this.reloadDocuments();
      },
      error: (err: HttpErrorResponse) => {
        this.submitError = err.error?.error?.message ?? 'Submission failed.';
        this.submitting = false;
      },
    });
  }

  fileHref(doc: PropertyDocument): string {
    if (!doc.fileUrl || (doc.fileSize ?? doc.fileSizeBytes ?? 0) === 0) return '#';
    if (doc.fileUrl.startsWith('http')) return doc.fileUrl;
    return `${environment.assetsUrl}${doc.fileUrl}`;
  }

  hasFile(doc: PropertyDocument): boolean {
    return (doc.fileSize ?? doc.fileSizeBytes ?? 0) > 0 && !!doc.fileUrl;
  }

  fileSizeLabel(doc: PropertyDocument): string {
    const bytes = doc.fileSize ?? doc.fileSizeBytes ?? 0;
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  get canUploadDocuments(): boolean {
    return (
      !!this.property &&
      UPLOADABLE.includes(this.property.verificationStatus as (typeof UPLOADABLE)[number])
    );
  }

  get canSubmit(): boolean {
    return (
      !!this.property &&
      SUBMITTABLE.includes(this.property.verificationStatus as (typeof SUBMITTABLE)[number]) &&
      this.documents.some((d) => d.status === 'PENDING' || d.status === 'VERIFIED')
    );
  }

  get canEdit(): boolean {
    return (
      !!this.property &&
      SUBMITTABLE.includes(this.property.verificationStatus as (typeof SUBMITTABLE)[number])
    );
  }

  formatStatus(value: string): string {
    return value.replaceAll('_', ' ');
  }
}
