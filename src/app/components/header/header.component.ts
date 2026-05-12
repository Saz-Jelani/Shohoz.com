import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthUser } from '../../models/auth.models';

type ServiceClickPayload = {
  mode: string;
  target: 'user' | 'admin';
};

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() travelModes: string[] = [];
  @Input() selectedMode = 'Bus';
  @Output() modeChange = new EventEmitter<string>();
  @Output() serviceClick = new EventEmitter<ServiceClickPayload>();

  isMobileMenuOpen = false;
  isUserMenuOpen = false;
  openServiceMenu: string | null = null;
  openMobileServiceMenu: string | null = null;
  services = [
    { label: 'Bus', icon: 'assets/bus.png', beta: false },
    { label: 'Air', icon: 'assets/air.png', beta: false },
    { label: 'Train', icon: 'assets/train.png', beta: false },
    { label: 'Launch', icon: 'assets/launch.png', beta: false },
    { label: 'Event', icon: 'assets/event.png', beta: false },
    { label: 'Park', icon: 'assets/park.png', beta: true }
  ];

  get visibleServices(): Array<{ label: string; icon: string; beta: boolean }> {
    return this.services;
  }

  get mobileTravelModes(): string[] {
    return this.visibleServices.map((service) => service.label);
  }

  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  get currentUser(): AuthUser | null {
    return this.authService.getCurrentUser();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get userLabel(): string {
    const name = this.currentUser?.name?.trim() || 'User';
    const firstWord = name.split(/\s+/)[0] || name;
    return name.length > firstWord.length ? `${firstWord} ...` : firstWord;
  }

  get userInitial(): string {
    return (this.currentUser?.name || 'U').trim().charAt(0).toUpperCase();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  handleServiceClick(mode: string, event?: MouseEvent): void {
    event?.stopPropagation();
    if (this.isAdmin) {
      this.selectMode(mode, 'admin');
      return;
    }

    this.selectMode(mode, 'user');
  }

  selectMode(mode: string, target: 'user' | 'admin' = 'user'): void {
    this.modeChange.emit(mode);
    this.serviceClick.emit({ mode, target });
    this.isMobileMenuOpen = false;
    this.openServiceMenu = null;
    this.openMobileServiceMenu = null;
  }

  selectAdminMode(mode: string, event?: MouseEvent): void {
    event?.stopPropagation();
    this.selectMode(mode, 'admin');
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.isUserMenuOpen = false;
    this.openServiceMenu = null;
    if (!this.isMobileMenuOpen) {
      this.openMobileServiceMenu = null;
    }
  }

  onMobileModeClick(mode: string, event?: MouseEvent): void {
    event?.stopPropagation();
    if (this.isAdmin) {
      this.selectMode(mode, 'admin');
      return;
    }
    this.selectMode(mode, 'user');
  }

  toggleUserMenu(event?: MouseEvent): void {
    event?.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;
    this.isMobileMenuOpen = false;
    this.openServiceMenu = null;
    this.openMobileServiceMenu = null;
  }

  goToProfile(): void {
    this.isUserMenuOpen = false;
    this.router.navigate(['/my-profile']);
  }

  goToChangePassword(): void {
    this.isUserMenuOpen = false;
    this.router.navigate(['/change-password']);
  }

  logout(): void {
    this.isUserMenuOpen = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  closeMenus(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('.nav-actions') || target?.closest('.mobile-actions') || target?.closest('.service-menu')) {
      return;
    }

    this.isUserMenuOpen = false;
    this.isMobileMenuOpen = false;
    this.openServiceMenu = null;
    this.openMobileServiceMenu = null;
  }
}
