import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  LucideAngularModule,
  Users
} from 'lucide-angular';
import { DashboardRollingHeading } from './dashboard-rolling-heading';
import { DashboardCharsRevealDirective } from './dashboard-text-reveal.directive';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LucideAngularModule,
    DashboardRollingHeading,
    DashboardCharsRevealDirective
  ],
  templateUrl: './dashboard-shell.html',
  styleUrl: './dashboard-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardShell {
  readonly chevronsLeftIcon = ChevronsLeft;
  readonly chevronsRightIcon = ChevronsRight;
  readonly overviewIcon = LayoutDashboard;
  readonly usersIcon = Users;
  readonly panelCollapsed = signal(false);

  togglePanel(): void {
    this.panelCollapsed.update((collapsed) => !collapsed);
  }
}
