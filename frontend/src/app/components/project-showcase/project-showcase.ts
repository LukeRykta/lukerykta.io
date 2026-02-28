import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';

import { ProjectPost, ProjectPostsService } from '../../core/services/project-posts.service';
import { LikeService, LikeState } from '../../core/services/like.service';

@Component({
  selector: 'app-project-showcase',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './project-showcase.html',
  styleUrl: './project-showcase.css'
})
export class ProjectShowcase implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly projects = signal<ProjectPost[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly likeError = signal<string | null>(null);

  private readonly likePending = signal<Set<number>>(new Set<number>());
  private readonly likeStateCache = new Map<number, Observable<LikeState>>();

  constructor(
    private readonly projectPosts: ProjectPostsService,
    private readonly likeService: LikeService
  ) {}

  ngOnInit(): void {
    this.projectPosts
      .getTopProjects(4)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (projects) => {
          this.projects.set(projects);
          projects.forEach((project) =>
            this.likeService.seed(this.postKey(project.id), project.likeCount)
          );
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load project posts', err);
          this.error.set('Unable to load projects right now. Please try again later.');
          this.loading.set(false);
        }
      });
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
    this.likeError.set(null);
    if (this.isLikePending(postId)) {
      return;
    }
    this.setLikePending(postId, true);
    const action$ = liked
      ? this.likeService.unlike(this.postKey(postId))
      : this.likeService.like(this.postKey(postId));

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
}
