import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  QueryList,
  ViewChildren,
  signal
} from '@angular/core';
import { gsap } from 'gsap';
import { Observer } from 'gsap/Observer';

interface ProjectsSlide {
  id: string;
  eyebrow: string;
  heading: string;
  headingChars: string[];
  summary: string;
  tags: string[];
  colorStart: string;
  colorEnd: string;
  glow: string;
  mesh: string;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects.html',
  styleUrl: './projects.css'
})
export class Projects implements AfterViewInit, OnDestroy {
  @ViewChildren('sectionEl', { read: ElementRef }) private sectionRefs!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('outerEl', { read: ElementRef }) private outerRefs!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('innerEl', { read: ElementRef }) private innerRefs!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('bgEl', { read: ElementRef }) private bgRefs!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('headingEl', { read: ElementRef }) private headingRefs!: QueryList<ElementRef<HTMLElement>>;

  readonly slides: ProjectsSlide[] = this.createSlides();
  readonly activeIndex = signal(0);

  private sectionElements: HTMLElement[] = [];
  private outerElements: HTMLElement[] = [];
  private innerElements: HTMLElement[] = [];
  private bgElements: HTMLElement[] = [];
  private headingCharElements: HTMLElement[][] = [];

  private observer?: Observer;
  private activeTimeline?: gsap.core.Timeline;
  private currentIndex = -1;
  private animating = false;
  private reducedMotion = false;
  private introPlayed = false;

  private readonly wrapIndex = gsap.utils.wrap(0, this.slides.length);
  private static observerPluginRegistered = false;

  ngAfterViewInit(): void {
    if (!Projects.observerPluginRegistered) {
      gsap.registerPlugin(Observer);
      Projects.observerPluginRegistered = true;
    }

    this.captureElements();
    if (!this.sectionElements.length) {
      return;
    }

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.set(this.sectionElements, { autoAlpha: 0, zIndex: 0 });
    gsap.set(this.outerElements, { xPercent: 100 });
    gsap.set(this.innerElements, { xPercent: -100 });

    this.gotoSection(0, 1, true);

    if (this.reducedMotion) {
      return;
    }

    this.playIntroFocus(0);

    this.observer = Observer.create({
      type: 'wheel,touch,pointer',
      wheelSpeed: -1,
      tolerance: 10,
      preventDefault: true,
      onDown: () => {
        if (!this.animating) {
          this.gotoSection(this.currentIndex - 1, -1);
        }
      },
      onUp: () => {
        if (!this.animating) {
          this.gotoSection(this.currentIndex + 1, 1);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.activeTimeline?.kill();
    this.observer?.kill();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.reducedMotion || this.animating) {
      return;
    }

    if (
      event.key === 'ArrowRight' ||
      event.key === 'ArrowDown' ||
      event.key === 'PageDown' ||
      event.key === ' '
    ) {
      event.preventDefault();
      this.gotoSection(this.currentIndex + 1, 1);
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      this.gotoSection(this.currentIndex - 1, -1);
    }
  }

  jumpTo(index: number): void {
    if (this.animating || index === this.currentIndex) {
      return;
    }
    const direction: -1 | 1 = index < this.currentIndex ? -1 : 1;
    this.gotoSection(index, direction);
  }

  private gotoSection(index: number, direction: -1 | 1, immediate = false): void {
    const nextIndex = this.wrapIndex(index);
    const fromTop = direction === -1;
    const directionFactor = fromTop ? -1 : 1;

    const nextSection = this.sectionElements[nextIndex];
    const nextOuter = this.outerElements[nextIndex];
    const nextInner = this.innerElements[nextIndex];
    const nextBg = this.bgElements[nextIndex];
    const nextChars = this.headingCharElements[nextIndex];

    if (!nextSection || !nextOuter || !nextInner || !nextBg || !nextChars) {
      return;
    }

    if (immediate) {
      gsap.set(nextSection, { autoAlpha: 1, zIndex: 1 });
      gsap.set([nextOuter, nextInner, nextBg], { xPercent: 0 });
      gsap.set(nextChars, { autoAlpha: 1, xPercent: 0, rotateY: 0 });
      this.currentIndex = nextIndex;
      this.activeIndex.set(nextIndex);
      return;
    }

    this.animating = true;
    this.activeTimeline?.kill();

    const timeline = gsap.timeline({
      defaults: { duration: 1.1, ease: 'power1.inOut' },
      onComplete: () => {
        this.animating = false;
      }
    });
    this.activeTimeline = timeline;

    if (this.currentIndex >= 0) {
      const currentSection = this.sectionElements[this.currentIndex];
      const currentBg = this.bgElements[this.currentIndex];
      gsap.set(currentSection, { zIndex: 0 });
      timeline.to(currentBg, { xPercent: -12 * directionFactor }, 0).set(currentSection, { autoAlpha: 0 });
    }

    gsap.set(nextSection, { autoAlpha: 1, zIndex: 1 });
    timeline
      .fromTo(
        [nextOuter, nextInner],
        {
          xPercent: (elementIndex: number) =>
            elementIndex === 0 ? 100 * directionFactor : -100 * directionFactor
        },
        { xPercent: 0 },
        0
      )
      .fromTo(nextBg, { xPercent: 12 * directionFactor }, { xPercent: 0 }, 0)
      .fromTo(
        nextChars,
        { autoAlpha: 0, xPercent: 150 * directionFactor, rotateY: 32 * directionFactor },
        {
          autoAlpha: 1,
          xPercent: 0,
          rotateY: 0,
          duration: 0.92,
          ease: 'power2.out',
          stagger: {
            each: 0.016,
            from: 'random'
          }
        },
        0.18
      );

    this.currentIndex = nextIndex;
    this.activeIndex.set(nextIndex);
  }

  private playIntroFocus(index: number): void {
    if (this.introPlayed) {
      return;
    }

    const section = this.sectionElements[index];
    const bg = this.bgElements[index];
    const chars = this.headingCharElements[index];
    if (!section || !bg || !chars?.length) {
      return;
    }

    const eyebrow = section.querySelector<HTMLElement>('.slide-eyebrow');
    const summary = section.querySelector<HTMLElement>('.summary');
    const tags = Array.from(section.querySelectorAll<HTMLElement>('.tag-row li'));
    const supportingCopy = [eyebrow, summary].filter((item): item is HTMLElement => !!item);

    this.animating = true;
    this.activeTimeline?.kill();

    gsap.set(bg, { filter: 'blur(20px)' });
    gsap.set(chars, { autoAlpha: 0, y: 24, filter: 'blur(8px)' });
    gsap.set(supportingCopy, { autoAlpha: 0, y: 16, filter: 'blur(6px)' });
    gsap.set(tags, { autoAlpha: 0, y: 12, filter: 'blur(4px)' });

    const intro = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: () => {
        this.animating = false;
        this.introPlayed = true;
      }
    });
    this.activeTimeline = intro;

    intro
      .to(bg, { filter: 'blur(0px)', duration: 1.05 }, 0)
      .to(
        chars,
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.86,
          stagger: { each: 0.015, from: 'random' }
        },
        0.22
      )
      .to(
        supportingCopy,
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.68,
          stagger: 0.08
        },
        0.42
      )
      .to(
        tags,
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.54,
          stagger: 0.04
        },
        0.52
      );
  }

  private captureElements(): void {
    this.sectionElements = this.sectionRefs.toArray().map((ref) => ref.nativeElement);
    this.outerElements = this.outerRefs.toArray().map((ref) => ref.nativeElement);
    this.innerElements = this.innerRefs.toArray().map((ref) => ref.nativeElement);
    this.bgElements = this.bgRefs.toArray().map((ref) => ref.nativeElement);
    this.headingCharElements = this.headingRefs
      .toArray()
      .map((headingRef) => Array.from(headingRef.nativeElement.querySelectorAll<HTMLElement>('.char')));
  }

  private createSlides(): ProjectsSlide[] {
    const slides: Omit<ProjectsSlide, 'headingChars'>[] = [
      {
        id: 'systems',
        eyebrow: 'Featured Work',
        heading: 'Production Systems',
        summary:
          'Cloud-native services focused on reliability, observability, and throughput at financial scale.',
        tags: ['Java', 'Spring Boot', 'Kafka', 'Datadog'],
        colorStart: '#0c1328',
        colorEnd: '#112746',
        glow: '#67d7ff',
        mesh: '#2ef0b6'
      },
      {
        id: 'experience',
        eyebrow: 'Frontend',
        heading: 'Interactive Interfaces',
        summary:
          'Responsive user flows with animation and clear visual hierarchy, built for speed and clarity.',
        tags: ['Angular', 'TypeScript', 'GSAP', 'Cypress'],
        colorStart: '#111029',
        colorEnd: '#2b1442',
        glow: '#b3b6ff',
        mesh: '#58e7ff'
      },
      {
        id: 'delivery',
        eyebrow: 'Platform',
        heading: 'Delivery Pipelines',
        summary:
          'Automated CI/CD with resilient quality gates to ship safer changes across distributed services.',
        tags: ['Jenkins', 'Maven', 'JUnit', 'Nx'],
        colorStart: '#10171f',
        colorEnd: '#133447',
        glow: '#5be6ff',
        mesh: '#66ffc7'
      },
      {
        id: 'data',
        eyebrow: 'Data',
        heading: 'Streaming + Storage',
        summary:
          'Event-driven processing and durable storage patterns designed for traceability and consistency.',
        tags: ['Kafka', 'MySQL', 'MongoDB', 'AWS'],
        colorStart: '#12101f',
        colorEnd: '#2a1939',
        glow: '#7cd6ff',
        mesh: '#69f2d1'
      },
      {
        id: 'journey',
        eyebrow: 'Journey',
        heading: 'From Intern To Engineer',
        summary:
          'A progression from rapid prototyping to ownership of mission-critical services and on-call support.',
        tags: ['Agile', 'Incident Response', 'Mentorship', 'Ownership'],
        colorStart: '#101424',
        colorEnd: '#172f3e',
        glow: '#66f5ff',
        mesh: '#77e9ff'
      }
    ];

    return slides.map((slide) => ({
      ...slide,
      headingChars: Array.from(slide.heading)
    }));
  }
}
