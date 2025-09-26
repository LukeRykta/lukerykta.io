import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ProjectPost {
  id: number;
  title: string;
  content: string;
  previewImageUrl: string;
  externalUrl: string;
  likeCount: number;
}

interface ProjectPostResponse {
  id: number;
  title: string;
  content: string;
  previewImageUrl: string | null;
  externalUrl: string | null;
  likeCount: number;
}

@Injectable({ providedIn: 'root' })
export class ProjectPostsService {
  constructor(private readonly http: HttpClient) {}

  getTopProjects(limit = 4): Observable<ProjectPost[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http
      .get<ProjectPostResponse[]>(`/api/public/posts/projects`, { params })
      .pipe(
        map((posts) =>
          posts.map((post) => ({
            ...post,
            previewImageUrl: post.previewImageUrl ?? '',
            externalUrl: post.externalUrl ?? '#'
          }))
        )
      );
  }
}
