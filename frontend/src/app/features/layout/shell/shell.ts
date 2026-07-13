import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Chat } from '../../../shared/components/chat/chat';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Chat],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}