import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AdminOverview, AdminService } from '../../core/services/admin.service';
import { DashboardOverview } from './dashboard-overview';

describe('DashboardOverview', () => {
  let fixture: ComponentFixture<DashboardOverview>;
  let adminStub: { getOverview: jasmine.Spy };

  const overview: AdminOverview = {
    totalUsers: 12,
    totalVisits: 63,
    visitsToday: 4,
    visitsThisMonth: 28,
    visitsThisYear: 63,
    totalProjects: 6,
    totalLikes: 41,
    topRoutes: [
      {
        routePath: '/',
        viewCount: 18,
        uniqueVisitorCount: 12,
        lastViewedAt: '2026-03-11T16:21:00Z'
      },
      {
        routePath: '/projects',
        viewCount: 11,
        uniqueVisitorCount: 7,
        lastViewedAt: '2026-03-11T15:10:00Z'
      }
    ]
  };

  beforeEach(async () => {
    adminStub = {
      getOverview: jasmine.createSpy('getOverview').and.returnValue(of(overview))
    };

    await TestBed.configureTestingModule({
      imports: [DashboardOverview],
      providers: [{ provide: AdminService, useValue: adminStub }]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardOverview);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should request overview statistics on load', () => {
    expect(adminStub.getOverview).toHaveBeenCalled();
  });

  it('should render the top routes list', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Top routes');
    expect(compiled.textContent).toContain('/projects');
    expect(compiled.textContent).toContain('18');
    expect(compiled.textContent).toContain('12 unique visitors');
  });
});
