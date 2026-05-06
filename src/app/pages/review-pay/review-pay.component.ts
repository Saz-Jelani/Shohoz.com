import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BusManagementService } from '../../services/bus-management.service';
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
  passengers: Array<{
    firstName: string;
    lastName: string;
    gender: 'Male' | 'Female';
  }>;
}

@Component({
  selector: 'app-review-pay',
  templateUrl: './review-pay.component.html',
  styleUrls: ['./review-pay.component.css']
})
export class ReviewPayComponent implements OnInit, OnDestroy {
  private readonly expiryStorageKey = 'shohoz_passenger_expiry_at';
  private readonly sessionDurationMs = 4 * 60 * 1000;
  private countdownTimer?: number;
  private redirectTimer?: number;

  booking: BookingDraft | null = null;
  passenger: PassengerDraft | null = null;
  selectedPaymentMethod = 'bKash';
  insuranceSelected = true;
  termsAccepted = false;
  couponCode = '';
  isSubmitting = false;
  submitError = '';
  remainingMs = this.sessionDurationMs;
  showExpiryPopup = false;
  expiryMessage = 'Your Booking Expire is Over, please Book again';

  private readonly bookingsApiUrl = 'http://localhost:3000/bookings';

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly busManagementService: BusManagementService
  ) {}

  ngOnInit(): void {
    this.loadDrafts();
    if (this.booking) {
      this.initializeExpiryTimer();
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  get fareTotal(): number {
    if (!this.booking) {
      return 0;
    }
    const bus = this.booking.bus;
    const base = bus.discountPrice && bus.discountPrice < bus.price ? bus.price - bus.discountPrice : bus.price;
    return base * this.booking.seats.length;
  }

  get ticketPrice(): number {
    if (!this.booking) {
      return 0;
    }

    return this.booking.bus.price * this.booking.seats.length;
  }

  get processingFee(): number {
    return this.booking ? 30 * this.booking.seats.length : 0;
  }

  get insuranceAmount(): number {
    return this.booking && this.insuranceSelected ? 10 * this.booking.seats.length : 0;
  }

  get discountAmount(): number {
    if (!this.booking || !this.booking.bus.discountPrice) {
      return 0;
    }

    return this.booking.bus.discountPrice * this.booking.seats.length;
  }

  get totalPayable(): number {
    return this.ticketPrice + this.processingFee + this.insuranceAmount - this.discountAmount;
  }

  get canProceedToPayment(): boolean {
    return this.termsAccepted && !this.isSubmitting;
  }

  get countdownLabel(): string {
    const totalSeconds = Math.max(0, Math.ceil(this.remainingMs / 1000));
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}m:${seconds}s`;
  }

  get showTimerWarning(): boolean {
    return this.remainingMs <= 60 * 1000;
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

  get passengerNames(): string[] {
    return this.passenger?.passengers.map((item) => `${item.firstName} ${item.lastName}`.trim()).filter(Boolean) || [];
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

  private initializeExpiryTimer(): void {
    const storedExpiry = sessionStorage.getItem(this.expiryStorageKey);
    const expiryAt = storedExpiry ? Number(storedExpiry) : Date.now() + this.sessionDurationMs;

    if (!storedExpiry) {
      sessionStorage.setItem(this.expiryStorageKey, String(expiryAt));
    }

    this.updateRemainingTime(expiryAt);

    if (this.remainingMs <= 0) {
      this.handleExpiry();
      return;
    }

    this.countdownTimer = window.setInterval(() => {
      this.updateRemainingTime(expiryAt);
      if (this.remainingMs <= 0) {
        this.handleExpiry();
      }
    }, 1000);
  }

  private updateRemainingTime(expiryAt: number): void {
    this.remainingMs = expiryAt - Date.now();
  }

  private handleExpiry(): void {
    this.clearTimers();
    sessionStorage.removeItem(this.expiryStorageKey);
    sessionStorage.removeItem('shohoz_booking_draft');
    sessionStorage.removeItem('shohoz_passenger_draft');
    this.showExpiryPopup = true;
    this.remainingMs = 0;

    this.redirectTimer = window.setTimeout(() => {
      this.router.navigate(['/bus/search']);
    }, 2200);
  }

  private clearTimers(): void {
    if (this.countdownTimer) {
      window.clearInterval(this.countdownTimer);
      this.countdownTimer = undefined;
    }

    if (this.redirectTimer) {
      window.clearTimeout(this.redirectTimer);
      this.redirectTimer = undefined;
    }
  }

  proceedToPayment(): void {
    if (!this.booking || !this.passenger || !this.canProceedToPayment) {
      return;
    }

    const user = this.authService.getCurrentUser();
    const payload = {
      userId: user?.id || null,
      userName: user?.name || '',
      email: this.passenger.email,
      mobileNo: this.passenger.mobileNo,
      passengers: this.passenger.passengers,
      bus: this.booking.bus,
      seats: this.booking.seats,
      boardingPoint: this.booking.boardingPoint,
      boardingTime: this.booking.boardingTime,
      paymentMethod: this.selectedPaymentMethod,
      insuranceSelected: this.insuranceSelected,
      couponCode: this.couponCode.trim(),
      ticketPrice: this.ticketPrice,
      processingFee: this.processingFee,
      discountAmount: this.discountAmount,
      insuranceAmount: this.insuranceAmount,
      totalPayable: this.totalPayable,
      status: 'booked',
      createdAt: new Date().toISOString()
    };

    this.isSubmitting = true;
    this.submitError = '';

    this.http.post(this.bookingsApiUrl, payload).subscribe({
      next: () => {
        this.lockBookedSeats();
        sessionStorage.removeItem(this.expiryStorageKey);
        sessionStorage.removeItem('shohoz_booking_draft');
        sessionStorage.removeItem('shohoz_passenger_draft');
        this.clearTimers();
        this.router.navigate(['/']);
      },
      error: () => {
        this.submitError = 'Could not save booking right now. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  private lockBookedSeats(): void {
    if (!this.booking?.bus || this.booking.seats.length === 0) {
      return;
    }

    const bookedSeats = [...new Set(this.booking.seats)];
    const bus = this.booking.bus;

    const applySeatLock = (schedule: BusScheduleEntry | null): void => {
      if (!schedule || schedule.id == null) {
        return;
      }

      const updatedSeats = [...new Set([...(schedule.unavailableSeats || []), ...bookedSeats])];
      this.busManagementService.updateSchedule(schedule.id, { unavailableSeats: updatedSeats }).subscribe({
        error: () => {
          // Seat locks are also derived from bookings on search pages, so this can fail safely.
        }
      });
    };

    if (bus.id != null) {
      this.busManagementService.getScheduleById(bus.id).subscribe({
        next: (schedule) => applySeatLock(schedule),
        error: () => applySeatLock(bus)
      });
      return;
    }

    this.busManagementService.getSchedulesByBusNumber(bus.busNumber).subscribe({
      next: (rows) => {
        const schedule = rows.find((item) =>
          item.from === bus.from
          && item.to === bus.to
          && item.departureDate === bus.departureDate
          && item.departureTime === bus.departureTime
        ) || rows[0] || null;
        applySeatLock(schedule);
      },
      error: () => applySeatLock(null)
    });
  }

  getOperatorImage(operatorImage?: string): string {
    if (!operatorImage) {
      return 'assets/operators/greenline.png';
    }

    if (operatorImage.startsWith('data:')) {
      return operatorImage;
    }

    if (operatorImage.endsWith('.svg')) {
      let base = operatorImage.replace('.svg', '');
      base = base.replace('assets/operators/green-line', 'assets/operators/greenline');
      base = base.replace('assets/operators/shohagh', 'assets/operators/shohag');
      base = base.replace('assets/operators/soudia', 'assets/operators/saudia');
      return `${base}.png`;
    }

    let normalized = operatorImage;
    normalized = normalized.replace('assets/operators/green-line.png', 'assets/operators/greenline.png');
    normalized = normalized.replace('assets/operators/soudia.png', 'assets/operators/saudia.png');
    normalized = normalized.replace('assets/operators/shohagh.png', 'assets/operators/shohag.png');
    return normalized;
  }
}
