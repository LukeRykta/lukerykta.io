import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

import { InfiniteHero } from '../../components/infinite-hero/infinite-hero';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    InfiniteHero
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  showHero = signal(true);
}
