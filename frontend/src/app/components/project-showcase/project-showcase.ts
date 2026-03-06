import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { TimeoutError, timeout } from 'rxjs';

import { ProjectPost, ProjectPostsService } from '../../core/services/project-posts.service';

interface ShowcaseCard extends ProjectPost {
  key: string;
}

@Component({
  selector: 'app-project-showcase',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-showcase.html',
  styleUrl: './project-showcase.css'
})
export class ProjectShowcase implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gallery') private galleryRef?: ElementRef<HTMLElement>;
  @ViewChild('cardsContainer') private cardsContainerRef?: ElementRef<HTMLElement>;
  @ViewChild('dragProxy') private dragProxyRef?: ElementRef<HTMLElement>;
  @ViewChildren('cardEl', { read: ElementRef }) private cardRefs!: QueryList<ElementRef<HTMLElement>>;

  private readonly destroyRef = inject(DestroyRef);
  private readonly projectRequestTimeoutMs = 5000;
  private readonly cardSpacing = 0.1;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly cards = signal<ShowcaseCard[]>([]);

  private seamlessLoop?: gsap.core.Timeline;
  private scrub?: gsap.core.Tween;
  private dragInstances: Draggable[] = [];
  private wheelCleanup?: () => void;
  private readonly playhead = { offset: 0 };
  private viewReady = false;
  private snapOffset = gsap.utils.snap(this.cardSpacing);
  private static pluginRegistered = false;

  constructor(private readonly projectPosts: ProjectPostsService) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  ngAfterViewInit(): void {
    if (!ProjectShowcase.pluginRegistered) {
      gsap.registerPlugin(Draggable);
      ProjectShowcase.pluginRegistered = true;
    }

    this.viewReady = true;
    this.cardRefs.changes.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.initLoopIfReady();
    });
    this.initLoopIfReady();
  }

  ngOnDestroy(): void {
    this.destroyLoop();
  }

  reloadProjects(): void {
    if (this.loading()) {
      return;
    }
    this.loadProjects();
  }

  scrollNext(): void {
    this.setOffset(this.currentOffset() + this.cardSpacing);
  }

  scrollPrev(): void {
    this.setOffset(this.currentOffset() - this.cardSpacing);
  }

  backgroundImage(project: ProjectPost): string {
    if (project.previewImageUrl) {
      return `linear-gradient(180deg, rgba(2, 5, 12, 0.15) 35%, rgba(2, 5, 12, 0.88) 100%), url("${project.previewImageUrl}")`;
    }
    return 'linear-gradient(145deg, rgba(56, 189, 248, 0.38), rgba(59, 130, 246, 0.42), rgba(15, 23, 42, 0.95))';
  }

  private loadProjects(): void {
    this.loading.set(true);
    this.error.set(null);
    this.destroyLoop();

    this.projectPosts
      .getTopProjects(7)
      .pipe(timeout(this.projectRequestTimeoutMs), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (projects) => {
          this.cards.set(this.buildCards(projects));
          this.loading.set(false);
          requestAnimationFrame(() => this.initLoopIfReady());
        },
        error: (err) => {
          console.error('Failed to load project posts', err);
          this.error.set(this.toLoadErrorMessage(err));
          this.loading.set(false);
        }
      });
  }

  private initLoopIfReady(): void {
    if (!this.viewReady || this.loading() || this.error()) {
      return;
    }
    const cardElements = this.cardRefs?.toArray().map((cardRef) => cardRef.nativeElement) ?? [];
    if (!cardElements.length) {
      return;
    }
    this.setupLoop(cardElements);
  }

  private setupLoop(cardElements: HTMLElement[]): void {
    this.destroyLoop();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(cardElements, { clearProps: 'all' });
      return;
    }

    this.snapOffset = gsap.utils.snap(this.cardSpacing);
    gsap.set(cardElements, { xPercent: 400, opacity: 0, scale: 0 });

    const animateCard = (element: HTMLElement): gsap.core.Timeline => {
      const timeline = gsap.timeline();
      timeline
        .fromTo(
          element,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            zIndex: 100,
            duration: 0.5,
            yoyo: true,
            repeat: 1,
            ease: 'power1.in',
            immediateRender: false
          }
        )
        .fromTo(
          element,
          { xPercent: 400 },
          { xPercent: -400, duration: 1, ease: 'none', immediateRender: false },
          0
        );
      return timeline;
    };

    this.seamlessLoop = this.buildSeamlessLoop(cardElements, this.cardSpacing, animateCard);
    const wrapTime = gsap.utils.wrap(0, this.seamlessLoop.duration());

    this.playhead.offset = 0;
    this.scrub = gsap.to(this.playhead, {
      offset: 0,
      duration: 0.5,
      ease: 'power3',
      paused: true,
      onUpdate: () => {
        this.seamlessLoop?.time(wrapTime(this.playhead.offset));
      }
    });

    this.setOffset(0);
    this.attachWheel();
    this.attachDrag();
  }

  private attachWheel(): void {
    const gallery = this.galleryRef?.nativeElement;
    if (!gallery) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? this.cardSpacing : -this.cardSpacing;
      this.setOffset(this.currentOffset() + delta);
    };

    gallery.addEventListener('wheel', onWheel, { passive: false });
    this.wheelCleanup = () => gallery.removeEventListener('wheel', onWheel);
  }

  private attachDrag(): void {
    const dragProxy = this.dragProxyRef?.nativeElement;
    const cardsContainer = this.cardsContainerRef?.nativeElement;
    if (!dragProxy || !cardsContainer) {
      return;
    }

    const component = this;
    this.dragInstances = Draggable.create(dragProxy, {
      type: 'x',
      trigger: cardsContainer,
      onPress(this: Draggable) {
        (this as Draggable & { startOffset?: number }).startOffset = component.currentOffset();
      },
      onDrag(this: Draggable) {
        const draggable = this as Draggable & { startOffset?: number };
        const startOffset = draggable.startOffset ?? 0;
        component.setOffset(startOffset + (this.startX - this.x) * 0.0015);
      },
      onDragEnd() {
        component.setOffset(component.currentOffset());
      }
    });
  }

  private setOffset(offset: number): void {
    if (!this.scrub) {
      return;
    }
    this.scrub.vars['offset'] = this.snapOffset(offset);
    this.scrub.invalidate().restart();
  }

  private currentOffset(): number {
    const current = this.scrub?.vars['offset'];
    return typeof current === 'number' ? current : this.playhead.offset;
  }

  private destroyLoop(): void {
    this.wheelCleanup?.();
    this.wheelCleanup = undefined;
    this.dragInstances.forEach((dragInstance) => dragInstance.kill());
    this.dragInstances = [];
    this.scrub?.kill();
    this.scrub = undefined;
    this.seamlessLoop?.kill();
    this.seamlessLoop = undefined;
  }

  private buildCards(projects: ProjectPost[]): ShowcaseCard[] {
    if (!projects.length) {
      return [];
    }

    const targetCount = Math.max(projects.length * 2, 12);
    const cards: ShowcaseCard[] = [];
    for (let index = 0; index < targetCount; index += 1) {
      const source = projects[index % projects.length];
      cards.push({
        ...source,
        key: `${source.id}-${index}`
      });
    }
    return cards;
  }

  private toLoadErrorMessage(err: unknown): string {
    if (err instanceof TimeoutError) {
      return 'The request timed out. Check your connection and try again.';
    }
    return 'Something went wrong while loading projects. Please try again.';
  }

  private buildSeamlessLoop(
    items: HTMLElement[],
    spacing: number,
    animateFunc: (element: HTMLElement) => gsap.core.Timeline
  ): gsap.core.Timeline {
    const overlap = Math.ceil(1 / spacing);
    const startTime = items.length * spacing + 0.5;
    const loopTime = (items.length + overlap) * spacing + 1;
    const rawSequence = gsap.timeline({ paused: true });
    const seamlessLoop = gsap.timeline({ paused: true, repeat: -1 });
    const length = items.length + overlap * 2;

    for (let index = 0; index < length; index += 1) {
      const wrappedIndex = index % items.length;
      const time = index * spacing;
      rawSequence.add(animateFunc(items[wrappedIndex]), time);
      if (index <= items.length) {
        seamlessLoop.add(`label${index}`, time);
      }
    }

    rawSequence.time(startTime);
    seamlessLoop
      .to(rawSequence, {
        time: loopTime,
        duration: loopTime - startTime,
        ease: 'none'
      })
      .fromTo(
        rawSequence,
        { time: overlap * spacing + 1 },
        {
          time: startTime,
          duration: startTime - (overlap * spacing + 1),
          immediateRender: false,
          ease: 'none'
        }
      );

    return seamlessLoop;
  }
}
