import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BusScheduleEntry } from '../../models/bus-management.models';

interface BookingDraft {
  bus: BusScheduleEntry;
  seats: string[];
  boardingPoint: string;
  boardingTime: string;
  createdAt: string;
}

@Component({
  selector: 'app-passenger-details',
  templateUrl: './passenger-details.component.html',
  styleUrls: ['./passenger-details.component.css']
})
export class PassengerDetailsComponent implements OnInit {
  booking: BookingDraft | null = null;
  mobileNo = '';
  email = '';
  firstName = '';
  lastName = '';
  gender: 'Male' | 'Female' = 'Male';

  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  ngOnInit(): void {
    this.loadBookingDraft();
    const user = this.authService.getCurrentUser();
    this.email = user?.email || '';
    const nameParts = (user?.name || '').trim().split(/\s+/).filter(Boolean);
    this.firstName = nameParts.shift() || '';
    this.lastName = nameParts.join(' ');
  }

  proceedToPayment(): void {
    if (!this.booking) {
      return;
    }

    const trimmedMobile = this.mobileNo.trim();
    const trimmedEmail = this.email.trim();
    const trimmedFirst = this.firstName.trim();
    const trimmedLast = this.lastName.trim();

    if (!trimmedMobile || !trimmedEmail || !trimmedFirst || !trimmedLast) {
      return;
    }

    sessionStorage.setItem('shohoz_passenger_draft', JSON.stringify({
      mobileNo: trimmedMobile,
      email: trimmedEmail,
      firstName: trimmedFirst,
      lastName: trimmedLast,
      gender: this.gender
    }));
    this.router.navigate(['/bus/review-pay']);
  }

  get seatLabel(): string {
    return this.booking?.seats.join(', ') || '-';
  }

  get fareTotal(): number {
    if (!this.booking) {
      return 0;
    }
    const bus = this.booking.bus;
    const base = bus.discountPrice && bus.discountPrice < bus.price ? bus.price - bus.discountPrice : bus.price;
    return base * this.booking.seats.length;
  }

  private loadBookingDraft(): void {
    const raw = sessionStorage.getItem('shohoz_booking_draft');
    if (!raw) {
      this.router.navigate(['/bus/search']);
      return;
    }

    try {
      this.booking = JSON.parse(raw) as BookingDraft;
    } catch {
      this.router.navigate(['/bus/search']);
    }
  }

  formatDateLabel(dateText: string): string {
    const dt = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(dt.getTime())) {
      return dateText;
    }
    return dt.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  }
}
