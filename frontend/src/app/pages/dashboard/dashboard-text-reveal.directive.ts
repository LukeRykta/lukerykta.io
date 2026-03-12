import { AfterViewInit, Directive, ElementRef, Input, NgZone, OnDestroy, inject } from '@angular/core';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

@Directive({
  selector: '[dashboardCharsReveal]',
  standalone: true
})
export class DashboardCharsRevealDirective implements AfterViewInit, OnDestroy {
  @Input() dashboardCharsRevealDelay = 0;

  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly reducedMotion = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  private split?: SplitText;
  private tween?: gsap.core.Tween;

  ngAfterViewInit(): void {
    if (this.reducedMotion) {
      return;
    }

    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => this.animate());
    });
  }

  ngOnDestroy(): void {
    this.tween?.kill();
    this.split?.revert();
  }

  private animate(): void {
    const element = this.hostRef.nativeElement;
    if (!element.isConnected) {
      return;
    }

    this.tween?.kill();
    this.split?.revert();

    this.split = new SplitText(element, { type: 'chars' });
    this.tween = gsap.from(this.split.chars, {
      x: 90,
      opacity: 0,
      duration: 0.42,
      ease: 'power4.out',
      stagger: {
        amount: 0.18
      },
      delay: this.dashboardCharsRevealDelay
    });
  }
}
