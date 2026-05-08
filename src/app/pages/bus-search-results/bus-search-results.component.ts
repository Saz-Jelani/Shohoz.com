import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BusScheduleEntry } from '../../models/bus-management.models';
import { AuthService } from '../../services/auth.service';
import { BusManagementService } from '../../services/bus-management.service';
import { LaunchManagementService } from '../../services/launch-management.service';

type DrawerTab = 'seats' | 'boarding' | 'amenities' | 'policies' | 'details';
type TripDetailsView = 'boarding' | 'dropping';

interface TripStop {
  label: string;
  time: string;
  date: string;
  place: string;
  city: string;
}

interface SeatRow {
  leftA: string;
  leftB: string;
  rightA: string;
  rightB: string;
}

interface TicketSelection {
  seat: string;
  type: 'seat' | 'cabin';
  cabinClass?: 'Economy' | 'Premium';
  price: number;
}

@Component({
  selector: 'app-bus-search-results',
  templateUrl: './bus-search-results.component.html',
  styleUrls: ['./bus-search-results.component.css']
})
export class BusSearchResultsComponent implements OnInit {
  ngOnInit(): void {
    this.resetActiveBookingSession();
    // Set mode from URL/query params so the embedded search-hero shows correct mode
    try {
      const modeFromQuery = this.route.snapshot.queryParamMap.get('mode');
      const onLaunchSearchPath = this.router.url.startsWith('/launch/search');
      this.selectedMode = modeFromQuery ?? (onLaunchSearchPath ? 'Launch' : 'Bus');
    } catch {
      this.selectedMode = 'Bus';
    }
  }
  readonly locationBoardingPoints: Record<string, string[]> = {
    Dhaka: ['Gabtoli', 'Kallyanpur', 'Asad Gate', 'Farmgate', 'Sayedabad'],
    Chattogram: ['AK Khan', 'Tigerpass', 'GEC Circle', 'Bahaddarhat', 'Karnaphuli'],
    "Cox's Bazar": ['Kolatoli', 'Laboni', 'Sugandha', 'Link Road', 'Jhautola'],
    Sylhet: ['Ambarkhana', 'Kodomtoli', 'Zindabazar', 'Subhanighat', 'Humayun Rashid Chattar'],
    Rajshahi: ['Railgate', 'Zero Point', 'Laxmipur', 'Bornali', 'Talaimari'],
    Khulna: ['Sonadanga', 'Shibbari', 'Dakbangla', 'Khalishpur', 'Rupsha'],
    Barishal: ['Nathullabad', 'Rupatoli', 'Launch Ghat', 'Sadar Road', 'Kazipara'],
    Rangpur: ['Jahaj Company', 'Modern Mor', 'Payra Chattar', 'Station Road', 'Shapla Chattar']
  };

  selectedMode = 'Bus';
  selectedBus: BusScheduleEntry | null = null;
  isDrawerOpen = false;
  activeTab: DrawerTab = 'seats';
  tripDetailsView: TripDetailsView = 'boarding';
  selectedTickets: TicketSelection[] = [];
  selectedBoardingPoint = '';
  selectedBoardingTime = '';
  private drawerCloseTimer?: number;

  readonly seatRows: SeatRow[] = Array.from({ length: 10 }, (_, index) => {
    const row = String.fromCharCode(65 + index);
    return {
      leftA: `${row}1`,
      leftB: `${row}2`,
      rightA: `${row}3`,
      rightB: `${row}4`
    };
  });
  readonly cabinSeatRows: SeatRow[] = Array.from({ length: 2 }, (_, index) => {
    const row = String.fromCharCode(65 + index);
    return {
      leftA: `${row}1`,
      leftB: `${row}2`,
      rightA: `${row}3`,
      rightB: `${row}4`
    };
  });

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly busManagementService: BusManagementService,
    private readonly launchManagementService: LaunchManagementService
  ) {}

  openDrawer(bus: BusScheduleEntry): void {
    if (this.drawerCloseTimer) {
      window.clearTimeout(this.drawerCloseTimer);
      this.drawerCloseTimer = undefined;
    }
    this.selectedBus = bus;
    this.selectedTickets = [];
    this.activeTab = 'seats';
    this.selectedBoardingPoint = '';
    this.selectedBoardingTime = '';
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    if (this.drawerCloseTimer) {
      window.clearTimeout(this.drawerCloseTimer);
    }
    this.drawerCloseTimer = window.setTimeout(() => {
      if (!this.isDrawerOpen) {
        this.selectedBus = null;
      }
      this.drawerCloseTimer = undefined;
    }, 280);
  }

  setTab(tab: DrawerTab): void {
    this.activeTab = tab;
    if (tab === 'details') {
      this.tripDetailsView = 'boarding';
    }
    if (tab === 'boarding' && !this.selectedBoardingPoint) {
      this.selectedBoardingPoint = this.tripBoardingPoints[0]?.place || '';
      this.selectedBoardingTime = this.tripBoardingPoints[0]?.time || '';
    }
  }

  setTripDetailsView(view: TripDetailsView): void {
    this.tripDetailsView = view;
  }

  get tripBoardingPoints(): TripStop[] {
    const bus = this.selectedBus;
    if (!bus) {
      return [];
    }
    const points = bus.boardingPoints?.length
      ? bus.boardingPoints
      : this.locationBoardingPoints[bus.from] || [bus.from];
    const times = bus.boardingPointTimes && bus.boardingPointTimes.length === points.length
      ? bus.boardingPointTimes
      : this.getDefaultBoardingTimes(bus.departureTime, points.length);
    return points.map((place, index) => ({
      label: 'Starts at',
      time: times[index] || bus.departureTime,
      date: bus.departureDate,
      place,
      city: bus.from
    }));
  }

  get drawerTitle(): string {
    if (this.activeTab === 'boarding') {
      return 'Select Boarding Point';
    }
    if (this.activeTab === 'amenities') {
      return 'Trip Amenities';
    }
    if (this.activeTab === 'policies') {
      return 'Trip Policies';
    }
    if (this.activeTab === 'details') {
      return 'Trip Details';
    }
    return 'Select Seats';
  }

  isSeatSold(seat: string): boolean {
    return !!this.selectedBus?.unavailableSeats.includes(seat);
  }

  isSeatSelected(seat: string): boolean {
    return this.selectedTickets.some((item) => item.seat === seat && item.type === 'seat');
  }

  isCabinSeatSold(seat: string): boolean {
    return !!this.selectedBus?.cabinUnavailableSeats?.includes(seat);
  }

  isCabinSeatSelected(seat: string): boolean {
    return this.selectedTickets.some((item) => item.seat === seat && item.type === 'cabin');
  }

  getCabinClass(seat: string): 'Economy' | 'Premium' {
    const letter = seat.charAt(0).toUpperCase();
    return letter === 'A' ? 'Economy' : 'Premium';
  }

  getCabinPrice(seat: string): number {
    if (!this.selectedBus) {
      return 0;
    }
    const cabinClass = this.getCabinClass(seat);
    return cabinClass === 'Economy'
      ? (this.selectedBus.cabinPriceEconomy ?? 1500)
      : (this.selectedBus.cabinPricePremium ?? 2000);
  }

  toggleSeat(seat: string): void {
    if (!this.selectedBus || this.isSeatSold(seat)) {
      return;
    }
    if (this.isSeatSelected(seat)) {
      this.selectedTickets = this.selectedTickets.filter((item) => !(item.seat === seat && item.type === 'seat'));
      return;
    }
    if (this.selectedTickets.length >= 4) {
      return;
    }
    const base = this.getDisplayPrice(this.selectedBus);
    this.selectedTickets = [...this.selectedTickets, { seat, type: 'seat', price: base }];
  }

  toggleCabinSeat(seat: string): void {
    if (!this.selectedBus || this.isCabinSeatSold(seat)) {
      return;
    }
    if (this.isCabinSeatSelected(seat)) {
      this.selectedTickets = this.selectedTickets.filter((item) => !(item.seat === seat && item.type === 'cabin'));
      return;
    }
    if (this.selectedTickets.length >= 4) {
      return;
    }
    const cabinClass = this.getCabinClass(seat);
    this.selectedTickets = [...this.selectedTickets, { seat, type: 'cabin', cabinClass, price: this.getCabinPrice(seat) }];
  }

  get availableSeatCount(): number {
    if (!this.selectedBus) {
      return 0;
    }
    return 40 - this.selectedBus.unavailableSeats.length;
  }

  get selectedFare(): number {
    if (!this.selectedBus) {
      return 0;
    }
    return this.selectedTickets.reduce((sum, item) => sum + item.price, 0);
  }

  getDisplayPrice(bus: BusScheduleEntry): number {
    if (bus.discountPrice && bus.discountPrice < bus.price) {
      return bus.price - bus.discountPrice;
    }
    return bus.price;
  }

  formatDateLabel(dateText: string): string {
    const dt = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(dt.getTime())) {
      return dateText;
    }
    return dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getDateDay(dateText: string): string {
    const dt = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(dt.getTime())) {
      return '';
    }
    return dt.toLocaleDateString('en-US', { weekday: 'long' });
  }

  get routeLabel(): string {
    return this.selectedBus ? `${this.selectedBus.from} - ${this.selectedBus.to}` : '';
  }

  get tripDetailStops(): TripStop[] {
    const bus = this.selectedBus;
    if (!bus) {
      return [];
    }

    const boardingPoints = this.tripBoardingPoints;
    const droppingPoints = this.locationBoardingPoints[bus.to] || [bus.to];

    if (this.tripDetailsView === 'dropping') {
      return droppingPoints.map((point, index) => ({
        label: 'Drops at',
        time: this.offsetTime(bus.arrivalTime, -(droppingPoints.length - 1 - index) * 30),
        date: bus.departureDate,
        place: point,
        city: bus.to
      }));
    }

    return boardingPoints.map((point, index) => ({
      ...point,
      label: 'Starts at'
    }));
  }

  selectBoardingPoint(point: TripStop): void {
    this.selectedBoardingPoint = point.place;
    this.selectedBoardingTime = point.time;
  }

  trackByTripStop(_index: number, stop: TripStop): string {
    return `${stop.label}-${stop.place}-${stop.time}-${stop.city}`;
  }

  trackBySeatRow(index: number): number {
    return index;
  }

  continueFromSeats(): void {
    if (this.selectedTickets.length === 0) {
      return;
    }
    this.activeTab = 'boarding';
    const points = this.tripBoardingPoints;
    if (points.length > 0) {
      this.selectedBoardingPoint = points[0].place;
      this.selectedBoardingTime = points[0].time;
    }
  }

  continueFromBoarding(): void {
    if (!this.selectedBus || !this.selectedBoardingPoint) {
      return;
    }

    const draft = {
      mode: this.selectedMode,
      bus: this.selectedBus,
      seats: this.selectedTickets.map((item) => item.seat),
      tickets: this.selectedTickets,
      boardingPoint: this.selectedBoardingPoint,
      boardingTime: this.selectedBoardingTime,
      createdAt: new Date().toISOString()
    };
    const draftKey = this.selectedMode === 'Launch' ? 'shohoz_booking_draft_launch' : 'shohoz_booking_draft_bus';
    sessionStorage.setItem(draftKey, JSON.stringify(draft));
    // keep legacy key for compatibility with older flows
    sessionStorage.setItem('shohoz_booking_draft', JSON.stringify(draft));

    if (!this.authService.isLoggedIn()) {
      const returnUrl = this.selectedMode === 'Launch' ? '/launch/passenger-details' : '/bus/passenger-details';
      this.router.navigate(['/login'], { queryParams: { returnUrl } });
      return;
    }

    this.router.navigate([this.selectedMode === 'Launch' ? '/launch/passenger-details' : '/bus/passenger-details']);
  }

  private getDefaultBoardingTimes(departureTime: string, count: number): string[] {
    return Array.from({ length: count }, (_, index) => this.offsetTime(departureTime, index * 30));
  }

  private offsetTime(timeText: string, minutesToAdd: number): string {
    const match = timeText.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) {
      return timeText;
    }

    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const suffix = match[3].toUpperCase();
    const totalMinutes = (suffix === 'PM' ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour)) * 60 + minute + minutesToAdd;
    const normalized = ((totalMinutes % 1440) + 1440) % 1440;
    let outHour = Math.floor(normalized / 60);
    const outMinute = normalized % 60;
    const outSuffix = outHour >= 12 ? 'PM' : 'AM';
    outHour = outHour % 12;
    if (outHour === 0) {
      outHour = 12;
    }
    return `${outHour}:${outMinute.toString().padStart(2, '0')} ${outSuffix}`;
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

  // Helpers to merge bookings into schedules (same logic used by search-hero)
  private mergeBookedSeats(rows: BusScheduleEntry[], bookings: any[]): BusScheduleEntry[] {
    return rows.map((row) => {
      const seats = new Set<string>(row.unavailableSeats || []);
      const cabinSeats = new Set<string>(row.cabinUnavailableSeats || []);
      bookings
        .filter((booking) => this.bookingMatchesSchedule(row, booking))
        .forEach((booking) => {
          (booking?.seats || []).forEach((seat: string) => seats.add(seat));
          (booking?.cabinSeats || []).forEach((seat: string) => cabinSeats.add(seat));
          (booking?.tickets || [])
            .filter((t: any) => t?.type === 'cabin')
            .forEach((t: any) => cabinSeats.add(t.seat));
        });

      return {
        ...row,
        unavailableSeats: [...seats],
        cabinUnavailableSeats: [...cabinSeats]
      };
    });
  }

  private bookingMatchesSchedule(row: BusScheduleEntry, booking: any): boolean {
    if (!booking || booking.status === 'cancelled') {
      return false;
    }

    const bookingMode = booking.mode ?? (booking.launch ? 'Launch' : 'Bus');
    if (bookingMode !== this.selectedMode) {
      return false;
    }

    const bookedBus = (booking.bus || booking.launch) as BusScheduleEntry;
    if (!bookedBus) {
      return false;
    }

    if (row.id != null && bookedBus.id != null) {
      return row.id === bookedBus.id;
    }

    return row.busNumber === bookedBus.busNumber
      && row.from === bookedBus.from
      && row.to === bookedBus.to
      && row.departureDate === bookedBus.departureDate
      && row.departureTime === bookedBus.departureTime;
  }

  private resetActiveBookingSession(): void {
    sessionStorage.removeItem('shohoz_passenger_expiry_at');
    sessionStorage.removeItem('shohoz_booking_draft');
    sessionStorage.removeItem('shohoz_passenger_draft');
    sessionStorage.removeItem('shohoz_booking_draft_bus');
    sessionStorage.removeItem('shohoz_booking_draft_launch');
    sessionStorage.removeItem('shohoz_passenger_draft_bus');
    sessionStorage.removeItem('shohoz_passenger_draft_launch');
  }
}
