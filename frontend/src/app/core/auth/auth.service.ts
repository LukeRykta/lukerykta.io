// src/app/core/auth/auth.service.ts
import {inject, Injectable, signal} from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';
import { apiUrl } from '../services/backend-origin';

type PendingIntent = { kind: 'like'; postId: string } | { kind: 'bookmark'; postId: string } | { kind: 'none' };

const REDIRECT_KEY = 'app.redirect.url';
const INTENT_KEY   = 'app.pending.intent';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Backed by a real session probe in bootstrapSession()
  readonly authed = signal(false);

  private router = inject(Router);
  private http = inject(HttpClient);

  /** Call on app start to learn if the user is logged in (e.g., cookie-based session). */
  bootstrapSession() {
    const url = apiUrl('/api/me');
    // Adjust to your API; expect 200 if logged in
    return this.http.get(url, { withCredentials: true }).pipe(
      tap({
        next: () => this.authed.set(true),
        error: () => this.authed.set(false)
      }),
      catchError(() => of(null)) // ensure observable completes
    );
  }

  isLoggedIn() { return this.authed(); }

  /** Returns true if you can proceed; otherwise redirects to /auth and returns false. */
  requireAuthOrRedirect(intent?: PendingIntent): boolean {
    if (this.isLoggedIn()) return true;

    const currentUrl = this.router.url || '/';
    sessionStorage.setItem(REDIRECT_KEY, currentUrl);
    if (intent) sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent));
    // Navigate to your SPA auth screen (with buttons to Google/GitHub)
    this.router.navigate(['/oauth'], { queryParams: { redirect: currentUrl }});
    return false;
  }

  /** Call after login to send user back where they were. */
  resumeFromStorage() {
    const url = sessionStorage.getItem(REDIRECT_KEY);
    if (url) {
      sessionStorage.removeItem(REDIRECT_KEY);
      // Keep intent for the destination page to optionally consume
      this.router.navigateByUrl(url);
    }
  }

  /** Read & clear the pending intent (destination page can use this). */
  takePendingIntent(): PendingIntent | null {
    const raw = sessionStorage.getItem(INTENT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(INTENT_KEY);
    try { return JSON.parse(raw); } catch { return null; }
  }
}
