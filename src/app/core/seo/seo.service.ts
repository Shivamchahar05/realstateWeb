import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface PageSeo {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  type?: 'website' | 'article';
  index?: boolean;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> | null;
}

const BRAND = 'Titlefolio';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  origin(): string {
    return this.document.location?.origin ?? '';
  }

  /** Account, seller, and sign-in screens should not appear in search results. */
  privatePage(title: string, description: string): void {
    this.set({ title, description, index: false });
  }

  set(page: PageSeo): void {
    const titled = page.title.includes(BRAND) ? page.title : `${page.title} | ${BRAND}`;
    const description = page.description.replace(/\s+/g, ' ').trim().slice(0, 180);
    const url = this.toUrl(page.path);
    const index = page.index !== false;

    this.title.setTitle(titled);
    this.upsert('name', 'description', description);
    this.upsert('name', 'robots', index ? 'index, follow' : 'noindex, nofollow');
    this.setCanonical(index ? url : null);

    this.upsert('property', 'og:title', titled);
    this.upsert('property', 'og:description', description);
    this.upsert('property', 'og:url', url);
    this.upsert('property', 'og:type', page.type ?? 'website');
    this.upsert('property', 'og:site_name', BRAND);
    this.upsert('property', 'og:locale', 'en_IN');

    this.upsert('name', 'twitter:card', page.image ? 'summary_large_image' : 'summary');
    this.upsert('name', 'twitter:title', titled);
    this.upsert('name', 'twitter:description', description);

    if (page.image) {
      this.upsert('property', 'og:image', page.image);
      this.upsert('name', 'twitter:image', page.image);
    } else {
      this.meta.removeTag('property="og:image"');
      this.meta.removeTag('name="twitter:image"');
    }

    this.setJsonLd(page.jsonLd ?? null);
  }

  private toUrl(path?: string): string {
    const origin = this.origin();
    if (!path) {
      const loc = this.document.location;
      return `${origin}${loc?.pathname ?? '/'}${loc?.search ?? ''}`;
    }
    if (/^https?:\/\//i.test(path)) return path;
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private upsert(kind: 'name' | 'property', key: string, content: string): void {
    const selector = `${kind}="${key}"`;
    const tag = { [kind]: key, content };
    if (this.meta.getTag(selector)) this.meta.updateTag(tag);
    else this.meta.addTag(tag);
  }

  private setCanonical(href: string | null): void {
    const head = this.document.head;
    if (!head) return;
    const link = head.querySelector('link[rel="canonical"]');
    if (!href) {
      link?.remove();
      return;
    }
    if (link) {
      link.setAttribute('href', href);
      return;
    }
    const created = this.document.createElement('link');
    created.setAttribute('rel', 'canonical');
    created.setAttribute('href', href);
    head.appendChild(created);
  }

  private setJsonLd(data: PageSeo['jsonLd']): void {
    const head = this.document.head;
    if (!head) return;
    const existing = head.querySelector('script[data-seo-jsonld]');
    if (!data || (Array.isArray(data) && data.length === 0)) {
      existing?.remove();
      return;
    }
    const script = existing ?? this.document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-seo-jsonld', '');
    script.textContent = JSON.stringify(data);
    if (!existing) head.appendChild(script);
  }
}
