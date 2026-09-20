import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-account',
  imports: [RouterLink, DatePipe],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent implements OnInit {
  private readonly auth = inject(AuthService);

  loading = true;
  profile: User | null = null;

  ngOnInit(): void {
    this.profile = this.auth.currentUser();
    this.auth.me().subscribe({
      next: (res) => {
        this.profile = res.data;
        this.loading = false;
      },
      error: () => {
        this.auth.logoutLocal();
      },
    });
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
    return role === 'SELLER' ? 'Seller' : role === 'BUYER' ? 'Buyer' : role;
  }
}
