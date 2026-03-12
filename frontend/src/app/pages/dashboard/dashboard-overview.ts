import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { gsap } from 'gsap';
import {
  Activity,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  RefreshCw,
  LucideAngularModule
} from 'lucide-angular';

import { AdminOverview, AdminService } from '../../core/services/admin.service';
import { DashboardRollingHeading } from './dashboard-rolling-heading';
import { DashboardCharsRevealDirective } from './dashboard-text-reveal.directive';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [LucideAngularModule, DashboardRollingHeading, DashboardCharsRevealDirective],
  templateUrl: './dashboard-overview.html',
  styleUrl: './dashboard-overview.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardOverview implements AfterViewChecked, OnDestroy {
  @ViewChild('visitBreakdown') private visitBreakdownRef?: ElementRef<HTMLElement>;
  @ViewChild('visitToggleIcon') private visitToggleIconRef?: ElementRef<HTMLElement>;
  @ViewChildren('visitMetricCard') private visitMetricCardRefs?: QueryList<ElementRef<HTMLElement>>;

  private readonly admin = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reducedMotion = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private visitMotionReady = false;
  private visitTween?: gsap.core.Timeline;

  readonly activityIcon = Activity;
  readonly calendarClockIcon = CalendarClock;
  readonly calendarDaysIcon = CalendarDays;
  readonly calendarRangeIcon = CalendarRange;
  readonly chevronDownIcon = ChevronDown;
  readonly refreshIcon = RefreshCw;
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly overview = signal<AdminOverview | null>(null);
  readonly visitsExpanded = signal(false);

  constructor() {
    this.refreshOverview();
  }

  ngAfterViewChecked(): void {
    this.ensureVisitBreakdownReady();
  }

  ngOnDestroy(): void {
    this.visitTween?.kill();
  }

  toggleVisitBreakdown(): void {
    this.ensureVisitBreakdownReady();

    const expanded = !this.visitsExpanded();
    this.visitsExpanded.set(expanded);
    this.animateVisitBreakdown(expanded);
  }

  refreshOverview(): void {
    if (this.loading() && this.overview()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.admin.getOverview()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (overview) => {
          this.overview.set(overview);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Dashboard stats are unavailable right now.');
          this.loading.set(false);
        }
      });
  }

  private ensureVisitBreakdownReady(): void {
    if (this.visitMotionReady || !this.visitBreakdownRef || !this.visitToggleIconRef || !this.visitMetricCardRefs?.length) {
      return;
    }

    this.visitMotionReady = true;

    const panel = this.visitBreakdownRef.nativeElement;
    const cards = this.visitMetricCardRefs.toArray().map((card) => card.nativeElement);
    const icon = this.visitToggleIconRef.nativeElement;

    gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
    gsap.set(panel, {
      height: 0,
      autoAlpha: 0,
      overflow: 'hidden'
    });
    gsap.set(cards, {
      y: this.reducedMotion ? 0 : -12,
      autoAlpha: 0
    });
  }

  private animateVisitBreakdown(expanded: boolean): void {
    if (!this.visitBreakdownRef || !this.visitToggleIconRef || !this.visitMetricCardRefs?.length) {
      return;
    }

    const panel = this.visitBreakdownRef.nativeElement;
    const cards = this.visitMetricCardRefs.toArray().map((card) => card.nativeElement);
    const icon = this.visitToggleIconRef.nativeElement;

    this.visitTween?.kill();

    if (this.reducedMotion) {
      gsap.set(icon, { rotate: expanded ? 180 : 0 });
      gsap.set(panel, {
        height: expanded ? 'auto' : 0,
        autoAlpha: expanded ? 1 : 0,
        overflow: 'hidden'
      });
      gsap.set(cards, {
        y: 0,
        autoAlpha: expanded ? 1 : 0
      });
      return;
    }

    if (expanded) {
      gsap.set(panel, {
        height: 'auto',
        autoAlpha: 1,
        overflow: 'hidden'
      });

      const expandedHeight = panel.offsetHeight;

      gsap.set(panel, {
        height: 0,
        autoAlpha: 1,
        overflow: 'hidden'
      });
      gsap.set(cards, {
        y: -12,
        autoAlpha: 0
      });

      this.visitTween = gsap.timeline()
        .to(icon, {
          rotate: 180,
          duration: 0.32,
          ease: 'power2.out'
        }, 0)
        .to(panel, {
          height: expandedHeight,
          autoAlpha: 1,
          duration: 0.42,
          ease: 'power2.inOut'
        }, 0)
        .to(cards, {
          y: 0,
          autoAlpha: 1,
          duration: 0.28,
          stagger: 0.06,
          ease: 'power2.out'
        }, 0.1)
        .set(panel, {
          height: 'auto'
        });

      return;
    }

    this.visitTween = gsap.timeline()
      .set(panel, {
        height: panel.offsetHeight,
        overflow: 'hidden'
      })
      .to(cards, {
        y: -10,
        autoAlpha: 0,
        duration: 0.18,
        stagger: 0.04,
        ease: 'power2.in'
      }, 0)
      .to(icon, {
        rotate: 0,
        duration: 0.28,
        ease: 'power2.out'
      }, 0)
      .to(panel, {
        height: 0,
        autoAlpha: 0,
        duration: 0.34,
        ease: 'power2.inOut'
      }, 0.04);
  }
}
