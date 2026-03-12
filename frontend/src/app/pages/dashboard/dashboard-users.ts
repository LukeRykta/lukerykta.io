import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal
} from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  LucideAngularModule
} from 'lucide-angular';
import { Subscription } from 'rxjs';

import {
  AdminService,
  AdminUserPage,
  AdminUserRow,
  AdminUserSortDirection,
  AdminUserSortKey
} from '../../core/services/admin.service';
import { DashboardRollingHeading } from './dashboard-rolling-heading';
import { DashboardCharsRevealDirective } from './dashboard-text-reveal.directive';

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

@Component({
  selector: 'app-dashboard-users',
  standalone: true,
  imports: [DatePipe, LowerCasePipe, LucideAngularModule, DashboardRollingHeading, DashboardCharsRevealDirective],
  templateUrl: './dashboard-users.html',
  styleUrl: './dashboard-users.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardUsers {
  private readonly admin = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);
  private usersRequest?: Subscription;

  readonly arrowDownIcon = ArrowDown;
  readonly arrowUpIcon = ArrowUp;
  readonly arrowUpDownIcon = ArrowUpDown;
  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;
  readonly refreshIcon = RefreshCw;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly users = signal<AdminUserRow[]>([]);
  readonly failedAvatarIds = signal<Set<number>>(new Set());
  readonly page = signal(0);
  readonly size = signal(DEFAULT_PAGE_SIZE);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly hasNext = signal(false);
  readonly hasPrevious = signal(false);
  readonly sortBy = signal<AdminUserSortKey>('lastSeen');
  readonly sortDirection = signal<AdminUserSortDirection>('desc');
  readonly rangeStart = computed(() => this.totalElements() === 0 ? 0 : this.page() * this.size() + 1);
  readonly rangeEnd = computed(() => Math.min((this.page() + 1) * this.size(), this.totalElements()));
  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    if (total <= 1) {
      return total === 1 ? [0] : [];
    }

    const windowSize = 5;
    let start = Math.max(0, this.page() - Math.floor(windowSize / 2));
    let end = Math.min(total, start + windowSize);
    start = Math.max(0, end - windowSize);

    return Array.from({ length: end - start }, (_unused, index) => start + index);
  });
  readonly sortSummary = computed(() => {
    const label = this.sortLabel(this.sortBy());
    const direction = this.sortDirection() === 'asc' ? 'ascending' : 'descending';
    return `${label}, ${direction}`;
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.usersRequest?.unsubscribe());
    this.loadUsers();
  }

  trackUser(_index: number, user: AdminUserRow): number {
    return user.id;
  }

  trackPage(_index: number, pageNumber: number): number {
    return pageNumber;
  }

  providerLabel(provider: string): string {
    return provider === 'github' ? 'GitHub' : provider === 'google' ? 'Google' : provider;
  }

  shouldShowAvatar(user: AdminUserRow): boolean {
    return !!user.avatarUrl && !this.failedAvatarIds().has(user.id);
  }

  markAvatarFailed(userId: number): void {
    const failed = new Set(this.failedAvatarIds());
    failed.add(userId);
    this.failedAvatarIds.set(failed);
  }

  userLabel(user: AdminUserRow): string {
    return user.displayName || user.email || 'User';
  }

  userInitial(user: AdminUserRow): string {
    return this.userLabel(user).trim().charAt(0).toUpperCase() || '?';
  }

  isActiveSort(column: AdminUserSortKey): boolean {
    return this.sortBy() === column;
  }

  toggleSort(column: AdminUserSortKey): void {
    const nextDirection = this.sortBy() === column
      ? this.invertDirection(this.sortDirection())
      : this.defaultDirection(column);

    this.loadUsers({
      page: 0,
      size: this.size(),
      sortBy: column,
      direction: nextDirection
    });
  }

  sortIcon(column: AdminUserSortKey) {
    if (this.sortBy() !== column) {
      return this.arrowUpDownIcon;
    }

    return this.sortDirection() === 'asc' ? this.arrowUpIcon : this.arrowDownIcon;
  }

  sortButtonLabel(column: AdminUserSortKey): string {
    if (this.sortBy() !== column) {
      return `Sort by ${this.sortLabel(column)}`;
    }

    const nextDirection = this.invertDirection(this.sortDirection());
    return `Sort by ${this.sortLabel(column)} ${nextDirection === 'asc' ? 'ascending' : 'descending'}`;
  }

  setPageSize(size: number): void {
    if (this.size() === size || this.loading()) {
      return;
    }

    this.loadUsers({
      page: 0,
      size,
      sortBy: this.sortBy(),
      direction: this.sortDirection()
    });
  }

  goToPage(pageNumber: number): void {
    if (this.loading() || pageNumber === this.page() || pageNumber < 0 || pageNumber >= this.totalPages()) {
      return;
    }

    this.loadUsers({
      page: pageNumber,
      size: this.size(),
      sortBy: this.sortBy(),
      direction: this.sortDirection()
    });
  }

  goToPreviousPage(): void {
    if (!this.hasPrevious()) {
      return;
    }

    this.goToPage(this.page() - 1);
  }

  goToNextPage(): void {
    if (!this.hasNext()) {
      return;
    }

    this.goToPage(this.page() + 1);
  }

  refreshUsers(): void {
    if (this.loading()) {
      return;
    }

    this.loadUsers({
      page: this.page(),
      size: this.size(),
      sortBy: this.sortBy(),
      direction: this.sortDirection()
    });
  }

  private loadUsers(request: {
    page: number;
    size: number;
    sortBy: AdminUserSortKey;
    direction: AdminUserSortDirection;
  } = {
    page: this.page(),
    size: this.size(),
    sortBy: this.sortBy(),
    direction: this.sortDirection()
  }): void {
    this.loading.set(true);
    this.error.set(null);
    this.usersRequest?.unsubscribe();

    this.usersRequest = this.admin.getUsers(request).subscribe({
      next: (response) => this.applyPage(response),
      error: () => {
        this.error.set('User records are unavailable right now.');
        this.loading.set(false);
      }
    });
  }

  private applyPage(response: AdminUserPage): void {
    this.users.set(response.items);
    this.failedAvatarIds.set(new Set());
    this.page.set(response.page);
    this.size.set(response.size);
    this.totalElements.set(response.totalElements);
    this.totalPages.set(response.totalPages);
    this.hasNext.set(response.hasNext);
    this.hasPrevious.set(response.hasPrevious);
    this.sortBy.set(response.sortBy);
    this.sortDirection.set(response.direction);
    this.loading.set(false);
  }

  private defaultDirection(column: AdminUserSortKey): AdminUserSortDirection {
    return column === 'visits' || column === 'firstLogin' || column === 'lastSeen' ? 'desc' : 'asc';
  }

  private invertDirection(direction: AdminUserSortDirection): AdminUserSortDirection {
    return direction === 'asc' ? 'desc' : 'asc';
  }

  private sortLabel(column: AdminUserSortKey): string {
    return column === 'firstLogin'
      ? 'first login'
      : column === 'visits'
        ? 'visits'
      : column === 'lastSeen'
        ? 'last seen'
        : column;
  }
}
