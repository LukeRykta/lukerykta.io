import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { TimeoutError, of, throwError } from 'rxjs';
import { ExternalLink, LucideAngularModule, ThumbsUp } from 'lucide-angular';

import { ProjectShowcase } from './project-showcase';
import { ProjectPostsService } from '../../core/services/project-posts.service';
import { LikeService } from '../../core/services/like.service';
import { AuthService } from '../../core/auth/auth.service';

describe('ProjectShowcase', () => {
  let component: ProjectShowcase;
  let fixture: ComponentFixture<ProjectShowcase>;
  let projectPostsSpy: jasmine.SpyObj<ProjectPostsService>;
  let likeServiceSpy: jasmine.SpyObj<LikeService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const makeProject = () => ({
    id: 1,
    title: 'Test Project',
    content: 'A test project description.',
    previewImageUrl: 'https://example.com/image.jpg',
    externalUrl: 'https://example.com',
    likeCount: 10,
    likedByCurrentUser: false
  });

  beforeEach(async () => {
    projectPostsSpy = jasmine.createSpyObj<ProjectPostsService>('ProjectPostsService', ['getTopProjects']);
    likeServiceSpy = jasmine.createSpyObj<LikeService>('LikeService', [
      'seed',
      'likeState$',
      'like',
      'unlike'
    ]);
    likeServiceSpy.likeState$.and.returnValue(of({ postId: '1', count: 10, liked: false }));
    likeServiceSpy.like.and.returnValue(of({ postId: '1', count: 11, liked: true }));
    likeServiceSpy.unlike.and.returnValue(of({ postId: '1', count: 9, liked: false }));
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'requireAuthOrRedirect',
      'isLoggedIn',
      'takePendingIntent'
    ]);
    authServiceSpy.requireAuthOrRedirect.and.returnValue(true);
    authServiceSpy.isLoggedIn.and.returnValue(false);
    authServiceSpy.takePendingIntent.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [ProjectShowcase],
      providers: [
        { provide: ProjectPostsService, useValue: projectPostsSpy },
        { provide: LikeService, useValue: likeServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        importProvidersFrom(LucideAngularModule.pick({ ThumbsUp, ExternalLink }))
      ]
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(ProjectShowcase);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads project cards on init', () => {
    projectPostsSpy.getTopProjects.and.returnValue(of([makeProject()]));

    createComponent();

    expect(component.loading()).toBeFalse();
    expect(component.projects().length).toBe(1);
    expect(component.error()).toBeNull();
    expect(likeServiceSpy.seed).toHaveBeenCalledWith('1', 10, false);
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
      of([makeProject()])
    );

    createComponent();
    expect(component.error()).toBe('Something went wrong while loading projects. Please try again.');

    component.reloadProjects();

    expect(projectPostsSpy.getTopProjects).toHaveBeenCalledTimes(2);
    expect(component.error()).toBeNull();
    expect(component.projects().length).toBe(1);
    expect(component.loading()).toBeFalse();
  });
});
