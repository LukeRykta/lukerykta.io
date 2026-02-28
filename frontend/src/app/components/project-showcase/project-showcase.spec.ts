import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ProjectShowcase } from './project-showcase';
import { ProjectPostsService } from '../../core/services/project-posts.service';
import { LikeService } from '../../core/services/like.service';

describe('ProjectShowcase', () => {
  let component: ProjectShowcase;
  let fixture: ComponentFixture<ProjectShowcase>;
  let projectPostsSpy: jasmine.SpyObj<ProjectPostsService>;
  let likeServiceSpy: jasmine.SpyObj<LikeService>;

  beforeEach(async () => {
    projectPostsSpy = jasmine.createSpyObj<ProjectPostsService>('ProjectPostsService', ['getTopProjects']);
    projectPostsSpy.getTopProjects.and.returnValue(of([
      {
        id: 1,
        title: 'Test Project',
        content: 'A test project description.',
        previewImageUrl: 'https://example.com/image.jpg',
        externalUrl: 'https://example.com',
        likeCount: 10
      }
    ]));

    likeServiceSpy = jasmine.createSpyObj<LikeService>('LikeService', ['seed', 'likeState$', 'like', 'unlike']);
    likeServiceSpy.likeState$.and.returnValue(of({ postId: '1', count: 10, liked: false }));
    likeServiceSpy.like.and.returnValue(of({ postId: '1', count: 11, liked: true }));
    likeServiceSpy.unlike.and.returnValue(of({ postId: '1', count: 9, liked: false }));

    await TestBed.configureTestingModule({
      imports: [ProjectShowcase],
      providers: [
        { provide: ProjectPostsService, useValue: projectPostsSpy },
        { provide: LikeService, useValue: likeServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectShowcase);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
