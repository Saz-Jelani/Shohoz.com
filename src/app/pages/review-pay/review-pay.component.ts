import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BusManagementService } from '../../services/bus-management.service';
import { LaunchManagementService } from '../../services/launch-management.service';
import { BusScheduleEntry } from '../../models/bus-management.models';
import { LaunchScheduleEntry } from '../../models/launch-management.models';

type ScheduleEntry = BusScheduleEntry & Partial<LaunchScheduleEntry>;

interface BookingDraft {
  mode?: 'Bus' | 'Launch';
  bus: ScheduleEntry;
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

interface TicketSelection {
  seat: string;
  type: 'seat' | 'cabin';
  cabinClass?: 'Economy' | 'Premium';
  price: number;
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
  private selectedMode: 'Bus' | 'Launch' = 'Bus';

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
    private readonly busManagementService: BusManagementService,
    private readonly launchManagementService: LaunchManagementService
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
    if (this.booking.tickets?.length) {
      return this.booking.tickets.reduce((sum, t) => sum + t.price, 0);
    }
    const base = bus.discountPrice && bus.discountPrice < bus.price ? bus.price - bus.discountPrice : bus.price;
    return base * this.booking.seats.length;
  }

  get ticketPrice(): number {
    if (!this.booking) {
      return 0;
    }

    if (this.booking.tickets?.length) {
      return this.booking.tickets.reduce((sum, t) => sum + t.price, 0);
    }
    return this.booking.bus.price * this.booking.seats.length;
  }

  get processingFee(): number {
    const count = this.booking?.tickets?.length ?? this.booking?.seats.length ?? 0;
    return this.booking ? 30 * count : 0;
  }

  get insuranceAmount(): number {
    const count = this.booking?.tickets?.length ?? this.booking?.seats.length ?? 0;
    return this.booking && this.insuranceSelected ? 10 * count : 0;
  }

  get discountAmount(): number {
    if (!this.booking || !this.booking.bus.discountPrice) {
      return 0;
    }

    const regularSeatCount = this.booking.tickets?.length
      ? this.booking.tickets.filter((t) => t.type === 'seat').length
      : this.booking.seats.length;
    return this.booking.bus.discountPrice * regularSeatCount;
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
    return this.remainingMs <= 30 * 1000;
  }

  formatDateLabel(dateText: string): string {
    const dt = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(dt.getTime())) {
      return dateText;
    }
    return dt.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  backToSearch(): void {
    this.router.navigate([this.selectedMode === 'Launch' ? '/launch/search' : '/bus/search']);
  }

  get passengerNames(): string[] {
    return this.passenger?.passengers.map((item) => `${item.firstName} ${item.lastName}`.trim()).filter(Boolean) || [];
  }

  private loadDrafts(): void {
    const launchBookingRaw = sessionStorage.getItem('shohoz_booking_draft_launch');
    const busBookingRaw = sessionStorage.getItem('shohoz_booking_draft_bus');
    const legacyBookingRaw = sessionStorage.getItem('shohoz_booking_draft');
    const bookingRaw = launchBookingRaw || busBookingRaw || legacyBookingRaw;
    const passengerRaw = launchBookingRaw
      ? sessionStorage.getItem('shohoz_passenger_draft_launch') || sessionStorage.getItem('shohoz_passenger_draft')
      : sessionStorage.getItem('shohoz_passenger_draft_bus') || sessionStorage.getItem('shohoz_passenger_draft');

    if (!bookingRaw) {
      const fallback = this.router.url.startsWith('/launch/') ? '/launch/search' : '/bus/search';
      this.router.navigate([fallback]);
      return;
    }

    try {
      this.booking = JSON.parse(bookingRaw) as BookingDraft;
      this.selectedMode = this.booking.mode === 'Launch' ? 'Launch' : (launchBookingRaw ? 'Launch' : 'Bus');
      this.passenger = passengerRaw ? (JSON.parse(passengerRaw) as PassengerDraft) : null;
    } catch {
      const fallback = this.router.url.startsWith('/launch/') ? '/launch/search' : '/bus/search';
      this.router.navigate([fallback]);
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

  proceedToPayment(): void {
    if (!this.booking || !this.passenger || !this.canProceedToPayment) {
      return;
    }

    const user = this.authService.getCurrentUser();
    const isLaunch = this.selectedMode === 'Launch';
    const allTickets = this.getBookingTickets();
    const regularSeats = allTickets.filter((t: TicketSelection) => t.type === 'seat').map((t: TicketSelection) => t.seat);
    const cabinSeats = allTickets.filter((t: TicketSelection) => t.type === 'cabin').map((t: TicketSelection) => t.seat);
    const payload = {
      mode: this.selectedMode,
      userId: user?.id || null,
      userName: user?.name || '',
      email: this.passenger.email,
      mobileNo: this.passenger.mobileNo,
      passengers: this.passenger.passengers,
      ...(isLaunch ? { launch: this.booking.bus } : { bus: this.booking.bus }),
      seats: regularSeats,
      cabinSeats,
      tickets: allTickets,
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
        sessionStorage.removeItem('shohoz_booking_draft_bus');
        sessionStorage.removeItem('shohoz_booking_draft_launch');
        sessionStorage.removeItem('shohoz_passenger_draft_bus');
        sessionStorage.removeItem('shohoz_passenger_draft_launch');
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
    if (!this.booking?.bus) {
      return;
    }

    const tickets = this.getBookingTickets();
    const bookedSeats: string[] = [...new Set(tickets.filter((t: TicketSelection) => t.type === 'seat').map((t: TicketSelection) => t.seat))];
    const bookedCabinSeats: string[] = [...new Set(tickets.filter((t: TicketSelection) => t.type === 'cabin').map((t: TicketSelection) => t.seat))];
    if (bookedSeats.length === 0 && bookedCabinSeats.length === 0) {
      return;
    }
    const bus = this.booking.bus;

    const scheduleService = this.selectedMode === 'Launch' ? this.launchManagementService : this.busManagementService;
    const applySeatLock = (schedule: ScheduleEntry | null): void => {
      if (!schedule || schedule.id == null) {
        return;
      }

      const updatedSeats = [...new Set([...(schedule.unavailableSeats || []), ...bookedSeats])];
      const updatedCabinSeats = [...new Set([...(schedule.cabinUnavailableSeats || []), ...bookedCabinSeats])];
      scheduleService.updateSchedule(schedule.id, {
        unavailableSeats: updatedSeats,
        ...(this.selectedMode === 'Launch' ? { cabinUnavailableSeats: updatedCabinSeats } : {})
      }).subscribe({
        error: () => {
          // Seat locks are also derived from bookings on search pages, so this can fail safely.
        }
      });
    };

    if (bus.id != null) {
      scheduleService.getScheduleById(bus.id).subscribe({
        next: (schedule) => applySeatLock(schedule),
        error: () => applySeatLock(bus)
      });
      return;
    }

    scheduleService.getSchedulesByBusNumber(bus.busNumber).subscribe({
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

  private getBookingTickets(): TicketSelection[] {
    if (!this.booking) {
      return [];
    }
    if (this.booking.tickets?.length) {
      return this.booking.tickets as TicketSelection[];
    }
    const seatPrice = this.booking.bus.discountPrice && this.booking.bus.discountPrice < this.booking.bus.price
      ? this.booking.bus.price - this.booking.bus.discountPrice
      : this.booking.bus.price;
    return this.booking.seats.map((seat) => ({ seat, type: 'seat', price: seatPrice }));
  }
}
