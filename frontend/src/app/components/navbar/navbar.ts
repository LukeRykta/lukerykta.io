import { Component, inject } from '@angular/core';
import { IsActiveMatchOptions, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  imports: [RouterLink, RouterLinkActive, NgOptimizedImage],
  host: {
    class: 'block w-full'
  }
})
export class Navbar {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly exactRouteMatch: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored'
  };
  private readonly subsetRouteMatch: IsActiveMatchOptions = {
    paths: 'subset',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored'
  };

  readonly isAdmin = this.auth.isAdmin;

  menuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  isActive(route: string, exact = true): boolean {
    return this.router.isActive(route, exact ? this.exactRouteMatch : this.subsetRouteMatch);
  }
}
