import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  fullName = '';
  email = '';
  phone = '';
  password = '';
  role: 'BUYER' | 'SELLER' = 'BUYER';
  loading = false;
  error = '';

  ngOnInit(): void {
    const role = this.route.snapshot.queryParamMap.get('role');
    if (role === 'SELLER' || role === 'BUYER') {
      this.role = role;
    }
  }

  submit(): void {
    this.loading = true;
    this.error = '';

    this.auth
      .register({
        fullName: this.fullName.trim(),
        email: this.email.trim(),
        phone: this.phone.trim() || undefined,
        password: this.password,
        role: this.role,
      })
      .subscribe({
        next: () => {
          if (this.role === 'SELLER') {
            void this.router.navigate(['/seller/properties']);
          } else {
            void this.router.navigate(['/browse']);
          }
        },
        error: (err) => {
          this.error =
            err?.error?.error?.message ||
            err?.error?.message ||
            'Registration failed. Check your details and try again.';
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }
}
