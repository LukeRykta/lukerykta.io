import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import {
  AdminService,
  AdminUserPage,
  AdminUserSortDirection,
  AdminUserSortKey
} from '../../core/services/admin.service';
import { DashboardUsers } from './dashboard-users';

describe('DashboardUsers', () => {
  let fixture: ComponentFixture<DashboardUsers>;
  let adminStub: { getUsers: jasmine.Spy };

  const createPage = (overrides?: Partial<AdminUserPage>): AdminUserPage => ({
    items: [
      {
        id: 7,
        avatarUrl: 'https://lh3.googleusercontent.com/a/example-user-photo',
        email: 'luke@example.com',
        displayName: 'Luke',
        provider: 'google',
        firstLoginAt: '2026-03-08T12:00:00',
        lastSeenAt: '2026-03-11T15:15:03',
        visitCount: 8
      }
    ],
    page: 0,
    size: 10,
    totalElements: 24,
    totalPages: 3,
    sortBy: 'lastSeen',
    direction: 'desc',
    hasNext: true,
    hasPrevious: false,
    ...overrides
  });

  beforeEach(async () => {
    adminStub = {
      getUsers: jasmine.createSpy('getUsers').and.callFake(
        (request: {
          page: number;
          size: number;
          sortBy: AdminUserSortKey;
          direction: AdminUserSortDirection;
        }) => of(createPage({
          page: request.page,
          size: request.size,
          sortBy: request.sortBy,
          direction: request.direction,
          hasPrevious: request.page > 0,
          hasNext: request.page < 2
        }))
      )
    };

    await TestBed.configureTestingModule({
      imports: [DashboardUsers],
      providers: [{ provide: AdminService, useValue: adminStub }]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardUsers);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should request the first page sorted by last seen descending by default', () => {
    expect(adminStub.getUsers).toHaveBeenCalledOnceWith({
      page: 0,
      size: 10,
      sortBy: 'lastSeen',
      direction: 'desc'
    });
  });

  it('should toggle sort direction when the same column is selected again', () => {
    const component = fixture.componentInstance;

    component.toggleSort('name');
    fixture.detectChanges();

    expect(adminStub.getUsers).toHaveBeenCalledWith({
      page: 0,
      size: 10,
      sortBy: 'name',
      direction: 'asc'
    });

    component.toggleSort('name');
    fixture.detectChanges();

    expect(adminStub.getUsers).toHaveBeenCalledWith({
      page: 0,
      size: 10,
      sortBy: 'name',
      direction: 'desc'
    });
  });

  it('should sort visits descending the first time that column is selected', () => {
    const component = fixture.componentInstance;

    component.toggleSort('visits');
    fixture.detectChanges();

    expect(adminStub.getUsers).toHaveBeenCalledWith({
      page: 0,
      size: 10,
      sortBy: 'visits',
      direction: 'desc'
    });
  });

  it('should request the next page when pagination advances', () => {
    const component = fixture.componentInstance;

    component.goToNextPage();
    fixture.detectChanges();

    expect(adminStub.getUsers).toHaveBeenCalledWith({
      page: 1,
      size: 10,
      sortBy: 'lastSeen',
      direction: 'desc'
    });
  });

  it('should fall back to the user initial when an avatar fails to load', () => {
    const img = fixture.nativeElement.querySelector('.user-avatar') as HTMLImageElement | null;
    expect(img).toBeTruthy();

    img?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    const fallback = fixture.nativeElement.querySelector('.avatar-fallback') as HTMLElement | null;
    expect(fixture.nativeElement.querySelector('.user-avatar')).toBeNull();
    expect(fallback?.textContent?.trim()).toBe('L');
  });

  it('should render the visit count for each user', () => {
    const cells = Array.from(fixture.nativeElement.querySelectorAll('tbody td')) as HTMLElement[];
    expect(cells.some((cell) => cell.textContent?.trim() === '8')).toBeTrue();
  });
});
