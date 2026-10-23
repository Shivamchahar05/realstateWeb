import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BlogCard, BlogDetail, BlogService, blogCover } from '../../core/services/blog.service';
import { SeoService } from '../../core/seo/seo.service';

@Component({
  selector: 'app-blog-detail',
  imports: [RouterLink, DatePipe],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss',
})
export class BlogDetailComponent implements OnInit {
  private readonly blog = inject(BlogService);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);

  readonly post = signal<BlogDetail | null>(null);
  readonly loading = signal(true);
  readonly missing = signal(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) return;
      this.loading.set(true);
      this.missing.set(false);
      this.blog.get(slug).subscribe({
        next: (post) => {
          this.post.set(post);
          this.applySeo(post);
          this.loading.set(false);
        },
        error: () => {
          this.post.set(null);
          this.missing.set(true);
          this.seo.privatePage('Guide not found', 'This Titlefolio guide is not available.');
          this.loading.set(false);
        },
      });
    });
  }

  private applySeo(post: BlogDetail): void {
    const title = post.seoTitle || post.title;
    const description = post.seoDescription || post.excerpt;
    const image = blogCover(post.coverImageUrl);
    const path = `/blog/${post.slug}`;
    const url = `${this.seo.origin()}${path}`;
    this.seo.set({
      title,
      description,
      path,
      image,
      type: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description,
        image,
        datePublished: post.publishedAt || undefined,
        author: { '@type': 'Person', name: post.authorName || 'Titlefolio' },
        publisher: {
          '@type': 'Organization',
          name: 'Titlefolio',
          logo: { '@type': 'ImageObject', url: `${this.seo.origin()}/logo.svg` },
        },
        mainEntityOfPage: url,
      },
    });
  }

  cover(url: string | null): string {
    return blogCover(url);
  }

  paragraphs(body: string): string[] {
    return body
      .split(/\n\s*\n/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  areaLink(post: BlogCard): string[] | null {
    if (post.city && post.locality) return ['/localities', post.city, post.locality];
    return null;
  }
}
