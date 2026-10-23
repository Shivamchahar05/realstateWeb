import { Location } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

type CityName = 'Gurgaon' | 'Noida' | 'Delhi' | 'Faridabad';
type Buyer = 'male' | 'female' | 'joint';

interface DutyLine {
  label: string;
  amount: number;
}

const CITIES: CityName[] = ['Gurgaon', 'Noida', 'Delhi', 'Faridabad'];

/** Urban 2026 rates. Duty is an estimate on the price entered, not the circle rate. */
const STAMP: Record<CityName, Record<Buyer, number>> = {
  Gurgaon: { male: 0.07, female: 0.05, joint: 0.06 },
  Faridabad: { male: 0.07, female: 0.05, joint: 0.06 },
  Delhi: { male: 0.06, female: 0.04, joint: 0.05 },
  Noida: { male: 0.07, female: 0.06, joint: 0.065 },
};

@Component({
  selector: 'app-stamp-duty',
  imports: [InrCurrencyPipe],
  templateUrl: './stamp-duty.component.html',
  styleUrls: ['./tools.scss', './stamp-duty.component.scss'],
})
export class StampDutyComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly cities = CITIES;
  readonly buyers: { id: Buyer; label: string }[] = [
    { id: 'male', label: 'Male' },
    { id: 'female', label: 'Female' },
    { id: 'joint', label: 'Joint' },
  ];
  readonly presets = [
    { label: '₹50 L', value: 5_000_000 },
    { label: '₹1 Cr', value: 10_000_000 },
    { label: '₹2 Cr', value: 20_000_000 },
    { label: '₹5 Cr', value: 50_000_000 },
  ];

  readonly city = signal<CityName>('Gurgaon');
  readonly buyer = signal<Buyer>('male');
  readonly price = signal(10_000_000);

  readonly result = computed(() => this.calculate(this.city(), this.buyer(), this.price()));

  ngOnInit(): void {
    this.seo.set({
      title: 'Stamp duty calculator',
      description:
        'Estimate stamp duty for a home in Gurgaon, Faridabad, Delhi or Noida. The figure is on the price you enter, not the circle rate.',
      path: '/stamp-duty',
    });
    const params = this.route.snapshot.queryParamMap;
    const city = this.asCity(params.get('city'));
    const price = Number(params.get('price'));
    if (city) this.city.set(city);
    if (Number.isFinite(price) && price >= 100_000) this.price.set(Math.round(price));
  }

  goBack(): void {
    const state = this.location.getState() as { navigationId?: number } | null;
    if ((state?.navigationId ?? 1) > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl('/');
  }

  setPrice(raw: string): void {
    const amount = Number(raw.replace(/[^\d.]/g, ''));
    this.price.set(Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0);
  }

  percent(rate: number): string {
    return `${Number((rate * 100).toFixed(1))}%`;
  }

  private asCity(value: string | null): CityName | null {
    if (!value) return null;
    const key = value.trim().toLowerCase();
    if (key === 'gurgaon' || key === 'gurugram') return 'Gurgaon';
    if (key === 'noida') return 'Noida';
    if (key === 'delhi' || key === 'new delhi') return 'Delhi';
    if (key === 'faridabad') return 'Faridabad';
    return null;
  }

  private calculate(city: CityName, buyer: Buyer, value: number) {
    const rate = STAMP[city][buyer];
    const stamp = Math.round(value * rate);
    const haryana = city === 'Gurgaon' || city === 'Faridabad';
    const rawRegistration = value * 0.01;
    const registration = haryana
      ? Math.round(Math.min(Math.max(rawRegistration, value > 0 ? 1000 : 0), 50_000))
      : Math.round(rawRegistration);
    const transfer = city === 'Delhi' && value > 2_500_000 ? Math.round(value * 0.01) : 0;
    const pasting = city === 'Delhi' && value > 0 ? 100 : 0;
    const lines: DutyLine[] = [
      { label: `Stamp duty (${this.percent(rate)})`, amount: stamp },
      {
        label: haryana && rawRegistration > 50_000 ? 'Registration (capped)' : 'Registration (1%)',
        amount: registration,
      },
    ];
    if (city === 'Delhi') {
      lines.push({
        label: value > 2_500_000 ? 'MCD transfer duty (1%)' : 'MCD transfer duty',
        amount: transfer,
      });
      lines.push({ label: 'Pasting charge', amount: pasting });
    }
    const total = lines.reduce((sum, line) => sum + line.amount, 0);
    const maleTotal = this.totalFor(city, 'male', value);
    return {
      lines,
      total,
      savings: maleTotal - total,
      state: haryana ? 'Haryana, urban' : city === 'Delhi' ? 'Delhi, MCD' : 'Uttar Pradesh',
    };
  }

  private totalFor(city: CityName, buyer: Buyer, value: number): number {
    return this.calculateLines(city, buyer, value);
  }

  private calculateLines(city: CityName, buyer: Buyer, value: number): number {
    const stamp = Math.round(value * STAMP[city][buyer]);
    const haryana = city === 'Gurgaon' || city === 'Faridabad';
    const rawRegistration = value * 0.01;
    const registration = haryana
      ? Math.round(Math.min(Math.max(rawRegistration, value > 0 ? 1000 : 0), 50_000))
      : Math.round(rawRegistration);
    const transfer = city === 'Delhi' && value > 2_500_000 ? Math.round(value * 0.01) : 0;
    const pasting = city === 'Delhi' && value > 0 ? 100 : 0;
    return stamp + registration + transfer + pasting;
  }
}
