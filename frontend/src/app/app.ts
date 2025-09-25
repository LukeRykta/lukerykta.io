import {Component, inject, OnInit, signal} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar],
  template: `
    <app-navbar></app-navbar>
    <main class="pt-16 md:pt-20">
      <router-outlet />
    </main>
  `
})
export class App implements OnInit {

  private auth = inject(AuthService);

  ngOnInit() {
    this.auth.bootstrapSession().subscribe(() => {
      if (this.auth.isLoggedIn()) {
        this.auth.resumeFromStorage();
      }
    });
  }

}
