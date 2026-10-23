import { Location } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

type CityName = 'Gurgaon' | 'Noida' | 'Delhi' | 'Faridabad';

const CITIES: CityName[] = ['Gurgaon', 'Noida', 'Delhi', 'Faridabad'];

@Component({
  selector: 'app-affordability',
  imports: [InrCurrencyPipe, RouterLink],
  templateUrl: './affordability.component.html',
  styleUrls: ['./tools.scss', './stamp-duty.component.scss', './affordability.component.scss'],
})
export class AffordabilityComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly cities = CITIES;
  readonly incomePresets = [
    { label: '₹50k', value: 50_000 },
    { label: '₹1 L', value: 100_000 },
    { label: '₹1.5 L', value: 150_000 },
    { label: '₹3 L', value: 300_000 },
  ];

  readonly city = signal<CityName>('Gurgaon');
  readonly income = signal(150_000);
  readonly otherEmi = signal(0);
  readonly downPayment = signal(2_000_000);
  readonly rate = signal(8.5);
  readonly years = signal(20);
  readonly targetPrice = signal(0);

  readonly result = computed(() => this.calculate());

  ngOnInit(): void {
    this.seo.set({
      title: 'Home affordability calculator',
      description:
        'See the home price a monthly income can support in NCR, including EMI, down payment and other loans.',
      path: '/affordability',
    });
    const params = this.route.snapshot.queryParamMap;
    const city = this.asCity(params.get('city'));
    const income = Number(params.get('income'));
    const downRaw = params.get('down');
    const price = Number(params.get('price'));
    if (city) this.city.set(city);
    if (params.has('income') && Number.isFinite(income) && income >= 10_000) {
      this.income.set(Math.round(income));
    }
    if (downRaw != null && Number.isFinite(Number(downRaw)) && Number(downRaw) >= 0) {
      this.downPayment.set(Math.round(Number(downRaw)));
    }
    if (params.has('price') && Number.isFinite(price) && price >= 100_000) {
      this.targetPrice.set(Math.round(price));
    }
  }

  goBack(): void {
    const state = this.location.getState() as { navigationId?: number } | null;
    if ((state?.navigationId ?? 1) > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl('/');
  }

  setAmount(target: 'income' | 'otherEmi' | 'downPayment', raw: string): void {
    const amount = Number(raw.replace(/[^\d.]/g, ''));
    const value = Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0;
    if (target === 'income') this.income.set(value);
    else if (target === 'otherEmi') this.otherEmi.set(value);
    else this.downPayment.set(value);
  }

  setRate(raw: string): void {
    const value = Number(raw);
    this.rate.set(Number.isFinite(value) && value >= 0 ? value : 0);
  }

  setYears(raw: string): void {
    const value = Number(raw);
    this.years.set(Number.isFinite(value) ? Math.min(30, Math.max(1, Math.round(value))) : 20);
  }

  private calculate(): {
    emi: number;
    loan: number;
    budget: number;
    gap: number;
  } {
    const spare = Math.max(this.income() - Math.max(this.otherEmi(), 0), 0);
    const emi = Math.round(spare * 0.5);
    const months = Math.max(this.years(), 1) * 12;
    const annual = Math.max(this.rate(), 0);
    let loan = 0;
    if (emi > 0 && months > 0) {
      if (annual <= 0) {
        loan = emi * months;
      } else {
        const monthlyRate = annual / 12 / 100;
        const growth = Math.pow(1 + monthlyRate, months);
        loan = (emi * (growth - 1)) / (monthlyRate * growth);
      }
    }
    loan = Math.round(loan);
    const budget = loan + Math.max(this.downPayment(), 0);
    const target = this.targetPrice();
    return { emi, loan, budget, gap: target > 0 ? target - budget : 0 };
  }

  private asCity(value: string | null): CityName | null {
    if (!value) return null;
    const match = CITIES.find((city) => city.toLowerCase() === value.trim().toLowerCase());
    return match ?? null;
  }
}
