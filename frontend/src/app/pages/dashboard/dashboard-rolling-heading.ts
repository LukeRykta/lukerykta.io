import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DashboardCharsRevealDirective } from './dashboard-text-reveal.directive';

@Component({
  selector: 'app-dashboard-rolling-heading',
  standalone: true,
  imports: [DashboardCharsRevealDirective],
  templateUrl: './dashboard-rolling-heading.html',
  styleUrl: './dashboard-rolling-heading.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardRollingHeading {
  readonly text = input.required<string>();
}
