import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BlogCard, BlogDetail, BlogService, blogCover } from '../../core/services/blog.service';

@Component({
  selector: 'app-blog-detail',
  imports: [RouterLink, DatePipe],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss',
})
export class BlogDetailComponent implements OnInit {
  private readonly blog = inject(BlogService);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);

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
          this.title.setTitle(post.seoTitle || post.title);
          this.loading.set(false);
        },
        error: () => {
          this.post.set(null);
          this.missing.set(true);
          this.loading.set(false);
        },
      });
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
