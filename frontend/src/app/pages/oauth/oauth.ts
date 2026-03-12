import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { gsap } from 'gsap';
import {
  ArrowUpRight,
  Github,
  LucideAngularModule,
  ShieldCheck,
  Sparkles
} from 'lucide-angular';

import { backendOrigin } from '../../core/services/backend-origin';
import { AuthSurface } from './auth-surface';

type AuthProviderId = 'google' | 'github';

interface AuthProviderOption {
  readonly id: AuthProviderId;
  readonly label: string;
}

const REDIRECT_STORAGE_KEY = 'app.redirect.url';

@Component({
  selector: 'app-oauth',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './oauth.html',
  styleUrl: './oauth.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Oauth implements AfterViewInit, OnDestroy {
  @ViewChild('pageRoot', { static: true }) private readonly pageRootRef!: ElementRef<HTMLElement>;
  @ViewChild('surface', { static: true }) private readonly surfaceRef!: ElementRef<HTMLCanvasElement>;

  private readonly route = inject(ActivatedRoute);

  readonly arrowUpRightIcon = ArrowUpRight;
  readonly githubIcon = Github;
  readonly shieldCheckIcon = ShieldCheck;
  readonly sparklesIcon = Sparkles;
  readonly pendingProvider = signal<AuthProviderId | null>(null);
  readonly providers = [
    {
      id: 'google',
      label: 'Google'
    },
    {
      id: 'github',
      label: 'GitHub'
    }
  ] as const satisfies ReadonlyArray<AuthProviderOption>;
  readonly redirectPath = signal<string | null>(this.resolveRedirectPath());
  readonly redirectLabel = computed(() => this.getRedirectLabel(this.redirectPath()));
  readonly pendingProviderOption = computed(() => {
    const providerId = this.pendingProvider();
    return this.providers.find((provider) => provider.id === providerId) ?? null;
  });
  readonly pendingStatus = computed(() => {
    const provider = this.pendingProviderOption();
    if (!provider) {
      return '';
    }

    return `Opening ${provider.label} secure sign-in. Keep this tab open while the provider handshake starts.`;
  });

  private authSurface?: AuthSurface;
  private motionContext?: gsap.Context;

  ngAfterViewInit(): void {
    this.initSurface();
    this.initMotion();
  }

  ngOnDestroy(): void {
    this.motionContext?.revert();
    this.authSurface?.destroy();
  }

  continueWith(provider: AuthProviderId): void {
    if (this.pendingProvider()) {
      return;
    }

    this.pendingProvider.set(provider);
    this.redirectToProvider(provider);
  }

  private initSurface(): void {
    const surface = new AuthSurface(this.surfaceRef.nativeElement, this.pageRootRef.nativeElement);
    if (surface.start()) {
      this.authSurface = surface;
    }
  }

  private initMotion(): void {
    const reduceMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      return;
    }

    this.motionContext = gsap.context(() => {
      const intro = gsap.timeline({
        defaults: {
          ease: 'power3.out'
        }
      });

      intro
        .from('.auth-panel', {
          opacity: 0,
          y: 28,
          filter: 'blur(16px)',
          duration: 1.05
        })
        .from('.eyebrow', {
          opacity: 0,
          y: 14,
          duration: 0.5
        }, 0.15)
        .from('.auth-sigil', {
          opacity: 0,
          scale: 0.9,
          rotate: -10,
          duration: 0.7
        }, 0.18)
        .from('.auth-kicker, .auth-title, .auth-copy, .auth-status, .provider-button, .auth-return', {
          opacity: 0,
          y: 18,
          stagger: 0.07,
          duration: 0.68
        }, 0.25);
    }, this.pageRootRef.nativeElement);
  }

  private resolveRedirectPath(): string | null {
    const redirect = this.normalizeRedirect(this.route.snapshot.queryParamMap.get('redirect'))
      ?? this.normalizeRedirect(this.readRedirectStorage());

    if (redirect) {
      this.writeRedirectStorage(redirect);
    }

    return redirect;
  }

  private readRedirectStorage(): string | null {
    try {
      return sessionStorage.getItem(REDIRECT_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private writeRedirectStorage(redirect: string): void {
    try {
      sessionStorage.setItem(REDIRECT_STORAGE_KEY, redirect);
    } catch {
      // Ignore storage failures and let the flow continue without resume state.
    }
  }

  private normalizeRedirect(raw: string | null): string | null {
    if (!raw) {
      return null;
    }

    if (typeof window === 'undefined') {
      return raw.startsWith('/') ? raw : null;
    }

    try {
      const parsed = new URL(raw, window.location.origin);
      if (parsed.origin !== window.location.origin) {
        return null;
      }

      const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      return normalized.startsWith('/') ? normalized : `/${normalized}`;
    } catch {
      return raw.startsWith('/') ? raw : null;
    }
  }

  private getRedirectLabel(redirect: string | null): string {
    if (!redirect || redirect === '/') {
      return 'home';
    }

    try {
      const parsed = new URL(redirect, 'https://lukerykta.io');
      const segments = parsed.pathname
        .split('/')
        .filter(Boolean)
        .map((segment) => this.humanizeSegment(segment));

      return segments.length ? segments.join(' / ') : 'home';
    } catch {
      return redirect;
    }
  }

  private redirectToProvider(provider: AuthProviderId): void {
    window.location.assign(`${backendOrigin()}/oauth2/authorization/${provider}`);
  }

  private humanizeSegment(segment: string): string {
    const normalized = segment.replace(/[-_]+/g, ' ').trim();
    if (!normalized) {
      return segment;
    }

    return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
