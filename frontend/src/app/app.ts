import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TgSplash } from './components/tg-splash/tg-splash';
import {Navbar} from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TgSplash, Navbar],
  template: `
    <div class="min-h-screen bg-neutral-900 text-white">
      <app-navbar></app-navbar>
      <router-outlet />
    </div>
  `
})
export class App {
  showSplash = signal(true);
}
