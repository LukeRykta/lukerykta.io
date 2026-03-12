import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';

import { InfiniteHero } from '../../components/infinite-hero/infinite-hero';
import { SiteFooter } from '../../components/site-footer/site-footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    InfiniteHero,
    SiteFooter
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements AfterViewInit, OnDestroy {
  @ViewChild('homeFooter', { read: ElementRef }) private homeFooterRef?: ElementRef<HTMLElement>;

  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private footerResizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.syncHeroFooterOverlap();

    if (typeof ResizeObserver === 'undefined' || !this.homeFooterRef) {
      return;
    }

    this.footerResizeObserver = new ResizeObserver(() => this.syncHeroFooterOverlap());
    this.footerResizeObserver.observe(this.homeFooterRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.footerResizeObserver?.disconnect();
  }

  private syncHeroFooterOverlap(): void {
    const footerHeight = this.homeFooterRef?.nativeElement.getBoundingClientRect().height ?? 0;
    if (footerHeight <= 0) {
      return;
    }

    this.hostRef.nativeElement.style.setProperty('--hero-footer-overlap', `${Math.ceil(footerHeight)}px`);
  }
}
