import {isPlatformBrowser} from '@angular/common';
import { gsap } from 'gsap';
import {
  Component,
  AfterViewInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  ElementRef,
  Output,
  EventEmitter,
  NgZone, ViewChild
} from '@angular/core';

@Component({
  selector: 'app-splash',
  standalone: true,
  templateUrl: 'splash.html',
  styleUrl: 'splash.css',
})
export class Splash implements AfterViewInit, OnDestroy {
  @Output() done = new EventEmitter<void>();
  @ViewChild('svgRef', { static: true }) svgRef!: ElementRef<SVGSVGElement>;

  private platformId = inject(PLATFORM_ID);
  private el = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);
  private tl?: gsap.core.Timeline;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const svg = this.svgRef?.nativeElement;
    if (!svg) return this.finish();

    const root = this.el.nativeElement;

    gsap.set(svg, {
      opacity: 1,
      rotation: -20,
      // scale: 1.12,                 // <- slight overscale to hide edges after rotation
      scale: 1.5,
      transformOrigin: '50% 50%'
    });

    const lines = Array.from(root.querySelectorAll('svg > g'));

    this.tl = gsap.timeline()
      .from(lines, { opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.06 }, 0)
      .from(root.querySelectorAll('.cross'), {
        rotation: -800, opacity: 0, scale: 0, transformOrigin: 'center', ease: 'expo.out', stagger: 0.01
      }, 0)
      .from(root.querySelectorAll('.left'),  { xPercent: -20, duration: 2, ease: 'expo.out' }, 0)
      .from(root.querySelectorAll('.right'), { xPercent:  20, duration: 2, ease: 'expo.out' }, 0)
      .to(root.querySelectorAll('.cross'), {
        rotation: 360, opacity: 0, transformOrigin: 'center', ease: 'expo.out',
        stagger: { from: 'center', amount: 0.3 }
      }, 1.5)
      .to(root.querySelectorAll('.webflow'), {
        opacity: 0, scale: 0.8, transformOrigin: 'center', duration: 0.3,
        stagger: { from: 'end', amount: 0.4 }
      }, 1.5)
      .to(root.querySelectorAll('.gsap'), {
        opacity: 0, scale: 0.8, transformOrigin: 'center', duration: 0.3,
        stagger: { from: 'start', amount: 0.4 }
      }, 1.5)
      .to(svg, { autoAlpha: 0, duration: 0.4 }, '>-0.1');

    this.tl.eventCallback('onComplete', () => this.finish());
  }

  private finish() {
    this.zone.run(() => this.done.emit()); // parent removes <app-splash>
  }

  ngOnDestroy(): void {
    this.tl?.kill();
  }
}
