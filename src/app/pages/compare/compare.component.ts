import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CatalogService } from '../../core/api/catalog.service';
import { PROPERTY_TYPE_LABELS, Property } from '../../core/models/property.model';
import { BuyerLibraryService } from '../../core/services/buyer-library.service';
import { amenityMeta } from '../../shared/property-features';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-compare',
  imports: [RouterLink, InrCurrencyPipe],
  templateUrl: './compare.component.html',
  styleUrl: './compare.component.scss',
})
export class CompareComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  readonly library = inject(BuyerLibraryService);

  properties: Property[] = [];
  loading = true;

  ngOnInit(): void {
    const ids = this.library.compareIds();
    if (!ids.length) {
      this.loading = false;
      return;
    }
    forkJoin(
      ids.map((id) =>
        this.catalog.getById(id).pipe(catchError(() => of(null))),
      ),
    ).subscribe((results) => {
      this.properties = results.flatMap((res) => (res?.data ? [res.data] : []));
      this.loading = false;
    });
  }

  remove(id: string): void {
    this.library.toggleCompare(id);
    this.properties = this.properties.filter((property) => property.id !== id);
  }

  typeLabel(property: Property): string {
    return PROPERTY_TYPE_LABELS[property.propertyType] ?? property.propertyType;
  }

  area(property: Property): string {
    const value = property.carpetAreaSqft ?? property.builtUpAreaSqft;
    if (value == null) return '—';
    return `${Number(value).toLocaleString('en-IN')} sq.ft`;
  }

  config(property: Property): string {
    if (property.propertyType === 'SOCIETY' && property.bhkConfigurations?.length) {
      return `${property.bhkConfigurations.join(', ')} BHK`;
    }
    return property.bhk ? `${property.bhk} BHK` : '—';
  }

  amenities(property: Property): string {
    const labels = (property.amenities ?? [])
      .map((key) => amenityMeta(key)?.label)
      .filter((label) => !!label);
    return labels.length ? labels.join(', ') : '—';
  }

  trust(property: Property): string {
    return property.trustScore != null ? `${property.trustScore}/100` : '—';
  }
}
