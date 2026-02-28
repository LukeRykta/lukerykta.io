import { Component } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { CenterCard } from '../../components/center-card/center-card';
import { MatButton } from '@angular/material/button';
import { backendOrigin } from '../../core/services/backend-origin';

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

  continueWith(provider: 'google' | 'github'): void {
    window.location.href = `${backendOrigin()}/oauth2/authorization/${provider}`;
  }
}
