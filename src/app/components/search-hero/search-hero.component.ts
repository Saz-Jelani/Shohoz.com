import { Component, Input, OnInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BusScheduleEntry } from '../../models/bus-management.models';
import { BusManagementService } from '../../services/bus-management.service';
import { LaunchManagementService } from '../../services/launch-management.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-search-hero',
  templateUrl: './search-hero.component.html',
  styleUrls: ['./search-hero.component.css']
})
export class SearchHeroComponent implements OnInit {
  @Input() selectedMode = 'Bus';
  @Input() showInlineResults = false;
  @Input() compactView = false;
  @Output() bookTicket = new EventEmitter<BusScheduleEntry>();

  tripType: 'One Way' | 'Round Trip' = 'One Way';
  fromCity = '';
  toCity = '';
  journeyDate = '';
  returnDate = '';
  readonly today = new Date().toISOString().split('T')[0];

  @ViewChild('fromInput') fromInput?: ElementRef<HTMLInputElement>;
  fromPlaceholder = 'From';
  toPlaceholder = 'To';

  allSchedules: BusScheduleEntry[] = [];
  searchResults: BusScheduleEntry[] = [];
  // Master list of possible locations (includes locations without active schedules)
  masterLocations: string[] = ['Dhaka', 'Chattogram', "Cox's Bazar", 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur'];
  allLocations: string[] = [];
  availableFromLocations: string[] = [];
  availableToLocations: string[] = [];
  fromSuggestions: string[] = [];
  toSuggestions: string[] = [];
  showFromDropdown = false;
  showToDropdown = false;
  errorMessage = '';
  fromError = '';
  toError = '';
  dateError = '';
  filterAc = false;
  filterNonAc = false;
  selectedOperator = '';
  selectedBoarding = '';
  selectedDropping = '';
  departureWindow = '';
  arrivalWindow = '';
  fareSort: '' | 'asc' | 'desc' = '';
  isRadioAnimating = false;
  isMobileLayout = false;
  trendingDestinations = [
    {
      title: 'Chittagong',
      href: '/bus-tickets/destinations/chittagong',
      image: 'assets/home_img/Chittagong.png',
      sizeClass: 'half'
    },
    {
      title: 'Dhaka',
      href: '/bus-tickets/destinations/dhaka',
      image: 'assets/home_img/Dhaka.png',
      sizeClass: 'half'
    },
    {
      title: 'Rajshahi',
      href: '/bus-tickets/destinations/rajshahi',
      image: 'assets/home_img/Rajshahi.png',
      sizeClass: 'third'
    },
    {
      title: 'Rangpur',
      href: '/bus-tickets/destinations/rangpur',
      image: 'assets/home_img/Rangpur.png',
      sizeClass: 'third'
    },
    {
      title: 'Sylhet',
      href: '/bus-tickets/destinations/sylhet',
      image: 'assets/home_img/Sylhet.png',
      sizeClass: 'third'
    }
  ];

  recentSearches: { from: string; to: string; date: string; returnDate?: string; tripType: 'One Way' | 'Round Trip'; createdAt: string }[] = [];

  constructor(
    private readonly busManagementService: BusManagementService,
    private readonly launchManagementService: LaunchManagementService,
    public readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.syncMobileLayout();
    if (this.showInlineResults) {
      this.fromCity = this.route.snapshot.queryParamMap.get('from') ?? '';
      this.toCity = this.route.snapshot.queryParamMap.get('to') ?? '';
      this.journeyDate = this.route.snapshot.queryParamMap.get('date') ?? '';
      this.returnDate = this.route.snapshot.queryParamMap.get('returnDate') ?? '';
      if (this.returnDate) {
        this.tripType = 'Round Trip';
      }
    }
    this.loadSchedules();
    this.loadRecentSearches();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncMobileLayout();
  }

  setTripType(type: 'One Way' | 'Round Trip'): void {
    this.tripType = type;
    if (type === 'One Way') {
      this.returnDate = '';
    }
  }

  swapRoute(): void {
    const currentFrom = this.fromCity;
    this.fromCity = this.toCity;
    this.toCity = currentFrom;
    this.recomputeToLocations();
  }

  onCityInput(field: 'from' | 'to'): void {
    this.updateSuggestions(field);
    if (field === 'from') {
      this.showFromDropdown = true;
      this.recomputeToLocations();
    } else {
      this.showToDropdown = true;
    }
  }

  onCityFocus(field: 'from' | 'to'): void {
    this.updateSuggestions(field);
    if (field === 'from') {
      this.showFromDropdown = true;
    } else {
      this.showToDropdown = true;
    }
  }

  hideDropdown(field: 'from' | 'to'): void {
    setTimeout(() => {
      if (field === 'from') {
        this.showFromDropdown = false;
      } else {
        this.showToDropdown = false;
      }
    }, 120);
  }

  selectSuggestion(field: 'from' | 'to', district: string): void {
    if (field === 'from') {
      this.fromCity = district;
      this.showFromDropdown = false;
      this.recomputeToLocations();
      this.updateSuggestions('to');
      if (this.toCity && this.toCity === this.fromCity) {
        this.toCity = '';
      }
      return;
    }

    this.toCity = district;
    this.showToDropdown = false;
  }

  onJourneyDateChange(): void {
    if (this.returnDate && this.returnDate < this.journeyDate) {
      this.returnDate = '';
    }
  }

  openReturnPicker(input: HTMLInputElement): void {
    this.tripType = 'Round Trip';
    this.isRadioAnimating = true;
    setTimeout(() => {
      this.isRadioAnimating = false;
    }, 600);
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }
    input.click();
  }

  openJourneyPicker(input: HTMLInputElement): void {
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }
    input.click();
  }

  /**
   * Maps operator image paths to PNG equivalents if available, and handles data URIs.
   * @param operatorImage The original operator image path or data URI
   * @returns The preferred PNG path, or the original if not mappable
   */
  getOperatorImage(operatorImage?: string): string {
    // default to existing greenline PNG asset when none provided
    if (!operatorImage) {
      return 'assets/operators/greenline.png';
    }
    // If it's a data URI, return as is
    if (operatorImage.startsWith('data:')) {
      return operatorImage;
    }
    // Map .svg to .png where possible, with a couple of name fixes for existing png files
    if (operatorImage.endsWith('.svg')) {
      // normalize name then map to known png equivalents when names differ
      let base = operatorImage.replace('.svg', '');
      // canonical mappings for misspelled/different filenames in assets
      base = base.replace('assets/operators/green-line', 'assets/operators/greenline');
      base = base.replace('assets/operators/shohagh', 'assets/operators/shohag');
      base = base.replace('assets/operators/soudia', 'assets/operators/saudia');
      return `${base}.png`;
    }

    // If operatorImage already points to a PNG but filename is misspelled in db, normalize common cases
    let normalized = operatorImage;
    normalized = normalized.replace('assets/operators/green-line.png', 'assets/operators/greenline.png');
    normalized = normalized.replace('assets/operators/soudia.png', 'assets/operators/saudia.png');
    normalized = normalized.replace('assets/operators/shohagh.png', 'assets/operators/shohag.png');
    return normalized;
  }

  onSearch(): void {
    // clear previous errors
    this.errorMessage = '';
    this.fromError = '';
    this.toError = '';
    this.dateError = '';

    // Home (floating) search shows per-field errors under each field.
    if (!this.showInlineResults) {
      let hasError = false;
      if (!this.fromCity) {
        this.fromError = 'Please choose departure city.';
        hasError = true;
      }
      if (!this.toCity) {
        this.toError = 'Please choose destination city.';
        hasError = true;
      }
      if (!this.journeyDate) {
        this.dateError = 'Please select date of your journey';
        hasError = true;
      }
      if (hasError) {
        this.searchResults = [];
        return;
      }

      // no errors -> navigate to search page (recent will be added only when results exist on the search page)
      const targetPath = this.selectedMode === 'Launch' ? '/launch/search' : '/bus/search';
      this.router.navigate([targetPath], {
        queryParams: {
          from: this.fromCity,
          to: this.toCity,
          date: this.journeyDate,
          mode: this.selectedMode,
          ...(this.returnDate && { returnDate: this.returnDate })
        }
      });
      return;
    }

    // Inline results mode keeps previous behavior (general error message)
    if (!this.fromCity || !this.toCity || !this.journeyDate) {
      this.errorMessage = 'From, To and Journey Date select korte hobe.';
      this.searchResults = [];
      return;
    }

    // Keep URL in sync with the latest inline search so browser Back returns to latest query.
    const targetPath = this.selectedMode === 'Launch' ? '/launch/search' : '/bus/search';
    this.router.navigate([targetPath], {
      queryParams: {
        from: this.fromCity,
        to: this.toCity,
        date: this.journeyDate,
        mode: this.selectedMode,
        ...(this.returnDate && { returnDate: this.returnDate })
      },
      replaceUrl: true
    });

    this.searchResults = this.allSchedules.filter((item) => {
      const routeMatches = item.from.toLowerCase() === this.fromCity.toLowerCase()
        && item.to.toLowerCase() === this.toCity.toLowerCase();
      const dateMatches = item.departureDate === this.journeyDate
        || (this.returnDate && item.departureDate === this.returnDate);
      return routeMatches && dateMatches;
    });

    if (this.searchResults.length === 0) {
      // For inline results show the empty state UI (do not set errorMessage)
      if (!this.showInlineResults) {
        this.errorMessage = 'Ei route/date e kono bus pawa jayni.';
      } else {
        this.errorMessage = '';
      }
    }

    // If inline results mode and we found buses, persist as recent (max 3)
    if (this.showInlineResults && this.searchResults.length > 0) {
      this.saveRecentSearch();
    }
  }

  getAvailableSeats(item: BusScheduleEntry): number {
    return 40 - item.unavailableSeats.length;
  }

  getDiscountAmount(item: BusScheduleEntry): number {
    if (!item.discountPrice || item.discountPrice >= item.price) {
      return 0;
    }
    return item.discountPrice;
  }

  getDisplayPrice(item: BusScheduleEntry): number {
    return this.getDiscountAmount(item) > 0 ? item.price - this.getDiscountAmount(item) : item.price;
  }

  get operatorOptions(): string[] {
    return [...new Set(this.searchResults.map((x) => x.operatorName))].sort((a, b) => a.localeCompare(b));
  }

  get boardingOptions(): string[] {
    return [...new Set(this.searchResults.flatMap((x) => x.boardingPoints || []))].sort((a, b) => a.localeCompare(b));
  }

  get droppingOptions(): string[] {
    return [...new Set(this.searchResults.map((x) => x.to))].sort((a, b) => a.localeCompare(b));
  }

  get filteredSearchResults(): BusScheduleEntry[] {
    return this.searchResults.filter((item) => {
      if (this.filterAc && item.serviceType !== 'AC') {
        return false;
      }
      if (this.filterNonAc && item.serviceType !== 'Non AC') {
        return false;
      }
      if (this.selectedOperator && item.operatorName !== this.selectedOperator) {
        return false;
      }
      if (this.selectedBoarding && !item.boardingPoints.includes(this.selectedBoarding)) {
        return false;
      }
      if (this.selectedDropping && item.to !== this.selectedDropping) {
        return false;
      }
      if (this.departureWindow && !this.matchesTimeWindow(item.departureTime, this.departureWindow)) {
        return false;
      }
      if (this.arrivalWindow && !this.matchesTimeWindow(item.arrivalTime, this.arrivalWindow)) {
        return false;
      }
      return true;
    });
  }

  get sortedFilteredSearchResults(): BusScheduleEntry[] {
    const rows = [...this.filteredSearchResults];
    if (this.fareSort === 'asc') {
      rows.sort((a, b) => this.getDisplayPrice(a) - this.getDisplayPrice(b));
    } else if (this.fareSort === 'desc') {
      rows.sort((a, b) => this.getDisplayPrice(b) - this.getDisplayPrice(a));
    }
    return rows;
  }

  resetFilters(): void {
    this.filterAc = false;
    this.filterNonAc = false;
    this.selectedOperator = '';
    this.selectedBoarding = '';
    this.selectedDropping = '';
    this.departureWindow = '';
    this.arrivalWindow = '';
    this.fareSort = '';
  }

  getDuration(item: BusScheduleEntry): string {
    const dep = this.parse12HourToMinutes(item.departureTime);
    const arr = this.parse12HourToMinutes(item.arrivalTime);
    if (dep === null || arr === null) {
      return '-';
    }
    const total = arr >= dep ? arr - dep : (24 * 60 - dep) + arr;
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return `${hours}h ${mins}m`;
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

  private loadSchedules(): void {
    const scheduleService = this.selectedMode === 'Launch' ? this.launchManagementService : this.busManagementService;
    scheduleService.getAllSchedules().subscribe({
      next: (rows) => {
        this.busManagementService.getAllBookings().subscribe({
          next: (bookings) => {
            this.allSchedules = this.mergeBookedSeats(rows, bookings);
            // include master locations so dropdown shows every location even if no schedules exist for them
            this.availableFromLocations = [...new Set([...this.masterLocations, ...rows.map((item) => item.from)])].sort((a, b) => a.localeCompare(b));
            this.allLocations = [...new Set([...this.masterLocations, ...rows.flatMap((item) => [item.from, item.to])])].sort((a, b) => a.localeCompare(b));
            this.recomputeToLocations();
            this.updateSuggestions('from');
            if (this.showInlineResults && this.fromCity && this.toCity && this.journeyDate) {
              this.onSearch();
            }
          },
          error: () => {
            this.allSchedules = rows;
            this.availableFromLocations = [...new Set([...this.masterLocations, ...rows.map((item) => item.from)])].sort((a, b) => a.localeCompare(b));
            this.allLocations = [...new Set([...this.masterLocations, ...rows.flatMap((item) => [item.from, item.to])])].sort((a, b) => a.localeCompare(b));
            this.recomputeToLocations();
            this.updateSuggestions('from');
            if (this.showInlineResults && this.fromCity && this.toCity && this.journeyDate) {
              this.onSearch();
            }
          }
        });
      },
      error: () => {
        this.errorMessage = 'Bus data load korte problem hocche.';
      }
    });
  }

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

  private recomputeToLocations(): void {
    this.availableToLocations = this.allLocations
      .filter((location) => location.toLowerCase() !== this.fromCity.trim().toLowerCase())
      .sort((a, b) => a.localeCompare(b));
  }

  private updateSuggestions(field: 'from' | 'to'): void {
    const query = (field === 'from' ? this.fromCity : this.toCity).trim().toLowerCase();
    const source = field === 'from' ? this.availableFromLocations : this.availableToLocations;
    const filtered = source.filter((district) => district.toLowerCase().includes(query));

    if (field === 'from') {
      this.fromSuggestions = filtered;
    } else {
      this.toSuggestions = filtered;
    }
  }

  private parse12HourToMinutes(value: string): number | null {
    const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) {
      return null;
    }
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const suffix = match[3].toUpperCase();

    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
      return null;
    }
    if (hour === 12) {
      hour = 0;
    }
    if (suffix === 'PM') {
      hour += 12;
    }
    return (hour * 60) + minute;
  }

  private matchesTimeWindow(timeText: string, window: string): boolean {
    const mins = this.parse12HourToMinutes(timeText);
    if (mins === null) {
      return false;
    }
    if (window === 'early') {
      return mins < 360;
    }
    if (window === 'morning') {
      return mins >= 360 && mins < 720;
    }
    if (window === 'afternoon') {
      return mins >= 720 && mins < 1080;
    }
    if (window === 'evening') {
      return mins >= 1080;
    }
    return true;
  }

  // Recent searches: persisted per-user via localStorage
  private recentKey(): string {
    const u = this.authService.getCurrentUser();
    return u ? `recentSearches_${u.id}` : 'recentSearches_guest';
  }

  private loadRecentSearches(): void {
    try {
      const raw = localStorage.getItem(this.recentKey());
      const arr = raw ? JSON.parse(raw) : [];
      const today = this.today;
      const filtered = Array.isArray(arr)
        ? arr
            .filter((entry) => this.isRecentSearchCurrent(entry, today))
            .slice(0, 3)
        : [];
      this.recentSearches = filtered;
      if (Array.isArray(arr) && filtered.length !== arr.length) {
        localStorage.setItem(this.recentKey(), JSON.stringify(filtered));
      }
    } catch {
      this.recentSearches = [];
    }
  }

  private syncMobileLayout(): void {
    this.isMobileLayout = typeof window !== 'undefined' ? window.innerWidth <= 991.98 : false;
  }

  private isRecentSearchCurrent(entry: any, today: string): boolean {
    if (!entry?.date) {
      return false;
    }
    const tripDate = new Date(`${entry.date}T00:00:00`);
    if (Number.isNaN(tripDate.getTime())) {
      return false;
    }
    return entry.date >= today;
  }

  private saveRecentSearch(): void {
    const u = this.authService.getCurrentUser();
    if (!u) return; // only persist for logged-in users
    const entry = { from: this.fromCity, to: this.toCity, date: this.journeyDate, returnDate: this.returnDate || undefined, tripType: this.tripType, createdAt: new Date().toISOString() };
    const key = `recentSearches_${u.id}`;
    let arr: any[] = [];
    try { arr = localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key) as string) : []; } catch { arr = []; }
    arr = arr.filter((s) => !(s.from === entry.from && s.to === entry.to && s.date === entry.date && s.returnDate === entry.returnDate));
    arr.unshift(entry);
    if (arr.length > 3) arr = arr.slice(0, 3);
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch {}
    this.recentSearches = arr;
  }

  onRecentSearchClick(rs: any): void {
    const params: any = { from: rs.from, to: rs.to, date: rs.date };
    if (rs.returnDate) params.returnDate = rs.returnDate;
    params.mode = this.selectedMode;
    const targetPath = this.selectedMode === 'Launch' ? '/launch/search' : '/bus/search';
    this.router.navigate([targetPath], { queryParams: params });
  }

  clearSearchInputs(): void {
    this.fromCity = '';
    this.toCity = '';
    this.journeyDate = '';
    this.returnDate = '';
    this.tripType = 'One Way';
    this.errorMessage = '';
    this.fromError = '';
    this.toError = '';
    this.dateError = '';
    this.showFromDropdown = false;
    this.showToDropdown = false;
    setTimeout(() => this.fromInput?.nativeElement.focus(), 0);
  }

  startNewSearch(): void {
    this.clearSearchInputs();
  }
}
