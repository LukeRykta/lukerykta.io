import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

export interface LikeState {
  postId: string;
  count: number;
  liked: boolean;
}

@Injectable({ providedIn: 'root' })
export class LikeService {
  private states = new Map<string, BehaviorSubject<LikeState>>();

  /** Dev knobs */
  latency = { min: 200, max: 600 };     // ms artificial delay
  failRate = 0;                         // 0..1 (e.g. 0.1 = 10% failures)
  failStatus: 401 | 500 = 500;          // which status to simulate on failure

  /** Stream of the current like state for a post (creates entry lazily). */
  likeState$(postId: string): Observable<LikeState> {
    return this.subject(postId).asObservable();
  }

  /** Idempotent 'like' */
  like(postId: string): Observable<LikeState> {
    return this.simulate().pipe(
      map(() => {
        const s = this.subject(postId);
        const cur = s.getValue();
        if (!cur.liked) s.next({ ...cur, liked: true, count: cur.count + 1 });
        return s.getValue();
      })
    );
  }

  /** Idempotent 'unlike' */
  unlike(postId: string): Observable<LikeState> {
    return this.simulate().pipe(
      map(() => {
        const s = this.subject(postId);
        const cur = s.getValue();
        if (cur.liked) s.next({ ...cur, liked: false, count: Math.max(0, cur.count - 1) });
        return s.getValue();
      })
    );
  }

  /** Convenience */
  toggle(postId: string): Observable<LikeState> {
    const cur = this.subject(postId).getValue();
    return cur.liked ? this.unlike(postId) : this.like(postId);
  }

  /** Optional: seed known values from SSR/list pages */
  seed(postId: string, count = 0, liked = false): void {
    this.subject(postId).next({ postId, count, liked });
  }

  // --- internals ---
  private subject(postId: string): BehaviorSubject<LikeState> {
    let s = this.states.get(postId);
    if (!s) {
      s = new BehaviorSubject<LikeState>({ postId, count: 0, liked: false });
      this.states.set(postId, s);
    }
    return s;
  }

  private simulate() {
    const ms = this.rand(this.latency.min, this.latency.max);
    if (Math.random() < this.failRate) {
      return timer(ms).pipe(
        switchMap(() => throwError(() => new HttpErrorResponse({
          status: this.failStatus,
          statusText: 'Mock failure',
          url: '/mock/like'
        })))
      );
    }
    return timer(ms).pipe(map(() => null));
  }

  private rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
