import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthUser } from '../../models/auth.models';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() travelModes: string[] = [];
  @Input() selectedMode = 'Bus';
  @Output() modeChange = new EventEmitter<string>();
  @Output() serviceClick = new EventEmitter<string>();

  isMobileMenuOpen = false;
  isUserMenuOpen = false;
  services = [
    { label: 'Bus', icon: 'assets/bus.png', beta: false },
    { label: 'Air', icon: 'assets/air.png', beta: false },
    { label: 'Train', icon: 'assets/train.png', beta: false },
    { label: 'Launch', icon: 'assets/launch.png', beta: false },
    { label: 'Event', icon: 'assets/event.png', beta: false },
    { label: 'Park', icon: 'assets/park.png', beta: true }
  ];

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

  selectMode(mode: string): void {
    this.modeChange.emit(mode);
    this.serviceClick.emit(mode);
    this.isMobileMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.isUserMenuOpen = false;
  }

  toggleUserMenu(event?: MouseEvent): void {
    event?.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;
    this.isMobileMenuOpen = false;
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
    if (target?.closest('.nav-actions') || target?.closest('.mobile-actions')) {
      return;
    }

    this.isUserMenuOpen = false;
    this.isMobileMenuOpen = false;
  }
}
