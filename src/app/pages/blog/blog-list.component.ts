import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BLOG_CATEGORIES, BlogCard, BlogService, blogCover } from '../../core/services/blog.service';
import { SeoService } from '../../core/seo/seo.service';

@Component({
  selector: 'app-blog-list',
  imports: [RouterLink, DatePipe],
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.scss',
})
export class BlogListComponent implements OnInit {
  private readonly blog = inject(BlogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);

  readonly categories = BLOG_CATEGORIES;
  readonly posts = signal<BlogCard[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly pageSize = 8;
  page = 1;
  category = '';

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const requested = Number(params.get('page') ?? 1);
      this.page = Number.isFinite(requested) && requested > 0 ? Math.floor(requested) : 1;
      this.category = params.get('category') ?? '';
      this.applySeo();
      this.load();
    });
  }

  cover(post: BlogCard): string {
    return blogCover(post.coverImageUrl);
  }

  onCoverError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const fallback = blogCover(null);
    if (img.src !== fallback) img.src = fallback;
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.pageSize));
  }

  setCategory(category: string): void {
    void this.router.navigate(['/blog'], {
      queryParams: { category: category || null, page: 1 },
    });
  }

  goToPage(page: number): void {
    void this.router.navigate(['/blog'], {
      queryParams: { category: this.category || null, page },
    });
  }

  private applySeo(): void {
    const query = new URLSearchParams();
    if (this.category) query.set('category', this.category);
    if (this.page > 1) query.set('page', String(this.page));
    const qs = query.toString();
    this.seo.set({
      title: this.category ? `${this.category} guides` : 'Guides for buying a verified home',
      description: this.category
        ? `${this.category} notes on Titlefolio: locality, documents, and what to check before you buy in NCR.`
        : 'Locality notes, document checks, and buying advice for verified homes in Gurgaon, Noida, Delhi and Faridabad.',
      path: qs ? `/blog?${qs}` : '/blog',
    });
  }

  private load(): void {
    this.loading.set(true);
    this.blog
      .list({
        page: this.page,
        limit: this.pageSize,
        category: this.category || undefined,
      })
      .subscribe({
        next: (res) => {
          this.posts.set(res.data ?? []);
          this.total.set(res.meta?.total ?? res.data?.length ?? 0);
          this.loading.set(false);
        },
        error: () => {
          this.posts.set([]);
          this.total.set(0);
          this.loading.set(false);
        },
      });
  }
}
