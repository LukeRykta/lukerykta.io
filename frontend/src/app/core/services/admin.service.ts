import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { apiUrl } from './backend-origin';

export interface AdminPopularRoute {
  routePath: string;
  viewCount: number;
  uniqueVisitorCount: number;
  lastViewedAt: string;
}

export interface AdminOverview {
  totalUsers: number;
  totalVisits: number;
  visitsToday: number;
  visitsThisMonth: number;
  visitsThisYear: number;
  totalProjects: number;
  totalLikes: number;
  topRoutes: AdminPopularRoute[];
}

export interface AdminUserRow {
  id: number;
  avatarUrl: string | null;
  email: string | null;
  displayName: string | null;
  provider: 'google' | 'github' | string;
  firstLoginAt: string;
  lastSeenAt: string;
  visitCount: number;
}

export type AdminUserSortKey = 'name' | 'email' | 'provider' | 'visits' | 'firstLogin' | 'lastSeen';
export type AdminUserSortDirection = 'asc' | 'desc';

export interface AdminUserPage {
  items: AdminUserRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sortBy: AdminUserSortKey;
  direction: AdminUserSortDirection;
  hasNext: boolean;
  hasPrevious: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  getOverview() {
    return this.http.get<AdminOverview>(apiUrl('/api/admin/stats/overview'), {
      withCredentials: true
    });
  }

  getUsers(params: {
    page: number;
    size: number;
    sortBy: AdminUserSortKey;
    direction: AdminUserSortDirection;
  }) {
    return this.http.get<AdminUserPage>(apiUrl('/api/admin/users'), {
      params: {
        page: params.page,
        size: params.size,
        sortBy: params.sortBy,
        direction: params.direction
      },
      withCredentials: true
    });
  }
}
