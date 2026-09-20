import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';
  loading = false;
  error = '';

  submit(): void {
    this.loading = true;
    this.error = '';

    this.auth.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        if (returnUrl) {
          void this.router.navigateByUrl(returnUrl);
        } else if (this.auth.isSeller()) {
          void this.router.navigate(['/seller/properties']);
        } else {
          void this.router.navigate(['/browse']);
        }
      },
      error: (err) => {
        this.error =
          err?.error?.error?.message || err?.error?.message || 'Invalid email or password.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
