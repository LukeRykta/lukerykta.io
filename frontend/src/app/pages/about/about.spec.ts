import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { of } from 'rxjs';
import { LucideAngularModule, ThumbsUp } from 'lucide-angular';

import { About } from './about';
import { AuthService } from '../../core/auth/auth.service';
import { LikeService } from '../../core/services/like.service';

describe('About', () => {
  let component: About;
  let fixture: ComponentFixture<About>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let likeServiceSpy: jasmine.SpyObj<LikeService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'takePendingIntent',
      'isLoggedIn',
      'requireAuthOrRedirect'
    ]);
    authServiceSpy.takePendingIntent.and.returnValue(null);
    authServiceSpy.isLoggedIn.and.returnValue(false);
    authServiceSpy.requireAuthOrRedirect.and.returnValue(true);

    likeServiceSpy = jasmine.createSpyObj<LikeService>('LikeService', ['likeState$', 'like']);
    likeServiceSpy.likeState$.and.returnValue(
      of({ postId: 'about-page', count: 0, liked: false })
    );
    likeServiceSpy.like.and.returnValue(of({ postId: 'about-page', count: 1, liked: true }));

    await TestBed.configureTestingModule({
      imports: [About],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: LikeService, useValue: likeServiceSpy },
        importProvidersFrom(LucideAngularModule.pick({ ThumbsUp }))
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(About);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
