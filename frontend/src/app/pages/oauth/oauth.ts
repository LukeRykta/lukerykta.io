import { Component } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { CenterCard } from '../../components/center-card/center-card';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-oauth',
  imports: [
    MatDivider,
    CenterCard,
    MatButton,
  ],
  templateUrl: './oauth.html',
  styleUrl: './oauth.css'
})
export class Oauth {
  private readonly backendOrigin = window.location.hostname === 'localhost'
    ? 'http://localhost:8080'
    : window.location.origin;

  continueWith(provider: 'google' | 'github'): void {
    window.location.href = `${this.backendOrigin}/oauth2/authorization/${provider}`;
  }
}
