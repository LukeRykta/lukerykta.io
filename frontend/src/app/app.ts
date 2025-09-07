import {Component, inject, OnInit, signal} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Splash } from './components/splash/splash';
import { AuthService } from './core/auth/auth.service';

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
export class App implements OnInit {
  showSplash = signal(true);

  private auth = inject(AuthService);

  ngOnInit() {
    this.auth.bootstrapSession().subscribe(() => {
      if (this.auth.isLoggedIn()) {
        this.auth.resumeFromStorage();
      }
    });
  }

}
