import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.css'
})
export class SiteFooter implements AfterViewInit, OnDestroy {
  readonly year = new Date().getFullYear();
  private isFocused = false;

  @ViewChild('root', { static: true }) private rootRef!: ElementRef<HTMLElement>;

  private intersectionObserver?: IntersectionObserver;

  ngAfterViewInit(): void {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      this.setFocused();
      return;
    }

    const root = this.rootRef.nativeElement;
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || !entry.isIntersecting) {
          return;
        }

        this.setFocused();
        this.intersectionObserver?.disconnect();
      },
      {
        threshold: 0.001
      }
    );

    this.intersectionObserver.observe(root);

    requestAnimationFrame(() => {
      const rect = root.getBoundingClientRect();
      const atPageBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      if (rect.top <= window.innerHeight + 2 || atPageBottom) {
        this.setFocused();
        this.intersectionObserver?.disconnect();
      }
    });
  }

  ngOnDestroy(): void {
    this.intersectionObserver?.disconnect();
  }

  private setFocused(): void {
    if (this.isFocused) {
      return;
    }

    this.isFocused = true;
    this.rootRef.nativeElement.classList.add('is-focused');
  }
}
