import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PropertyRequestService } from '../../core/services/property-request.service';
import { PropertyRequest, propertyRequestStatusLabel } from '../../core/models/property-request.model';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-my-requests',
  imports: [RouterLink, DatePipe, InrCurrencyPipe],
  templateUrl: './my-requests.component.html',
  styleUrl: './my-requests.component.scss',
})
export class MyRequestsComponent implements OnInit {
  private readonly requestsApi = inject(PropertyRequestService);

  loading = true;
  error = '';
  items: PropertyRequest[] = [];

  ngOnInit(): void {
    this.requestsApi.listMine().subscribe({
      next: (res) => {
        this.items = res.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load your requests.';
        this.loading = false;
      },
    });
  }

  statusLabel(status: string): string {
    return propertyRequestStatusLabel(status);
  }

  priceOf(value: string | number | undefined): number {
    return Number(value ?? 0);
  }
}
