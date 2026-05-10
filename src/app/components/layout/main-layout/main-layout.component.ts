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
  private readonly successToastStorageKey = 'shohoz_success_toast';
  showSuccessToast = false;
  private successToastEndAt = 0;
  private hideToastTimer?: number;

  constructor(private readonly router: Router) {
    this.routeSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.syncSelectedMode(event.urlAfterRedirects || event.url));
  }

  ngOnInit(): void {
    this.syncSelectedMode(this.router.url);
    this.restoreGlobalSuccessToast();
    window.addEventListener('shohoz-success-toast', this.onGlobalToastEvent);
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
    window.removeEventListener('shohoz-success-toast', this.onGlobalToastEvent);
    this.setToastBodyLock(false);
    if (this.hideToastTimer) {
      window.clearTimeout(this.hideToastTimer);
    }
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
    if (
      url.startsWith('/launch-tickets')
      || url.startsWith('/admin/launch-management')
      || url.startsWith('/launch/search')
      || url.startsWith('/launch/passenger-details')
      || url.startsWith('/launch/review-pay')
      || url.includes('mode=Launch')
    ) {
      this.selectedMode = 'Launch';
      return;
    }

    this.selectedMode = 'Bus';
  }

  private readonly onGlobalToastEvent = (): void => {
    this.restoreGlobalSuccessToast();
  };

  private restoreGlobalSuccessToast(): void {
    const raw = sessionStorage.getItem(this.successToastStorageKey);
    if (!raw) {
      return;
    }
    try {
      const payload = JSON.parse(raw) as { endAt?: number };
      const endAt = Number(payload.endAt || 0);
      const remaining = endAt - Date.now();
      if (remaining <= 0) {
        sessionStorage.removeItem(this.successToastStorageKey);
        this.showSuccessToast = false;
        this.setToastBodyLock(false);
        return;
      }

      if (this.successToastEndAt === endAt && this.showSuccessToast) {
        return;
      }

      this.successToastEndAt = endAt;
      this.showSuccessToast = true;
      this.setToastBodyLock(true);
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      if (this.hideToastTimer) {
        window.clearTimeout(this.hideToastTimer);
      }
      this.hideToastTimer = window.setTimeout(() => {
        this.showSuccessToast = false;
        this.successToastEndAt = 0;
        sessionStorage.removeItem(this.successToastStorageKey);
        this.setToastBodyLock(false);
      }, remaining);
    } catch {
      sessionStorage.removeItem(this.successToastStorageKey);
      this.setToastBodyLock(false);
    }
  }

  private setToastBodyLock(locked: boolean): void {
    document.body.classList.toggle('toast-active', locked);
  }
}
