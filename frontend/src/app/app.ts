import {Component, inject, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { AuthService } from './core/auth/auth.service';
import { PageViewTrackerService } from './core/services/page-view-tracker.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar],
  template: `
    <app-navbar></app-navbar>
    <main>
      <router-outlet />
    </main>
  `
})
export class App implements OnInit {

  private auth = inject(AuthService);
  private pageViews = inject(PageViewTrackerService);

  ngOnInit() {
    this.pageViews.start();
    this.auth.bootstrapSession().subscribe(() => {
      if (this.auth.isLoggedIn()) {
        this.auth.resumeFromStorage();
      }
    });
  }

}
