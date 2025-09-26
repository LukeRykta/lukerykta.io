import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { apiUrl } from './backend-origin';

export interface LikeState {
  postId: string;
  count: number;
  liked: boolean;
}

interface LikeResponse {
  postId: number;
  likeCount: number;
}

@Injectable({ providedIn: 'root' })
export class LikeService {
  private states = new Map<string, BehaviorSubject<LikeState>>();

  constructor(private readonly http: HttpClient) {}

  likeState$(postId: string): Observable<LikeState> {
    return this.subject(postId).asObservable();
  }

  like(postId: string): Observable<LikeState> {
    const subject = this.subject(postId);
    const current = subject.getValue();
    if (current.liked) {
      return of(current);
    }
    return this.http.post<LikeResponse>(apiUrl(`/api/public/posts/${postId}/like`), {}).pipe(
      map((response) => {
        const next = { postId, liked: true, count: response.likeCount };
        subject.next(next);
        return next;
      })
    );
  }

  unlike(postId: string): Observable<LikeState> {
    const subject = this.subject(postId);
    const current = subject.getValue();
    if (!current.liked) {
      return of(current);
    }
    return this.http.post<LikeResponse>(apiUrl(`/api/public/posts/${postId}/unlike`), {}).pipe(
      map((response) => {
        const next = { postId, liked: false, count: response.likeCount };
        subject.next(next);
        return next;
      })
    );
  }

  toggle(postId: string): Observable<LikeState> {
    const current = this.subject(postId).getValue();
    return current.liked ? this.unlike(postId) : this.like(postId);
  }

  seed(postId: string, count = 0, liked = false): void {
    this.subject(postId).next({ postId, count, liked });
  }

  private subject(postId: string): BehaviorSubject<LikeState> {
    let state = this.states.get(postId);
    if (!state) {
      state = new BehaviorSubject<LikeState>({ postId, count: 0, liked: false });
      this.states.set(postId, state);
    }
    return state;
  }
}
