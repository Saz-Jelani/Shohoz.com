import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() travelModes: string[] = [];
  @Input() selectedMode = 'Bus';
  @Output() modeChange = new EventEmitter<string>();

  isMobileMenuOpen = false;
  services = [
    { label: 'Bus', icon: 'assets/bus.png', beta: false },
    { label: 'Air', icon: 'assets/air.png', beta: false },
    { label: 'Train', icon: 'assets/train.png', beta: false },
    { label: 'Launch', icon: 'assets/launch.png', beta: false },
    { label: 'Event', icon: 'assets/event.png', beta: false },
    { label: 'Park', icon: 'assets/park.png', beta: true }
  ];

  selectMode(mode: string): void {
    this.modeChange.emit(mode);
    this.isMobileMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
