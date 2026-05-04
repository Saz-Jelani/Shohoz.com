import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent {
  travelModes = ['Bus', 'Train'];
  selectedMode = 'Bus';

  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  onModeChange(mode: string): void {
    this.selectedMode = mode;
  }

  onServiceClick(mode: string): void {
    if (mode === 'Bus' && this.authService.isAdmin()) {
      this.router.navigate(['/admin/bus-management']);
      return;
    }
    this.router.navigate(['/']);
  }
}
