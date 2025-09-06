import { Component } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { CenterCard } from '../../components/center-card/center-card';

@Component({
  selector: 'app-oauth',
  imports: [
    MatDivider,
    CenterCard,
  ],
  templateUrl: './oauth.html',
  styleUrl: './oauth.css'
})
export class Oauth {

}
