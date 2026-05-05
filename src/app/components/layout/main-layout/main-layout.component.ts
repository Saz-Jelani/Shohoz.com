import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnDestroy {
  travelModes = ['Bus', 'Train'];
  selectedMode = 'Bus';
  showFooter = true;
  private routerEventsSub?: Subscription;
  private readonly hideFooterRoutes = ['/bus/passenger-details', '/bus/review-pay'];

  constructor(private readonly authService: AuthService, private readonly router: Router) {
    this.updateFooterVisibility(this.router.url);
    this.routerEventsSub = this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this.updateFooterVisibility(event.urlAfterRedirects);
    });
  }

  ngOnDestroy(): void {
    this.routerEventsSub?.unsubscribe();
  }

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

  private updateFooterVisibility(url: string): void {
    this.showFooter = !this.hideFooterRoutes.some((route) => url.startsWith(route));
  }
}
