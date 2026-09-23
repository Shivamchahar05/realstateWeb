import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PropertyRequest } from '../models/property-request.model';

@Injectable({ providedIn: 'root' })
export class PropertyRequestService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/property-requests`;

  create(propertyId: string, message?: string): Observable<ApiResponse<PropertyRequest>> {
    return this.http.post<ApiResponse<PropertyRequest>>(this.baseUrl, {
      propertyId,
      message: message || undefined,
    });
  }

  listMine(page = 1, limit = 20): Observable<ApiResponse<PropertyRequest[]>> {
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.http.get<ApiResponse<PropertyRequest[]>>(`${this.baseUrl}/mine`, { params });
  }

  getForProperty(propertyId: string): Observable<ApiResponse<PropertyRequest | null>> {
    return this.http.get<ApiResponse<PropertyRequest | null>>(
      `${this.baseUrl}/for-property/${propertyId}`,
    );
  }

  listForSellerProperty(propertyId: string): Observable<ApiResponse<PropertyRequest[]>> {
    return this.http.get<ApiResponse<PropertyRequest[]>>(
      `${environment.apiUrl}/seller/properties/${propertyId}/requests`,
    );
  }
}
