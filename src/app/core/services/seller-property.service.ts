import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { PaginatedMeta } from '../models/api.model';
import {
  CreatePropertyRequest,
  Property,
  PropertyDocument,
  PropertyListParams,
  PropertyMedia,
  UpdatePropertyRequest,
} from '../models/seller-property.model';

@Injectable({ providedIn: 'root' })
export class SellerPropertyService {
  private readonly api = inject(ApiService);

  list(params: PropertyListParams = {}): Observable<{ items: Property[]; meta: PaginatedMeta }> {
    return this.api
      .getWithMeta<Property[]>('/seller/properties', {
        page: params.page,
        limit: params.limit,
        search: params.search,
      })
      .pipe(
        map(({ data, meta }) => ({
          items: data,
          meta: {
            total: meta?.total ?? data.length,
            page: meta?.page ?? params.page ?? 1,
            limit: meta?.limit ?? params.limit ?? 10,
          },
        })),
      );
  }

  get(id: string): Observable<Property> {
    return this.api.get<Property>(`/seller/properties/${id}`);
  }

  create(payload: CreatePropertyRequest): Observable<Property> {
    return this.api.post<Property>('/seller/properties', payload);
  }

  update(id: string, payload: UpdatePropertyRequest): Observable<Property> {
    return this.api.patch<Property>(`/seller/properties/${id}`, payload);
  }

  submit(id: string): Observable<Property> {
    return this.api.post<Property>(`/seller/properties/${id}/submit`, {});
  }

  listDocuments(id: string): Observable<PropertyDocument[]> {
    return this.api.get<PropertyDocument[]>(`/seller/properties/${id}/documents`);
  }

  uploadDocument(
    id: string,
    file: File,
    category: string,
    title: string,
    notes?: string,
  ): Observable<PropertyDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('title', title);
    if (notes) {
      formData.append('notes', notes);
    }
    return this.api.upload<PropertyDocument>(`/seller/properties/${id}/documents`, formData);
  }

  deleteDocument(propertyId: string, documentId: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(
      `/seller/properties/${propertyId}/documents/${documentId}`,
    );
  }

  replaceDocument(
    propertyId: string,
    documentId: string,
    file: File,
  ): Observable<PropertyDocument> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.upload<PropertyDocument>(
      `/seller/properties/${propertyId}/documents/${documentId}/replace`,
      formData,
    );
  }

  listMedia(id: string): Observable<PropertyMedia[]> {
    return this.api.get<PropertyMedia[]>(`/seller/properties/${id}/media`);
  }

  uploadMedia(id: string, files: File[], caption?: string): Observable<PropertyMedia[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (caption) {
      formData.append('caption', caption);
    }
    return this.api.upload<PropertyMedia[]>(`/seller/properties/${id}/media`, formData);
  }

  deleteMedia(propertyId: string, mediaId: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(
      `/seller/properties/${propertyId}/media/${mediaId}`,
    );
  }
}
