import { Component, input, output, signal, effect } from '@angular/core';

@Component({
  selector: 'app-splash',
  standalone: true,
  templateUrl: 'splash.html',
  styleUrl: 'splash.css',
  host: {
    // toggle the wipe-out class from the component host based on hidden()
    '[class.wipe-out]': 'hidden()',
  }
})
export class Splash {
  autoHideMs = input<number>(1200);
  done = output<void>();
  hidden = signal(false);

  constructor() {
    effect(() => {
      const ms = this.autoHideMs();
      if (ms > 0) {
        const t = setTimeout(() => this.hide(), ms);
        return () => clearTimeout(t);
      }
      return;
    });
  }

  hide() {
    if (this.hidden()) return;
    this.hidden.set(true);
    // wait for the 700ms CSS transition to finish, then tell parent to remove
    setTimeout(() => this.done.emit(), 700);
  }
}
