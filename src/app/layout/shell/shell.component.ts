import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { BuyerLibraryService } from '../../core/services/buyer-library.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  readonly library = inject(BuyerLibraryService);
  readonly menuOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeMenu());

    this.destroyRef.onDestroy(() => {
      document.body.style.overflow = '';
    });
  }

  toggleMenu(): void {
    this.setMenu(!this.menuOpen());
  }

  closeMenu(): void {
    this.setMenu(false);
  }

  onNavClick(event: Event): void {
    const target = event.target;
    if (target instanceof Element && target.closest('a')) {
      this.closeMenu();
    }
  }

  private setMenu(open: boolean): void {
    this.menuOpen.set(open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => this.auth.logoutLocal(),
      error: () => this.auth.logoutLocal(),
    });
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  roleLabel(role: string): string {
    if (role === 'SELLER') return 'Seller';
    if (role === 'BUYER') return 'Buyer';
    return role;
  }
}
