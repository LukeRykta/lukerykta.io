import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Github,
  House,
  Linkedin,
  LucideAngularModule,
  ShieldCheck,
  Trophy,
  UserRound
} from 'lucide-angular';

import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  let component: SiteFooter;
  let fixture: ComponentFixture<SiteFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteFooter],
      providers: [
        provideRouter([]),
        importProvidersFrom(
          LucideAngularModule.pick({
            House,
            BriefcaseBusiness,
            UserRound,
            ShieldCheck,
            Linkedin,
            Github,
            ArrowUpRight,
            Trophy
          })
        )
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SiteFooter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders expected social links', () => {
    const element = fixture.nativeElement as HTMLElement;

    const linkedIn = element.querySelector('[data-testid="footer-linkedin"]') as HTMLAnchorElement;
    const github = element.querySelector('[data-testid="footer-github"]') as HTMLAnchorElement;
    const devpost = element.querySelector('[data-testid="footer-devpost"]') as HTMLAnchorElement;

    expect(linkedIn?.href).toContain('linkedin.com/in/luke-ryktarsyk');
    expect(github?.href).toContain('github.com/LukeRykta');
    expect(devpost?.href).toContain('devpost.com/LukeRykta');
  });
});
