import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';

import { Home } from './home';
import { InfiniteHero } from '../../components/infinite-hero/infinite-hero';

@Component({
  selector: 'app-infinite-hero',
  standalone: true,
  template: '<div data-testid="hero-stub"></div>'
})
class InfiniteHeroStub {}

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home, InfiniteHeroStub]
    })
    .overrideComponent(Home, {
      remove: { imports: [InfiniteHero] },
      add: { imports: [InfiniteHeroStub] }
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
});
