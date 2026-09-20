import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Property, PropertyFilters } from '../models/property.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/catalog/properties`;

  list(filters: PropertyFilters = {}): Observable<ApiResponse<Property[]>> {
    let params = new HttpParams();

    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    if (filters.city) params = params.set('city', filters.city);
    if (filters.locality) params = params.set('locality', filters.locality);
    if (filters.propertyType) params = params.set('propertyType', filters.propertyType);
    if (filters.minPrice != null) params = params.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice != null) params = params.set('maxPrice', String(filters.maxPrice));
    if (filters.search) params = params.set('search', filters.search);

    return this.http.get<ApiResponse<Property[]>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<ApiResponse<Property>> {
    return this.http.get<ApiResponse<Property>>(`${this.baseUrl}/${id}`);
  }
}
