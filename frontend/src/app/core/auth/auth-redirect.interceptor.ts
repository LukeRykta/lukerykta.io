import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { backendOrigin } from '../services/backend-origin';

const API_BASE = backendOrigin();

/** Avoid redirect loops */
const SKIP_PATHS = [
  '/oauth',
  '/oauth2/authorization/google',
  '/oauth2/authorization/github'
];

function shouldHandle(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    const inApi = API_BASE
      ? parsed.href.startsWith(API_BASE)
      : parsed.origin === window.location.origin; // same-origin API
    const skip = SKIP_PATHS.some(p => parsed.pathname.startsWith(p));
    return inApi && !skip;
  } catch {
    // relative URL (e.g., '/api/...') still okay
    return !SKIP_PATHS.some(p => url.startsWith(p));
  }
}

let redirecting = false;

export const authRedirectInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && shouldHandle(req.url) && !redirecting) {
        redirecting = true;
        const currentUrl = router.url || '/';
        router.navigate(['/oauth'], { queryParams: { redirect: currentUrl } })
          .finally(() => { redirecting = false; });
      }
      return throwError(() => err);
    })
  );
};
