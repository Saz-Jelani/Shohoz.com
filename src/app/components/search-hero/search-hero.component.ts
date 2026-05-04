import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BusScheduleEntry } from '../../models/bus-management.models';
import { BusManagementService } from '../../services/bus-management.service';

@Component({
  selector: 'app-search-hero',
  templateUrl: './search-hero.component.html',
  styleUrls: ['./search-hero.component.css']
})
export class SearchHeroComponent implements OnInit {
  @Input() selectedMode = 'Bus';
  @Input() showInlineResults = false;
  @Input() compactView = false;

  tripType: 'One Way' | 'Round Trip' = 'One Way';
  fromCity = '';
  toCity = '';
  journeyDate = '';
  returnDate = '';
  readonly today = new Date().toISOString().split('T')[0];
  fromPlaceholder = 'From';
  toPlaceholder = 'To';

  allSchedules: BusScheduleEntry[] = [];
  searchResults: BusScheduleEntry[] = [];
  allLocations: string[] = [];
  availableFromLocations: string[] = [];
  availableToLocations: string[] = [];
  fromSuggestions: string[] = [];
  toSuggestions: string[] = [];
  showFromDropdown = false;
  showToDropdown = false;
  errorMessage = '';
  filterAc = false;
  filterNonAc = false;
  selectedOperator = '';
  selectedBoarding = '';
  selectedDropping = '';
  departureWindow = '';
  arrivalWindow = '';
  fareSort: '' | 'asc' | 'desc' = '';

  constructor(
    private readonly busManagementService: BusManagementService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (this.showInlineResults) {
      this.fromCity = this.route.snapshot.queryParamMap.get('from') ?? '';
      this.toCity = this.route.snapshot.queryParamMap.get('to') ?? '';
      this.journeyDate = this.route.snapshot.queryParamMap.get('date') ?? '';
    }
    this.loadSchedules();
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

  onSearch(): void {
    this.errorMessage = '';
    if (!this.fromCity || !this.toCity || !this.journeyDate) {
      this.errorMessage = 'From, To and Journey Date select korte hobe.';
      this.searchResults = [];
      return;
    }

    if (!this.showInlineResults) {
      this.router.navigate(['/bus/search'], {
        queryParams: {
          from: this.fromCity,
          to: this.toCity,
          date: this.journeyDate
        }
      });
      return;
    }

    this.searchResults = this.allSchedules.filter((item) => (
      item.from.toLowerCase() === this.fromCity.toLowerCase()
      && item.to.toLowerCase() === this.toCity.toLowerCase()
      && item.departureDate === this.journeyDate
    ));

    if (this.searchResults.length === 0) {
      this.errorMessage = 'Ei route/date e kono bus pawa jayni.';
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
    return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  private loadSchedules(): void {
    this.busManagementService.getAllSchedules().subscribe({
      next: (rows) => {
        this.allSchedules = rows;
        this.availableFromLocations = [...new Set(rows.map((item) => item.from))].sort((a, b) => a.localeCompare(b));
        this.allLocations = [...new Set(rows.flatMap((item) => [item.from, item.to]))].sort((a, b) => a.localeCompare(b));
        this.recomputeToLocations();
        this.updateSuggestions('from');
        if (this.showInlineResults && this.fromCity && this.toCity && this.journeyDate) {
          this.onSearch();
        }
      },
      error: () => {
        this.errorMessage = 'Bus data load korte problem hocche.';
      }
    });
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
}
