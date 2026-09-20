import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();
  const isAuthRoute =
    req.url.includes('/auth/portal/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh');

  const authReq =
    token && !isAuthRoute
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthRoute || req.url.includes('/auth/refresh')) {
        return throwError(() => error);
      }

      const refreshToken = auth.getRefreshToken();
      if (!refreshToken) {
        auth.logoutLocal();
        return throwError(() => error);
      }

      return auth.refresh(refreshToken).pipe(
        switchMap((res) => {
          const retryReq = req.clone({
            setHeaders: { Authorization: `Bearer ${res.data.accessToken}` },
          });
          return next(retryReq);
        }),
        catchError((refreshError) => {
          auth.logoutLocal();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
