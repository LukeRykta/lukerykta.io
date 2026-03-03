import {CommonModule} from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Observable, TimeoutError, timeout } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';

import { ProjectPost, ProjectPostsService } from '../../core/services/project-posts.service';
import { LikeService, LikeState } from '../../core/services/like.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-project-showcase',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './project-showcase.html',
  styleUrl: './project-showcase.css'
})
export class ProjectShowcase implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly projectRequestTimeoutMs = 5000;

  readonly skeletonCardIds = [1, 2, 3, 4];
  readonly projects = signal<ProjectPost[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly likeError = signal<string | null>(null);

  private readonly likePending = signal<Set<number>>(new Set<number>());
  private readonly likeStateCache = new Map<number, Observable<LikeState>>();

  constructor(
    private readonly projectPosts: ProjectPostsService,
    private readonly likeService: LikeService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  reloadProjects(): void {
    if (this.loading()) {
      return;
    }
    this.loadProjects();
  }

  private loadProjects(): void {
    this.loading.set(true);
    this.error.set(null);
    this.projectPosts
      .getTopProjects(4)
      .pipe(timeout(this.projectRequestTimeoutMs), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (projects) => {
          this.projects.set(projects);
          projects.forEach((project) =>
            this.likeService.seed(
              this.postKey(project.id),
              project.likeCount,
              project.likedByCurrentUser
            )
          );
          this.resumePendingLikeIntent(projects);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load project posts', err);
          this.error.set(this.toLoadErrorMessage(err));
          this.loading.set(false);
        }
      });
  }

  private toLoadErrorMessage(err: unknown): string {
    if (err instanceof TimeoutError) {
      return 'The request timed out. Check your connection and try again.';
    }
    return 'Something went wrong while loading projects. Please try again.';
  }

  likeState(postId: number): Observable<LikeState> {
    let cached = this.likeStateCache.get(postId);
    if (!cached) {
      cached = this.likeService.likeState$(this.postKey(postId));
      this.likeStateCache.set(postId, cached);
    }
    return cached;
  }

  toggleLike(postId: number, liked: boolean | undefined): void {
    const postKey = this.postKey(postId);
    const canProceed = this.authService.requireAuthOrRedirect({
      kind: 'like',
      postId: postKey
    });
    if (!canProceed) {
      return;
    }
    this.likeError.set(null);
    if (this.isLikePending(postId)) {
      return;
    }
    this.setLikePending(postId, true);
    const action$ = liked
      ? this.likeService.unlike(postKey)
      : this.likeService.like(postKey);

    action$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.setLikePending(postId, false))
      )
      .subscribe({
        error: (err) => {
          console.error('Failed to update like state', err);
          this.likeError.set('Unable to update like right now. Please try again.');
        }
      });
  }

  isLikePending(postId: number): boolean {
    return this.likePending().has(postId);
  }

  private setLikePending(postId: number, pending: boolean): void {
    this.likePending.update((current) => {
      const next = new Set(current);
      if (pending) {
        next.add(postId);
      } else {
        next.delete(postId);
      }
      return next;
    });
  }

  private postKey(postId: number): string {
    return `${postId}`;
  }

  private resumePendingLikeIntent(projects: ProjectPost[]): void {
    const intent = this.authService.takePendingIntent();
    if (!this.authService.isLoggedIn() || intent?.kind !== 'like') {
      return;
    }
    const project = projects.find((candidate) => this.postKey(candidate.id) === intent.postId);
    if (!project) {
      return;
    }
    this.likeService.like(intent.postId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: (err) => {
        console.error('Failed to complete pending like action', err);
        this.likeError.set('Unable to update like right now. Please try again.');
      }
    });
  }
}
