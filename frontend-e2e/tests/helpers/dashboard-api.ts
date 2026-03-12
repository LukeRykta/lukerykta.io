import { Page, Route } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type SessionState = {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  provider: 'google' | 'github';
  providerId: string;
  roles: string[];
  authenticated: boolean;
};

type AdminOverview = {
  totalUsers: number;
  totalVisits: number;
  visitsToday: number;
  visitsThisMonth: number;
  visitsThisYear: number;
  totalProjects: number;
  totalLikes: number;
  topRoutes: Array<{
    routePath: string;
    viewCount: number;
    uniqueVisitorCount: number;
    lastViewedAt: string;
  }>;
};

type AdminUserRow = {
  id: number;
  avatarUrl: string | null;
  email: string | null;
  displayName: string | null;
  provider: 'google' | 'github' | string;
  firstLoginAt: string;
  lastSeenAt: string;
  visitCount: number;
};

type AdminUserSortKey = 'name' | 'email' | 'provider' | 'visits' | 'firstLogin' | 'lastSeen';
type AdminUserSortDirection = 'asc' | 'desc';

type AdminUserPage = {
  items: AdminUserRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sortBy: AdminUserSortKey;
  direction: AdminUserSortDirection;
  hasNext: boolean;
  hasPrevious: boolean;
};

const DATA_DIR = resolve(process.cwd(), 'frontend-e2e', 'test-data', 'dashboard');
const adminSession = readJson<SessionState>('admin-session.json');
const overview = readJson<AdminOverview>('overview.json');
const users = readJson<AdminUserRow[]>('users-100.json');

function readJson<T>(fileName: string): T {
  return JSON.parse(readFileSync(resolve(DATA_DIR, fileName), 'utf8')) as T;
}

function normalizeSort(sortBy: string | null): AdminUserSortKey {
  return sortBy === 'name'
    || sortBy === 'email'
    || sortBy === 'provider'
    || sortBy === 'visits'
    || sortBy === 'firstLogin'
    || sortBy === 'lastSeen'
    ? sortBy
    : 'lastSeen';
}

function normalizeDirection(direction: string | null): AdminUserSortDirection {
  return direction === 'asc' ? 'asc' : 'desc';
}

function compareUsers(
  left: AdminUserRow,
  right: AdminUserRow,
  sortBy: AdminUserSortKey,
  direction: AdminUserSortDirection
): number {
  const multiplier = direction === 'asc' ? 1 : -1;

  const value = (() => {
    switch (sortBy) {
      case 'name':
        return (left.displayName ?? '').localeCompare(right.displayName ?? '', undefined, { numeric: true });
      case 'email':
        return (left.email ?? '').localeCompare(right.email ?? '', undefined, { numeric: true });
      case 'provider':
        return left.provider.localeCompare(right.provider);
      case 'visits':
        return left.visitCount - right.visitCount;
      case 'firstLogin':
        return Date.parse(left.firstLoginAt) - Date.parse(right.firstLoginAt);
      case 'lastSeen':
        return Date.parse(left.lastSeenAt) - Date.parse(right.lastSeenAt);
      default:
        return 0;
    }
  })();

  if (value !== 0) {
    return value * multiplier;
  }

  return (right.id - left.id) * multiplier;
}

function buildUsersPage(requestUrl: string): AdminUserPage {
  const url = new URL(requestUrl);
  const page = Math.max(Number.parseInt(url.searchParams.get('page') ?? '0', 10) || 0, 0);
  const size = Math.max(Number.parseInt(url.searchParams.get('size') ?? '10', 10) || 10, 1);
  const sortBy = normalizeSort(url.searchParams.get('sortBy'));
  const direction = normalizeDirection(url.searchParams.get('direction'));

  const sorted = [...users].sort((left, right) => compareUsers(left, right, sortBy, direction));
  const totalElements = sorted.length;
  const totalPages = Math.max(Math.ceil(totalElements / size), 1);
  const normalizedPage = Math.min(page, totalPages - 1);
  const start = normalizedPage * size;
  const items = sorted.slice(start, start + size);

  return {
    items,
    page: normalizedPage,
    size,
    totalElements,
    totalPages,
    sortBy,
    direction,
    hasNext: normalizedPage < totalPages - 1,
    hasPrevious: normalizedPage > 0
  };
}

async function fulfillJson(route: Route, payload: unknown): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(payload)
  });
}

export async function mockDashboardApis(page: Page): Promise<void> {
  await page.route('http://localhost:8080/api/me', (route) => fulfillJson(route, adminSession));
  await page.route('http://localhost:8080/api/admin/stats/overview', (route) => fulfillJson(route, overview));
  await page.route(/http:\/\/localhost:8080\/api\/admin\/users(\?.*)?$/, (route) =>
    fulfillJson(route, buildUsersPage(route.request().url()))
  );
}
