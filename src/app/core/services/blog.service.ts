import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { mediaAbsoluteUrl } from '../../shared/property-media';
import { ApiService } from './api.service';

const BLOG_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';

export function blogCover(url: string | null | undefined): string {
  return url ? mediaAbsoluteUrl(url) : BLOG_FALLBACK_IMAGE;
}

export interface BlogCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  category: string;
  tags: string[];
  city: string | null;
  locality: string | null;
  featured: boolean;
  publishedAt: string | null;
  authorName: string;
}

export interface BlogDetail extends BlogCard {
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
  sourceUrl: string | null;
  related: BlogCard[];
}

export const BLOG_CATEGORIES = [
  'Gurgaon',
  'Noida',
  'Delhi',
  'Faridabad',
  'Home loan',
  'RERA',
  'Society',
  'Documents',
  'Buying guide',
  'News',
] as const;

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly api = inject(ApiService);

  list(params: {
    page?: number;
    limit?: number;
    category?: string;
    city?: string;
    locality?: string;
    search?: string;
    areaFallback?: boolean;
  }) {
    return this.api.getWithMeta<BlogCard[]>('/blog/posts', {
      page: params.page,
      limit: params.limit,
      category: params.category,
      city: params.city,
      locality: params.locality,
      search: params.search,
      areaFallback: params.areaFallback ? '1' : undefined,
    });
  }

  get(slug: string) {
    return this.api.get<BlogDetail>(`/blog/posts/${slug}`);
  }

  related(city: string, locality: string) {
    return this.list({ city, locality, limit: 1, areaFallback: true }).pipe(
      map((res) => res.data[0] ?? null),
    );
  }
}
