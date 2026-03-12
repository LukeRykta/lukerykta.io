import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';

import { Home } from './home';
import { InfiniteHero } from '../../components/infinite-hero/infinite-hero';
import { SiteFooter } from '../../components/site-footer/site-footer';

@Component({
  selector: 'app-infinite-hero',
  standalone: true,
  template: '<div data-testid="hero-stub"></div>'
})
class InfiniteHeroStub {}

@Component({
  selector: 'app-site-footer',
  standalone: true,
  template: '<div data-testid="footer-stub"></div>'
})
class SiteFooterStub {}

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home, InfiniteHeroStub, SiteFooterStub]
    })
    .overrideComponent(Home, {
      remove: { imports: [InfiniteHero, SiteFooter] },
      add: { imports: [InfiniteHeroStub, SiteFooterStub] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render hero placeholder host', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="hero-stub"]')).toBeTruthy();
  });

  it('should render footer placeholder host', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="footer-stub"]')).toBeTruthy();
  });
});
