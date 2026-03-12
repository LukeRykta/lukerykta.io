import { Routes } from '@angular/router';
import {Home} from './pages/home/home';
import {About} from './pages/about/about';
import {Oauth} from './pages/oauth/oauth';
import {Projects} from './pages/projects/projects';
import { adminGuard } from './core/auth/admin.guard';
import { DashboardOverview } from './pages/dashboard/dashboard-overview';
import { DashboardShell } from './pages/dashboard/dashboard-shell';
import { DashboardUsers } from './pages/dashboard/dashboard-users';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'projects', component: Projects, pathMatch: 'full' },
  { path: 'about', component: About, pathMatch: 'full' },
  {
    path: 'dashboard',
    component: DashboardShell,
    canActivate: [adminGuard],
    children: [
      { path: '', component: DashboardOverview, pathMatch: 'full' },
      { path: 'users', component: DashboardUsers, pathMatch: 'full' }
    ]
  },
  { path: 'oauth', component: Oauth, pathMatch: 'full' },
  { path: '**', redirectTo: '' }, // wildcard
];
