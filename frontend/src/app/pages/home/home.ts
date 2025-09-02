import { Component } from '@angular/core';
import {MatButton} from '@angular/material/button';
import {MatCard} from '@angular/material/card';

@Component({
  selector: 'app-home',
  imports: [
    MatButton,
    MatCard
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

}
