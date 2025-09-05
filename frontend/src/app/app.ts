import {Component, inject, Inject, PLATFORM_ID, signal} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {Navbar} from './components/navbar/navbar';
import {Splash} from './components/splash/splash';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Splash],
  template: `
    @if (showSplash()) {
      <app-splash (done)="showSplash.set(false)"></app-splash>
    }

    <app-navbar></app-navbar>
    <router-outlet />
  `
})
export class App {
  showSplash = signal(true);

}
