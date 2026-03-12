// src/app/core/auth/auth.service.ts
import {computed, inject, Injectable, signal} from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { apiUrl } from '../services/backend-origin';

type PendingIntent = { kind: 'like'; postId: string } | { kind: 'bookmark'; postId: string } | { kind: 'none' };

const REDIRECT_KEY = 'app.redirect.url';
const INTENT_KEY   = 'app.pending.intent';

export interface SessionState {
  id: number | null;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  provider: 'google' | 'github' | null;
  providerId: string | null;
  roles: string[];
  authenticated: boolean;
}

const ANONYMOUS_SESSION: SessionState = {
  id: null,
  email: null,
  displayName: null,
  avatarUrl: null,
  provider: null,
  providerId: null,
  roles: [],
  authenticated: false
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly session = signal<SessionState>(ANONYMOUS_SESSION);
  readonly authed = computed(() => this.session().authenticated);
  readonly roles = computed(() => this.session().roles);
  readonly isAdmin = computed(() => this.roles().includes('ADMIN'));

  private router = inject(Router);
  private http = inject(HttpClient);
  private sessionLoaded = false;
  private sessionRequest$?: Observable<SessionState>;

  /** Call on app start to learn if the user is logged in (e.g., cookie-based session). */
  bootstrapSession() {
    return this.ensureSession();
  }

  isLoggedIn() { return this.authed(); }
  isSessionLoaded() { return this.sessionLoaded; }

  ensureSession(forceRefresh = false): Observable<SessionState> {
    if (this.sessionLoaded && !forceRefresh) {
      return of(this.session());
    }

    if (this.sessionRequest$ && !forceRefresh) {
      return this.sessionRequest$;
    }

    const url = apiUrl('/api/me');
    this.sessionRequest$ = this.http.get<Partial<SessionState>>(url, { withCredentials: true }).pipe(
      map((response) => this.normalizeSession(response)),
      tap((session) => {
        this.session.set(session);
        this.sessionLoaded = true;
      }),
      catchError(() => {
        this.session.set(ANONYMOUS_SESSION);
        this.sessionLoaded = true;
        return of(ANONYMOUS_SESSION);
      }),
      finalize(() => {
        this.sessionRequest$ = undefined;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.sessionRequest$;
  }

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

  private normalizeSession(response: Partial<SessionState> | null | undefined): SessionState {
    return {
      id: response?.id ?? null,
      email: response?.email ?? null,
      displayName: response?.displayName ?? null,
      avatarUrl: response?.avatarUrl ?? null,
      provider: response?.provider ?? null,
      providerId: response?.providerId ?? null,
      roles: Array.isArray(response?.roles) ? response.roles : [],
      authenticated: !!response?.authenticated
    };
  }
}
