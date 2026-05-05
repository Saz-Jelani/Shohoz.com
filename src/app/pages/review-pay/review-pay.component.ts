import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BusScheduleEntry } from '../../models/bus-management.models';

interface BookingDraft {
  bus: BusScheduleEntry;
  seats: string[];
  boardingPoint: string;
  boardingTime: string;
  createdAt: string;
}

interface PassengerDraft {
  mobileNo: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female';
}

@Component({
  selector: 'app-review-pay',
  templateUrl: './review-pay.component.html',
  styleUrls: ['./review-pay.component.css']
})
export class ReviewPayComponent implements OnInit {
  booking: BookingDraft | null = null;
  passenger: PassengerDraft | null = null;

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    this.loadDrafts();
  }

  get fareTotal(): number {
    if (!this.booking) {
      return 0;
    }
    const bus = this.booking.bus;
    const base = bus.discountPrice && bus.discountPrice < bus.price ? bus.price - bus.discountPrice : bus.price;
    return base * this.booking.seats.length;
  }

  formatDateLabel(dateText: string): string {
    const dt = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(dt.getTime())) {
      return dateText;
    }
    return dt.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  backToSearch(): void {
    this.router.navigate(['/bus/search']);
  }

  private loadDrafts(): void {
    const bookingRaw = sessionStorage.getItem('shohoz_booking_draft');
    const passengerRaw = sessionStorage.getItem('shohoz_passenger_draft');

    if (!bookingRaw) {
      this.router.navigate(['/bus/search']);
      return;
    }

    try {
      this.booking = JSON.parse(bookingRaw) as BookingDraft;
      this.passenger = passengerRaw ? (JSON.parse(passengerRaw) as PassengerDraft) : null;
    } catch {
      this.router.navigate(['/bus/search']);
    }
  }
}
