import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { HeroSurface } from '../../shared/hero-surface/hero-surface';

gsap.registerPlugin(SplitText);

@Component({
  selector: 'app-infinite-hero',
  standalone: true,
  templateUrl: './infinite-hero.html',
  styleUrl: './infinite-hero.css',
  imports: [
    RouterLink,
    LucideAngularModule
  ]
})
export class InfiniteHero implements AfterViewInit, OnDestroy {
  readonly showcaseHidden = signal(false);
  readonly customCursorEnabled = signal(false);

  @ViewChild('root', { static: true }) rootRef!: ElementRef<HTMLDivElement>;
  @ViewChild('bg', { static: true }) bgRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('heading', { static: true }) h1Ref!: ElementRef<HTMLHeadingElement>;
  @ViewChild('desc', { static: true }) pRef!: ElementRef<HTMLParagraphElement>;
  @ViewChild('cta', { static: true }) ctaRef!: ElementRef<HTMLDivElement>;
  @ViewChild('cursorLayer', { static: true }) cursorLayerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('cursorRing', { static: true }) cursorRingRef!: ElementRef<HTMLDivElement>;
  @ViewChild('cursorDot', { static: true }) cursorDotRef!: ElementRef<HTMLDivElement>;

  private heroSurface?: HeroSurface;
  private cursorCleanup?: () => void;

  ngAfterViewInit(): void {
    this.initThree();
    this.initGsap();
    this.initCursor();
  }

  ngOnDestroy(): void {
    this.heroSurface?.destroy();
    this.cursorCleanup?.();
    this.rootRef.nativeElement.style.cursor = '';
  }

  toggleShowcase(): void {
    this.showcaseHidden.update((hidden) => !hidden);
  }

  private initThree() {
    const heroSurface = new HeroSurface(
      this.canvasRef.nativeElement,
      this.rootRef.nativeElement,
      { baseColor: 0x8ca0b3, timeScale: 0.5 }
    );
    if (heroSurface.start()) {
      this.heroSurface = heroSurface;
    }
  }

  private initGsap() {
    const bg = this.bgRef.nativeElement;
    const h1 = this.h1Ref.nativeElement;
    const p = this.pRef.nativeElement;
    const cta = this.ctaRef.nativeElement;
    const ctas = Array.from(cta.children);

    const h1Split = new SplitText(h1, { type: 'lines' });
    const pSplit = new SplitText(p, { type: 'lines' });

    gsap.set(bg, { filter: 'blur(28px)' });
    gsap.set(h1Split.lines, { opacity: 0, y: 24, filter: 'blur(8px)' });
    gsap.set(pSplit.lines, { opacity: 0, y: 16, filter: 'blur(6px)' });
    gsap.set(ctas, { opacity: 0, y: 16 });

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.to(bg, { filter: 'blur(0px)', duration: 1.2 }, 0)
      .to(h1Split.lines, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, stagger: 0.1 }, 0.3)
      .to(pSplit.lines, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6, stagger: 0.08 }, '-=0.3')
      .to(ctas, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, '-=0.2');
  }

  private initCursor(): void {
    const root = this.rootRef.nativeElement;
    const ring = this.cursorRingRef.nativeElement;
    const dot = this.cursorDotRef.nativeElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    if (reducedMotion || !finePointer) {
      this.customCursorEnabled.set(false);
      return;
    }

    this.customCursorEnabled.set(true);
    root.style.cursor = 'none';

    const ringX = gsap.quickTo(ring, 'x', { duration: 0.18, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.18, ease: 'power3.out' });
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3.out' });

    gsap.set([ring, dot], { opacity: 0 });

    const setPointerPosition = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      ringX(localX - 16);
      ringY(localY - 16);
      dotX(localX - 4);
      dotY(localY - 4);
    };

    const onEnter = (event: PointerEvent) => {
      setPointerPosition(event);
      gsap.to([ring, dot], { opacity: 1, duration: 0.16, overwrite: 'auto' });
    };

    const onMove = (event: PointerEvent) => {
      setPointerPosition(event);
      const target = event.target as Element | null;
      const interactive = !!target?.closest('a, button, input, textarea, select, [role="button"]');
      gsap.to(ring, {
        scale: interactive ? 1.32 : 1,
        borderColor: interactive ? 'rgba(173, 232, 255, 0.95)' : 'rgba(173, 232, 255, 0.74)',
        duration: 0.14,
        overwrite: 'auto'
      });
      gsap.to(dot, { scale: interactive ? 0.75 : 1, duration: 0.14, overwrite: 'auto' });
    };

    const onLeave = () => {
      gsap.to([ring, dot], { opacity: 0, duration: 0.2, overwrite: 'auto' });
    };

    const onDown = () => {
      gsap.to(ring, { scale: 0.84, duration: 0.1, overwrite: 'auto' });
    };

    const onUp = () => {
      gsap.to(ring, { scale: 1, duration: 0.12, overwrite: 'auto' });
    };

    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointerup', onUp);

    this.cursorCleanup = () => {
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointerup', onUp);
    };
  }
}
