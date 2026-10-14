import { Injectable, effect, inject, signal } from '@angular/core';
import { catchError, map, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Property, PropertyMedia } from '../models/property.model';
import { ApiService } from './api.service';

export interface LibraryItem {
  id: string;
  title: string;
  locality: string;
  city: string;
  askingPrice: number;
  propertyType: string;
  trustScore: number | null;
  bhk: number | null;
  media?: PropertyMedia[];
}

const RECENT_KEY = 'vp_recent_homes';
const COMPARE_KEY = 'vp_compare_ids';
const MAX_RECENT = 8;
const MAX_COMPARE = 3;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function clearLegacySaved(): void {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('vp_saved_homes_')) {
      localStorage.removeItem(key);
    }
  }
}

export function libraryItemFrom(property: Property): LibraryItem {
  return {
    id: property.id,
    title: property.title,
    locality: property.locality,
    city: property.city,
    askingPrice: Number(property.askingPrice) || 0,
    propertyType: property.propertyType,
    trustScore: property.trustScore ?? null,
    bhk: property.bhk ?? null,
  };
}

@Injectable({ providedIn: 'root' })
export class BuyerLibraryService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  /** Property ids saved for the signed-in user. Loaded from the API. */
  readonly savedIds = signal<string[]>([]);
  readonly recent = signal<LibraryItem[]>(read(RECENT_KEY, []));
  readonly compareIds = signal<string[]>(read(COMPARE_KEY, []).slice(0, MAX_COMPARE));

  constructor() {
    clearLegacySaved();
    effect((onCleanup) => {
      const userId = this.auth.currentUser()?.id;
      if (!userId) {
        this.savedIds.set([]);
        return;
      }
      const sub = this.api.get<string[]>('/saved-properties/ids').subscribe({
        next: (ids) => this.savedIds.set(ids),
        error: () => this.savedIds.set([]),
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  isSaved(id: string): boolean {
    return this.savedIds().includes(id);
  }

  isCompared(id: string): boolean {
    return this.compareIds().includes(id);
  }

  listSaved(page: number, limit: number) {
    return this.api.getWithMeta<LibraryItem[]>('/saved-properties', { page, limit }).pipe(
      map(({ data, meta }) => ({
        items: (data ?? []).map((item) => ({
          ...item,
          askingPrice: Number(item.askingPrice) || 0,
        })),
        total: meta?.total ?? data?.length ?? 0,
        page: meta?.page ?? page,
        limit: meta?.limit ?? limit,
      })),
    );
  }

  /** Returns login when the visitor is signed out. */
  toggleSave(property: Property): 'saved' | 'removed' | 'login' {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return 'login';

    if (this.isSaved(property.id)) {
      const previous = this.savedIds();
      this.savedIds.set(previous.filter((id) => id !== property.id));
      this.api.delete(`/saved-properties/${property.id}`).subscribe({
        error: () => this.savedIds.set(previous),
      });
      return 'removed';
    }

    const previous = this.savedIds();
    this.savedIds.set([property.id, ...previous.filter((id) => id !== property.id)]);
    this.api.post('/saved-properties', { propertyId: property.id }).subscribe({
      error: () => this.savedIds.set(previous),
    });
    return 'saved';
  }

  removeSaved(id: string) {
    const previous = this.savedIds();
    this.savedIds.set(previous.filter((entry) => entry !== id));
    return this.api.delete<{ saved: boolean }>(`/saved-properties/${id}`).pipe(
      map(() => undefined),
      catchError((error) => {
        this.savedIds.set(previous);
        return throwError(() => error);
      }),
    );
  }

  remember(property: Property): void {
    const item = libraryItemFrom(property);
    const next = [item, ...this.recent().filter((entry) => entry.id !== item.id)].slice(0, MAX_RECENT);
    this.recent.set(next);
    write(RECENT_KEY, next);
  }

  toggleCompare(id: string): 'added' | 'removed' | 'full' {
    if (this.compareIds().includes(id)) {
      this.setCompare(this.compareIds().filter((entry) => entry !== id));
      return 'removed';
    }
    if (this.compareIds().length >= MAX_COMPARE) return 'full';
    this.setCompare([...this.compareIds(), id]);
    return 'added';
  }

  clearCompare(): void {
    this.setCompare([]);
  }

  private setCompare(ids: string[]): void {
    this.compareIds.set(ids);
    write(COMPARE_KEY, ids);
  }
}
