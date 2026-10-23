import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { ApiService } from '../../core/services/api.service';

type InfoPageId = 'about' | 'contact' | 'privacy' | 'terms';

interface InfoSection {
  heading: string;
  paragraphs: string[];
}

interface InfoPage {
  eyebrow: string;
  title: string;
  lead: string;
  sections: InfoSection[];
}

const PAGES: Record<InfoPageId, InfoPage> = {
  about: {
    eyebrow: 'Company',
    title: 'About Titlefolio',
    lead: 'Titlefolio lists verified homes for buyers and sellers across NCR.',
    sections: [
      {
        heading: 'What gets published',
        paragraphs: [
          'A home in Gurgaon, Noida, Delhi or Faridabad goes live after the documents are reviewed and a site inspection is on the listing.',
          'The verified mark means those checks are finished. It is not a title guarantee, and a buyer should still use their own lawyer before paying.',
        ],
      },
      {
        heading: 'For buyers and sellers',
        paragraphs: [
          'Buyers can search by city, type and budget, save homes, compare up to three, and estimate EMI on the property page.',
          'Sellers submit a listing from their account. Staff move it through documents, inspection and publish.',
        ],
      },
      {
        heading: 'Guides and news',
        paragraphs: [
          'Buying guides and locality notes are written for this site. The News category is a short summary from ET Realty, with a link to the full story.',
        ],
      },
    ],
  },
  privacy: {
    eyebrow: 'Legal',
    title: 'Privacy',
    lead: 'What Titlefolio stores, and what we use it for. Last updated 14 October 2026.',
    sections: [
      {
        heading: 'Account and listing details',
        paragraphs: [
          'Creating an account stores your name, email, phone and role. A seller listing stores the property details, photos and documents you upload.',
          'Saved homes, compare choices on this browser, and buyer requests are kept so you can come back to them.',
        ],
      },
      {
        heading: 'How it is used',
        paragraphs: [
          'We use this information to sign you in, show your saved homes and requests, and let staff review a listing or reply to a message you send.',
          'We do not sell account or listing information.',
        ],
      },
      {
        heading: 'Contact notes and news',
        paragraphs: [
          'The Contact form stores your name, email, an optional phone number, and the message, so staff can read it.',
          'News pages store a headline, a short summary and the source link. They are not tied to your account.',
        ],
      },
      {
        heading: 'Removing your information',
        paragraphs: [
          'Use the Contact page and ask us to delete your account. We remove the account and the saved homes tied to it. A published listing can stay until that record is no longer needed for the sale.',
        ],
      },
    ],
  },
  terms: {
    eyebrow: 'Legal',
    title: 'Terms',
    lead: 'The rules for using Titlefolio. Last updated 14 October 2026.',
    sections: [
      {
        heading: 'Using the site',
        paragraphs: [
          'Use Titlefolio to look for a home, save listings, or submit a property you are allowed to sell.',
          'Do not post a listing you do not control, or a price, photo or document set you know is false.',
        ],
      },
      {
        heading: 'Verification',
        paragraphs: [
          'A verified home has been through the document review and inspection shown on that page.',
          'That review is not a title guarantee. Before you pay, complete your own legal check.',
        ],
      },
      {
        heading: 'News and accounts',
        paragraphs: [
          'News posts are summaries. The full story stays with the source linked on the page.',
          'Keep your login to yourself. You can sign out from any page. Staff accounts are only for the operations console.',
        ],
      },
    ],
  },
  contact: {
    eyebrow: 'Company',
    title: 'Contact',
    lead: 'Questions about a listing, a seller account, or your own data. Staff read every note.',
    sections: [
      {
        heading: 'Where we work',
        paragraphs: ['Gurgaon, Noida, Delhi and Faridabad.'],
      },
    ],
  },
};

@Component({
  selector: 'app-info-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './info-page.component.html',
  styleUrl: './info-page.component.scss',
})
export class InfoPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly page = signal<InfoPageId>('about');
  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly error = signal<string | null>(null);
  readonly topics = ['Buying', 'Selling', 'Other'] as const;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    topic: ['Buying' as 'Buying' | 'Selling' | 'Other', Validators.required],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
  });

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      const id = (data['page'] as InfoPageId) || 'about';
      this.page.set(id);
      this.sent.set(false);
      this.error.set(null);
      const content = PAGES[id];
      this.seo.set({
        title: content.title,
        description: content.lead,
        path: `/${id === 'about' ? 'about' : id}`,
      });
    });
  }

  content(): InfoPage {
    return PAGES[this.page()];
  }

  submit(): void {
    if (this.form.invalid || this.sending()) {
      this.form.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();
    this.api
      .post<{ id: string }>('/contact', {
        name: raw.name.trim(),
        email: raw.email.trim(),
        phone: raw.phone.trim(),
        topic: raw.topic,
        message: raw.message.trim(),
      })
      .subscribe({
        next: () => {
          this.sending.set(false);
          this.sent.set(true);
          this.form.reset({ name: '', email: '', phone: '', topic: 'Buying', message: '' });
        },
        error: (err) => {
          this.sending.set(false);
          this.error.set(err?.error?.error?.message ?? 'Could not send your message. Try again.');
        },
      });
  }
}
