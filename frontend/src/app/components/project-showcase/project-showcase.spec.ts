import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeoutError, of, throwError } from 'rxjs';

import { ProjectShowcase } from './project-showcase';
import { ProjectPostsService } from '../../core/services/project-posts.service';

describe('ProjectShowcase', () => {
  let component: ProjectShowcase;
  let fixture: ComponentFixture<ProjectShowcase>;
  let projectPostsSpy: jasmine.SpyObj<ProjectPostsService>;

  const makeProject = (id: number) => ({
    id,
    title: `Test Project ${id}`,
    content: 'A test project description.',
    previewImageUrl: `https://example.com/image-${id}.jpg`,
    externalUrl: `https://example.com/project-${id}`,
    likeCount: 10,
    likedByCurrentUser: false
  });

  beforeEach(async () => {
    if (!window.matchMedia) {
      (window as Window & { matchMedia: unknown }).matchMedia = () =>
        ({
          matches: false,
          media: '',
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false
        }) as MediaQueryList;
    }

    spyOn(window, 'matchMedia').and.returnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    } as MediaQueryList);

    projectPostsSpy = jasmine.createSpyObj<ProjectPostsService>('ProjectPostsService', [
      'getTopProjects'
    ]);

    await TestBed.configureTestingModule({
      imports: [ProjectShowcase],
      providers: [{ provide: ProjectPostsService, useValue: projectPostsSpy }]
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(ProjectShowcase);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads project cards on init and expands the gallery list', () => {
    projectPostsSpy.getTopProjects.and.returnValue(of([makeProject(1), makeProject(2)]));

    createComponent();

    expect(component.loading()).toBeFalse();
    expect(component.cards().length).toBe(12);
    expect(component.error()).toBeNull();
    expect(projectPostsSpy.getTopProjects).toHaveBeenCalledWith(7);
  });

  it('uses a concise timeout error message', () => {
    projectPostsSpy.getTopProjects.and.returnValue(throwError(() => new TimeoutError()));

    createComponent();

    expect(component.loading()).toBeFalse();
    expect(component.error()).toBe('The request timed out. Check your connection and try again.');
  });

  it('retries loading when reloadProjects is called', () => {
    projectPostsSpy.getTopProjects.and.returnValues(
      throwError(() => new Error('Network down')),
      of([makeProject(1)])
    );

    createComponent();
    expect(component.error()).toBe('Something went wrong while loading projects. Please try again.');

    component.reloadProjects();
    fixture.detectChanges();

    expect(projectPostsSpy.getTopProjects).toHaveBeenCalledTimes(2);
    expect(component.error()).toBeNull();
    expect(component.cards().length).toBe(12);
    expect(component.loading()).toBeFalse();
  });
});
