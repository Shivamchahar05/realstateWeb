import { Location } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { CatalogService, CityInsight } from '../../core/api/catalog.service';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-price-insights',
  imports: [RouterLink, InrCurrencyPipe],
  templateUrl: './price-insights.component.html',
  styleUrls: ['./tools.scss', './price-insights.component.scss'],
})
export class PriceInsightsComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly cities = signal<CityInsight[]>([]);
  readonly selected = signal('Gurgaon');

  readonly active = computed(
    () => this.cities().find((city) => city.city === this.selected()) ?? null,
  );

  readonly peak = computed(() => {
    const values = this.cities()
      .map((city) => city.median ?? 0)
      .filter((value) => value > 0);
    return values.length ? Math.max(...values) : 0;
  });

  ngOnInit(): void {
    this.seo.set({
      title: 'Price insights for NCR homes',
      description:
        'Median asking prices for verified homes in Gurgaon, Noida, Delhi and Faridabad, from listings on Titlefolio.',
      path: '/price-insights',
    });
    this.catalog.priceInsights().subscribe({
      next: (result) => {
        this.cities.set(result.cities);
        const firstWithStock = result.cities.find((city) => city.count > 0);
        if (firstWithStock) this.selected.set(firstWithStock.city);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    const state = this.location.getState() as { navigationId?: number } | null;
    if ((state?.navigationId ?? 1) > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl('/');
  }

  barWidth(median: number | null): string {
    const peak = this.peak();
    if (!median || !peak) return '0%';
    return `${Math.max(8, Math.round((median / peak) * 100))}%`;
  }
}
