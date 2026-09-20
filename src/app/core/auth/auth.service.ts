import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
} from '../models/user.model';

const ACCESS_TOKEN_KEY = 'vp_web_access_token';
const REFRESH_TOKEN_KEY = 'vp_web_refresh_token';
const USER_KEY = 'vp_web_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<User | null>(this.readStoredUser());
  readonly isAuthenticated = signal(!!this.getAccessToken());

  login(credentials: LoginRequest): Observable<ApiResponse<AuthTokens>> {
    return this.http
      .post<ApiResponse<AuthTokens>>(`${this.baseUrl}/portal/login`, credentials)
      .pipe(tap((res) => this.persistSession(res.data)));
  }

  register(payload: RegisterRequest): Observable<ApiResponse<AuthTokens>> {
    return this.http
      .post<ApiResponse<AuthTokens>>(`${this.baseUrl}/register`, payload)
      .pipe(tap((res) => this.persistSession(res.data)));
  }

  refresh(refreshToken: string): Observable<ApiResponse<AuthTokens>> {
    return this.http
      .post<ApiResponse<AuthTokens>>(`${this.baseUrl}/refresh`, { refreshToken })
      .pipe(tap((res) => this.persistSession(res.data)));
  }

  me(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/me`).pipe(
      tap((res) => {
        localStorage.setItem(USER_KEY, JSON.stringify(res.data));
        this.currentUser.set(res.data);
      }),
    );
  }

  logout(): Observable<ApiResponse<{ message: string }>> {
    const refreshToken = this.getRefreshToken();
    const request$ = refreshToken
      ? this.http.post<ApiResponse<{ message: string }>>(`${this.baseUrl}/logout`, {
          refreshToken,
        })
      : of({ success: true, data: { message: 'Logged out' } } as ApiResponse<{ message: string }>);

    return request$.pipe(tap(() => this.clearSession()));
  }

  logoutLocal(): void {
    this.clearSession();
    void this.router.navigate(['/']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  isBuyer(): boolean {
    return this.currentUser()?.role === 'BUYER';
  }

  isSeller(): boolean {
    return this.currentUser()?.role === 'SELLER';
  }

  private persistSession(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(tokens.user));
    this.currentUser.set(tokens.user);
    this.isAuthenticated.set(true);
  }

  private clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
