import { Routes } from '@angular/router';
import {Home} from './pages/home/home';
import {About} from './pages/about/about';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'about', component: About, pathMatch: 'full' },
  { path: '**', redirectTo: '' }, // wildcard
];
