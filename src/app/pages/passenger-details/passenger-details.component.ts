import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BusScheduleEntry } from '../../models/bus-management.models';

interface BookingDraft {
  mode?: 'Bus' | 'Launch';
  bus: BusScheduleEntry;
  seats: string[];
  tickets?: Array<{
    seat: string;
    type: 'seat' | 'cabin';
    cabinClass?: 'Economy' | 'Premium';
    price: number;
  }>;
  boardingPoint: string;
  boardingTime: string;
  createdAt: string;
}

interface PassengerForm {
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female';
}

@Component({
  selector: 'app-passenger-details',
  templateUrl: './passenger-details.component.html',
  styleUrls: ['./passenger-details.component.css']
})
export class PassengerDetailsComponent implements OnInit, OnDestroy {
  private readonly expiryStorageKey = 'shohoz_passenger_expiry_at';
  private readonly sessionDurationMs = 4 * 60 * 1000;
  private countdownTimer?: number;
  private redirectTimer?: number;
  private selectedMode: 'Bus' | 'Launch' = 'Bus';

  booking: BookingDraft | null = null;
  mobileNo = '';
  email = '';
  passengerForms: PassengerForm[] = [];
  remainingMs = this.sessionDurationMs;
  showExpiryPopup = false;
  expiryMessage = 'Your Booking Expire is Over, please Book again';

  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  ngOnInit(): void {
    this.loadBookingDraft();
    if (!this.booking) {
      return;
    }

    this.initializeExpiryTimer();
    const user = this.authService.getCurrentUser();
    this.email = user?.email || '';
    this.initializePassengers(user?.name || '');
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  proceedToPayment(): void {
    if (!this.booking || !this.canProceedToPayment) {
      return;
    }

    const passengerDraftKey = this.selectedMode === 'Launch' ? 'shohoz_passenger_draft_launch' : 'shohoz_passenger_draft_bus';
    sessionStorage.setItem(passengerDraftKey, JSON.stringify({
      mobileNo: this.mobileNo.trim(),
      email: this.email.trim(),
      passengers: this.passengerForms.map((passenger) => ({
        firstName: passenger.firstName.trim(),
        lastName: passenger.lastName.trim(),
        gender: passenger.gender
      }))
    }));
    // keep legacy key for compatibility with older flows
    sessionStorage.setItem('shohoz_passenger_draft', JSON.stringify({
      mobileNo: this.mobileNo.trim(),
      email: this.email.trim(),
      passengers: this.passengerForms.map((passenger) => ({
        firstName: passenger.firstName.trim(),
        lastName: passenger.lastName.trim(),
        gender: passenger.gender
      }))
    }));
    this.clearTimers();
    this.router.navigate([this.selectedMode === 'Launch' ? '/launch/review-pay' : '/bus/review-pay']);
  }

  get canProceedToPayment(): boolean {
    if (!this.booking) {
      return false;
    }

    const passengerComplete = this.passengerForms.length > 0 && this.passengerForms.every((passenger) => {
      return !!passenger.firstName.trim() && !!passenger.lastName.trim() && !!passenger.gender;
    });

    return passengerComplete;
  }

  get seatLabel(): string {
    if (!this.booking) {
      return '-';
    }
    if (this.booking.tickets?.length) {
      return this.booking.tickets.map((t) => `${t.seat}${t.type === 'cabin' ? ' (Cabin)' : ''}`).join(', ');
    }
    return this.booking.seats.join(', ') || '-';
  }

  get fareTotal(): number {
    if (!this.booking) {
      return 0;
    }
    const bus = this.booking.bus;
    if (this.booking.tickets?.length) {
      return this.booking.tickets.reduce((sum, t) => sum + t.price, 0);
    }
    const base = bus.discountPrice && bus.discountPrice < bus.price ? bus.price - bus.discountPrice : bus.price;
    return base * this.booking.seats.length;
  }

  private loadBookingDraft(): void {
    const launchRaw = sessionStorage.getItem('shohoz_booking_draft_launch');
    const busRaw = sessionStorage.getItem('shohoz_booking_draft_bus');
    const legacyRaw = sessionStorage.getItem('shohoz_booking_draft');
    const raw = launchRaw || busRaw || legacyRaw;
    if (!raw) {
      const fallback = this.router.url.startsWith('/launch/') ? '/launch/search' : '/bus/search';
      this.router.navigate([fallback]);
      return;
    }

    try {
      this.booking = JSON.parse(raw) as BookingDraft;
      this.selectedMode = this.booking.mode === 'Launch' ? 'Launch' : (launchRaw ? 'Launch' : 'Bus');
    } catch {
      const fallback = this.router.url.startsWith('/launch/') ? '/launch/search' : '/bus/search';
      this.router.navigate([fallback]);
    }
  }

  get countdownLabel(): string {
    const totalSeconds = Math.max(0, Math.ceil(this.remainingMs / 1000));
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}m:${seconds}s`;
  }

  get showTimerWarning(): boolean {
    return this.remainingMs <= 30 * 1000;
  }

  private initializePassengers(userName: string): void {
    const seatCount = this.booking?.tickets?.length || this.booking?.seats.length || 0;
    const nameParts = userName.trim().split(/\s+/).filter(Boolean);
    const firstPassenger: PassengerForm = {
      firstName: nameParts.shift() || '',
      lastName: nameParts.join(' '),
      gender: 'Male'
    };

    this.passengerForms = Array.from({ length: seatCount }, (_, index) => {
      if (index === 0) {
        return firstPassenger;
      }

      return {
        firstName: '',
        lastName: '',
        gender: 'Male'
      };
    });
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
    sessionStorage.removeItem('shohoz_booking_draft_bus');
    sessionStorage.removeItem('shohoz_booking_draft_launch');
    sessionStorage.removeItem('shohoz_passenger_draft_bus');
    sessionStorage.removeItem('shohoz_passenger_draft_launch');
    this.showExpiryPopup = true;
    this.remainingMs = 0;

    this.redirectTimer = window.setTimeout(() => {
      this.navigateToLastSearch();
    }, 2200);
  }

  private navigateToLastSearch(): void {
    const target = this.selectedMode === 'Launch' ? '/launch/search' : '/bus/search';
    if (!this.booking?.bus) {
      this.router.navigate([target]);
      return;
    }
    this.router.navigate([target], {
      queryParams: {
        from: this.booking.bus.from,
        to: this.booking.bus.to,
        date: this.booking.bus.departureDate,
        mode: this.selectedMode
      }
    });
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

  formatDateLabel(dateText: string): string {
    const dt = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(dt.getTime())) {
      return dateText;
    }
    return dt.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
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
