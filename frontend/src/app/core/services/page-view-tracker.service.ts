import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';

import { apiUrl } from './backend-origin';

const VISITOR_STORAGE_KEY = 'app.analytics.visitor-id';
const TRACKING_PATH = '/api/public/analytics/page-views';
const EXCLUDED_ROUTE_PREFIXES = ['/dashboard', '/oauth'];

type PageViewRequest = {
  routePath: string;
  visitorId: string;
};

@Injectable({ providedIn: 'root' })
export class PageViewTrackerService {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  private started = false;
  private lastTrackedPath: string | null = null;
  private visitorId?: string;

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.trackUrl(this.router.url);

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.trackUrl(event.urlAfterRedirects);
      }
    });
  }

  private trackUrl(url: string): void {
    const routePath = this.normalizeRoutePath(url);
    if (!routePath || this.shouldSkip(routePath) || routePath === this.lastTrackedPath) {
      return;
    }

    this.lastTrackedPath = routePath;
    const payload: PageViewRequest = {
      routePath,
      visitorId: this.getVisitorId()
    };

    this.http.post<void>(apiUrl(TRACKING_PATH), payload, { withCredentials: true }).subscribe({
      error: () => undefined
    });
  }

  private normalizeRoutePath(url: string): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const parsed = new URL(url, window.location.origin);
      let path = parsed.pathname || '/';
      if (path.length > 1) {
        path = path.replace(/\/+$/, '');
      }
      return path || '/';
    } catch {
      return null;
    }
  }

  private shouldSkip(routePath: string): boolean {
    return EXCLUDED_ROUTE_PREFIXES.some((prefix) => routePath === prefix || routePath.startsWith(`${prefix}/`));
  }

  private getVisitorId(): string {
    if (this.visitorId) {
      return this.visitorId;
    }

    this.visitorId = this.loadOrCreateVisitorId();
    return this.visitorId;
  }

  private loadOrCreateVisitorId(): string {
    if (typeof window === 'undefined') {
      return this.generateVisitorId();
    }

    try {
      const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY)?.trim();
      if (existing) {
        return existing;
      }

      const created = this.generateVisitorId();
      window.localStorage.setItem(VISITOR_STORAGE_KEY, created);
      return created;
    } catch {
      return this.generateVisitorId();
    }
  }

  private generateVisitorId(): string {
    if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }

    return `visitor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
