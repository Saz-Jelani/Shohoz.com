import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  travelModes = ['Bus', 'Train'];
  selectedMode = 'Bus';
  showFooter = true;
  private readonly routeSubscription: Subscription;

  constructor(private readonly router: Router) {
    this.routeSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.syncSelectedMode(event.urlAfterRedirects || event.url));
  }

  ngOnInit(): void {
    this.syncSelectedMode(this.router.url);
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  onModeChange(mode: string): void {
    this.selectedMode = mode;
  }

  onServiceClick(payload: { mode: string; target: 'user' | 'admin' }): void {
    if (payload.target === 'admin') {
      if (payload.mode === 'Launch') {
        this.router.navigate(['/admin/launch-management']);
        return;
      }
      this.router.navigate(['/admin/bus-management']);
      return;
    }

    if (payload.mode === 'Launch') {
      this.router.navigate(['/launch-tickets']);
      return;
    }

    this.router.navigate(['/']);
  }

  private syncSelectedMode(url: string): void {
    if (url.startsWith('/launch-tickets') || url.startsWith('/admin/launch-management')) {
      this.selectedMode = 'Launch';
      return;
    }

    this.selectedMode = 'Bus';
  }
}
