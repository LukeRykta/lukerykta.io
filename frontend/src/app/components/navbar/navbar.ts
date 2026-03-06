import { Component, inject } from '@angular/core';
import { IsActiveMatchOptions, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

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
  private readonly exactRouteMatch: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored'
  };

  menuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  isActive(route: string): boolean {
    return this.router.isActive(route, this.exactRouteMatch);
  }
}
