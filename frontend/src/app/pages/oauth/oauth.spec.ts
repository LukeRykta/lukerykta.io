import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { Oauth } from './oauth';

describe('Oauth', () => {
  let component: Oauth;
  let fixture: ComponentFixture<Oauth>;
  let redirectParam: string | null;

  const activatedRouteStub = {
    snapshot: {
      get queryParamMap() {
        return convertToParamMap(redirectParam ? { redirect: redirectParam } : {});
      }
    }
  };

  const createComponent = (): void => {
    fixture = TestBed.createComponent(Oauth);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    redirectParam = '/projects?view=grid';
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Oauth],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: activatedRouteStub
        }
      ]
    }).compileComponents();

    createComponent();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render provider actions and redirect context', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Continue with Google');
    expect(text).toContain('Continue with GitHub');
    expect(text).toContain('Projects');
    expect(text).toContain('/projects?view=grid');
    expect(sessionStorage.getItem('app.redirect.url')).toBe('/projects?view=grid');
  });

  it('should announce the active provider once login starts', () => {
    const redirectSpy = spyOn<any>(component, 'redirectToProvider').and.stub();

    component.continueWith('github');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(component.pendingProvider()).toBe('github');
    expect(text).toContain('Opening GitHub secure sign-in');
    expect(redirectSpy).toHaveBeenCalledOnceWith('github');
  });

  it('should ignore repeated clicks after a provider is pending', () => {
    const redirectSpy = spyOn<any>(component, 'redirectToProvider').and.stub();

    component.continueWith('google');
    component.continueWith('github');

    expect(component.pendingProvider()).toBe('google');
    expect(redirectSpy).toHaveBeenCalledTimes(1);
    expect(redirectSpy).toHaveBeenCalledWith('google');
  });

  it('should reject external redirect targets', () => {
    fixture.destroy();
    sessionStorage.clear();
    redirectParam = 'https://evil.example/phish';

    createComponent();

    const text = fixture.nativeElement.textContent as string;
    expect(component.redirectPath()).toBeNull();
    expect(text).toContain('home');
    expect(sessionStorage.getItem('app.redirect.url')).toBeNull();
  });
});
