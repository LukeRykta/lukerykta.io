import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';
import { LikeService } from '../../core/services/like.service'; // <-- adjust path if different
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule, ThumbsUp  } from 'lucide-angular';
import {CenterCard} from '../../components/center-card/center-card';

const ABOUT_POST_ID = 'about-page';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    LucideAngularModule,
    CenterCard
  ],
  templateUrl: './about.html',
  styleUrls: ['./about.css'],
})
export class About implements OnInit {
  readonly ThumbsUp= ThumbsUp;
  private likeService = inject(LikeService);
  private authService = inject(AuthService);

  // live like state (optional, for showing icon state / count)
  likeState = toSignal(
    this.likeService.likeState$(ABOUT_POST_ID),
    { initialValue: { postId: ABOUT_POST_ID, count: 0, liked: false } }
  );

  ngOnInit(): void {
    // Optional: auto-perform the action after login if this was the pending intent
    const intent = this.authService.takePendingIntent?.();
    if (this.authService.isLoggedIn() && intent?.kind === 'like' && intent.postId === ABOUT_POST_ID) {
      this.likeService.like(ABOUT_POST_ID).subscribe();
    }
  }

  onLikeClick(id: string) {
    const ok = this.authService.requireAuthOrRedirect({ kind: 'like', postId: id });
    if (!ok) return;                 // redirected to /oauth
    this.likeService.like(id).subscribe();  // user is already authed → perform action
  }

  // expose the constant to the template (if you prefer not to hardcode there)
  readonly ABOUT_POST_ID = ABOUT_POST_ID;
}
