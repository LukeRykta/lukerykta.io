import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { App } from './app';
import { AuthService } from './core/auth/auth.service';
import { PageViewTrackerService } from './core/services/page-view-tracker.service';

describe('App', () => {
  let authServiceStub: Pick<AuthService, 'bootstrapSession' | 'isLoggedIn' | 'resumeFromStorage' | 'isAdmin'>;
  let pageViewTrackerStub: Pick<PageViewTrackerService, 'start'>;

  beforeEach(async () => {
    authServiceStub = {
      bootstrapSession: jasmine.createSpy('bootstrapSession').and.returnValue(of(null)),
      isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(false),
      resumeFromStorage: jasmine.createSpy('resumeFromStorage'),
      isAdmin: signal(false)
    };
    pageViewTrackerStub = {
      start: jasmine.createSpy('start')
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
        { provide: PageViewTrackerService, useValue: pageViewTrackerStub }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
    expect(pageViewTrackerStub.start).toHaveBeenCalled();
    expect(authServiceStub.bootstrapSession).toHaveBeenCalled();
  });

  it('should render navbar shell', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-navbar')).toBeTruthy();
  });
});
