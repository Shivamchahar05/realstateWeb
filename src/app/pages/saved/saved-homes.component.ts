import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Property, PropertyType } from '../../core/models/property.model';
import { BuyerLibraryService, LibraryItem } from '../../core/services/buyer-library.service';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { propertyCoverImage } from '../../shared/property-media';

@Component({
  selector: 'app-saved-homes',
  imports: [RouterLink, InrCurrencyPipe],
  templateUrl: './saved-homes.component.html',
  styleUrl: './saved-homes.component.scss',
})
export class SavedHomesComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly library = inject(BuyerLibraryService);

  readonly pageSize = 6;
  page = 1;
  readonly items = signal<LibraryItem[]>([]);
  readonly totalCount = signal(0);
  readonly loading = signal(true);

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const requested = Number(params.get('page') ?? 1);
      this.page = Number.isFinite(requested) && requested > 0 ? Math.floor(requested) : 1;
      this.load();
    });
  }

  total(): number {
    return this.totalCount();
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.pageSize));
  }

  pageItems(): LibraryItem[] {
    return this.items();
  }

  cover(home: LibraryItem): string {
    return propertyCoverImage({
      propertyType: home.propertyType as PropertyType,
      media: home.media ?? [],
    } as Property);
  }

  remove(id: string): void {
    this.library.removeSaved(id).subscribe({
      next: () => this.load(),
    });
  }

  goToPage(page: number): void {
    void this.router.navigate(['/saved'], { queryParams: { page } });
  }

  private load(): void {
    this.loading.set(true);
    this.library.listSaved(this.page, this.pageSize).subscribe({
      next: (result) => {
        const pages = Math.max(1, Math.ceil(result.total / this.pageSize));
        if (result.total > 0 && this.page > pages) {
          this.goToPage(pages);
          return;
        }
        this.items.set(result.items);
        this.totalCount.set(result.total);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.totalCount.set(0);
        this.loading.set(false);
      },
    });
  }
}
