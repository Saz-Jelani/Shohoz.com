import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BusScheduleEntry } from '../../models/bus-management.models';
import { AuthService } from '../../services/auth.service';
import { BusManagementService } from '../../services/bus-management.service';
import { LaunchManagementService } from '../../services/launch-management.service';
import { OperatorService } from '../../services/operator.service';
import { Operator } from '../../models/operator.model';

interface OptionWithId {
  id: number;
  label: string;
}

interface BusTripConfig {
  busNumber: string;
  departureDate: string;
  to: string;
  serviceType: '' | 'AC' | 'Non AC';
  price: number | null;
  discountPrice: number | null;
  departureTime: string;
  arrivalTime: string;
  boardingPoints: string[];
  boardingPointTimes: string[];
  unavailableSeats: string[];
  cabinUnavailableSeats: string[];
  cabinPriceEconomy: number | null;
  cabinPricePremium: number | null;
  isReady: boolean;
}

@Component({
  selector: 'app-admin-bus-management',
  templateUrl: './admin-bus-management.component.html',
  styleUrls: ['./admin-bus-management.component.css']
})
export class AdminBusManagementComponent implements OnInit {
  isLaunchMode = false;
  modeLabel = 'Bus';
  readonly locations: string[] = ['Dhaka', 'Chattogram', "Cox's Bazar", 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur'];
  operators: OptionWithId[] = [];
  operatorLogos: Record<number, string> = {};
  // admin operator management UI state
  managingOperators = false;
  newOperatorName = '';
  newOperatorImageData: string | null = null; // data URI when uploaded
  editingOperatorId: number | null = null;
  editingOperatorName = '';
  editingOperatorImageData: string | null = null;
  readonly busNames: OptionWithId[] = [
    { id: 1, label: 'Scania Coach' },
    { id: 2, label: 'Volvo B11R' },
    { id: 3, label: 'Hino 1J' },
    { id: 4, label: 'Hyundai Universe' },
    { id: 5, label: 'AC Sleeper' }
  ];
  readonly launchNames: OptionWithId[] = [
    { id: 1, label: 'MV Green Pearl' },
    { id: 2, label: 'MV Sunrise' },
    { id: 3, label: 'MV Blue Sky' },
    { id: 4, label: 'MV Bay Queen' },
    { id: 5, label: 'MV Royal Star' }
  ];
  readonly acPriceOptions = [600, 700, 800, 900, 1000];
  readonly nonAcPriceOptions = [500, 600, 700, 800, 900];
  readonly launchCabinEconomyPriceOptions = [1500, 2000];
  readonly launchCabinPremiumPriceOptions = [2000, 2500];
  readonly timeOptions = Array.from({ length: 48 }, (_, i) => this.to12HourLabel(i * 30));
  readonly seatLabels = Array.from({ length: 10 }, (_, i) => String.fromCharCode(65 + i)).flatMap((letter) => [`${letter}1`, `${letter}2`, `${letter}3`, `${letter}4`]);
  readonly cabinSeatLabels = Array.from({ length: 2 }, (_, i) => String.fromCharCode(65 + i)).flatMap((letter) => [`${letter}1`, `${letter}2`, `${letter}3`, `${letter}4`]);
  readonly today = new Date().toISOString().split('T')[0];
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

  selectedFrom = '';
  selectedDepartureDate = this.today;
  selectedOperatorId: number | null = null;
  selectedBusNameId: number | null = null;
  selectedBusNumbers: string[] = [];
  busTripConfigs: BusTripConfig[] = [];
  busRequiredFrom: Record<string, string> = {};
  busMinDepartureAt: Record<string, { date: string; time: string }> = {};
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;
  noticeMessage = '';
  showNotice = false;

  constructor(
    private readonly authService: AuthService,
    private readonly busManagementService: BusManagementService,
    private readonly launchManagementService: LaunchManagementService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly operatorService: OperatorService
  ) {}

  ngOnInit(): void {
    this.isLaunchMode = this.route.snapshot.routeConfig?.path?.includes('launch-management') ?? this.router.url.includes('/admin/launch-management');
    this.modeLabel = this.isLaunchMode ? 'Launch' : 'Bus';
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/']);
    }
    // load operators from API (json-server)
    this.loadOperators();
  }

  private loadOperators(): void {
    this.operatorService.getAllOperators().subscribe({
      next: (ops) => {
        this.operators = ops.map((o) => ({ id: o.id ?? 0, label: o.label }));
        // build logo map
        this.operatorLogos = {};
        ops.forEach((o) => {
          if (o.id) {
            this.operatorLogos[o.id] = o.operatorImage || '';
          }
        });
      },
      error: () => {
        // fallback to default hardcoded operators if API not available
        this.operators = [
          { id: 1, label: 'Green Line' },
          { id: 2, label: 'Hanif' },
          { id: 3, label: 'Shohagh' },
          { id: 4, label: 'Ena' },
          { id: 5, label: 'Soudia' }
        ];
      }
    });
  }

  get availableToLocations(): string[] {
    return this.locations.filter((location) => location !== this.selectedFrom);
  }

  get selectedOperatorLabel(): string {
    return this.operators.find((item) => item.id === this.selectedOperatorId)?.label ?? '';
  }

  get selectedOperatorLogo(): string {
    if (!this.selectedOperatorId) {
      return '';
    }
    return this.operatorLogos[this.selectedOperatorId] ?? '';
  }

  startEditOperator(id: number): void {
    const op = this.operators.find((o) => o.id === id);
    if (!op) return;
    this.editingOperatorId = id;
    this.editingOperatorName = op.label;
    this.editingOperatorImageData = this.operatorLogos[id] || null;
    this.newOperatorName = '';
  }

  cancelEdit(): void {
    this.editingOperatorId = null;
    this.editingOperatorName = '';
    this.editingOperatorImageData = null;
    this.newOperatorName = '';
    this.newOperatorImageData = null;
  }

  onOperatorImageSelected(event: Event, editingId: number | null): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (editingId) {
        this.editingOperatorImageData = result;
      } else {
        this.newOperatorImageData = result;
      }
    };
    reader.readAsDataURL(file);
  }

  saveOperator(): void {
    if (this.editingOperatorId) {
      // update
      const payload: Operator = { label: this.editingOperatorName, operatorImage: this.editingOperatorImageData || undefined };
      this.operatorService.updateOperator(this.editingOperatorId, payload).subscribe({
        next: (op) => {
          this.loadOperators();
          this.cancelEdit();
        },
        error: () => {
          this.errorMessage = 'Unable to update operator.';
        }
      });
      return;
    }

    // create
    if (!this.newOperatorName) {
      this.errorMessage = 'Operator name required.';
      return;
    }
    const payload: Operator = { label: this.newOperatorName, operatorImage: this.newOperatorImageData || undefined };
    this.operatorService.createOperator(payload).subscribe({
      next: (op) => {
        this.loadOperators();
        this.newOperatorName = '';
        this.newOperatorImageData = null;
      },
      error: () => {
        this.errorMessage = 'Unable to create operator.';
      }
    });
  }

  get selectedBusNameLabel(): string {
    return this.nameOptions.find((item) => item.id === this.selectedBusNameId)?.label ?? '';
  }

  get nameOptions(): OptionWithId[] {
    return this.isLaunchMode ? this.launchNames : this.busNames;
  }

  get generatedBusNumbers(): string[] {
    if (!this.selectedOperatorId || !this.selectedBusNameId) {
      return [];
    }
    return [1, 2, 3].map((serial) => `0${this.selectedOperatorId}${this.selectedBusNameId}${serial}`);
  }

  get canPickOperator(): boolean {
    return !!this.selectedFrom;
  }

  get canPickBusName(): boolean {
    return !!this.selectedOperatorId;
  }

  get canPickBusNumber(): boolean {
    return !!this.selectedBusNameId;
  }

  get isReadyToConfirm(): boolean {
    return this.busTripConfigs.length > 0 && this.busTripConfigs.every((trip) => (
      !!trip.departureDate
      && !!trip.to
      && !!trip.serviceType
      && !!trip.price
      && !!trip.departureTime
      && !!trip.arrivalTime
      && (!this.isLaunchMode || (!!trip.cabinPriceEconomy && !!trip.cabinPricePremium))
      && trip.isReady
    ));
  }

  isToDisabled(trip: BusTripConfig): boolean {
    return !trip.departureDate || !trip.departureTime;
  }

  isServiceTypeDisabled(trip: BusTripConfig): boolean {
    return this.isToDisabled(trip) || !trip.to;
  }

  isPriceDisabled(trip: BusTripConfig): boolean {
    return this.isServiceTypeDisabled(trip) || !trip.serviceType;
  }

  isBoardingDisabled(trip: BusTripConfig): boolean {
    return !trip.departureDate || !trip.departureTime;
  }

  isArrivalDisabled(trip: BusTripConfig): boolean {
    return this.isBoardingDisabled(trip);
  }

  isBusSelectableFrom(busNumber: string): boolean {
    const required = this.busRequiredFrom[busNumber];
    return !required || this.selectedFrom === required;
  }

  getBusBookedText(busNumber: string): string {
    const required = this.busRequiredFrom[busNumber];
    if (!required || this.isBusSelectableFrom(busNumber)) {
      return '';
    }
    return `This bus is booked for ${required}`;
  }

  showBusBookedNotice(busNumber: string): void {
    const required = this.busRequiredFrom[busNumber];
    if (!required || this.isBusSelectableFrom(busNumber)) {
      return;
    }
    this.noticeMessage = `If you want to select bus (${busNumber}) then select ${required} in From field.`;
    this.showNotice = true;
  }

  closeNotice(): void {
    this.showNotice = false;
  }

  onFromChange(value: string): void {
    this.selectedFrom = value;
    this.selectedBusNumbers = this.selectedBusNumbers.filter((busNo) => this.isBusSelectableFrom(busNo));
    this.syncTripConfigs();
  }

  onDepartureDateChange(value: string): void {
    this.selectedDepartureDate = value || this.today;
    this.busTripConfigs = this.busTripConfigs.map((trip) => ({
      ...trip,
      departureDate: this.selectedDepartureDate,
      isReady: false
    }));
  }

  onOperatorChange(value: string): void {
    this.selectedOperatorId = value ? Number(value) : null;
    this.resetAfterOperator();
  }

  onBusNameChange(value: string): void {
    this.selectedBusNameId = value ? Number(value) : null;
    this.resetAfterBusName();
    this.refreshBusConstraints();
  }

  onBusNumberToggle(busNumber: string, checked: boolean): void {
    const set = new Set(this.selectedBusNumbers);
    if (checked) {
      if (set.size >= 3 || !this.isBusSelectableFrom(busNumber)) {
        return;
      }
      set.add(busNumber);
    } else {
      set.delete(busNumber);
    }
    this.selectedBusNumbers = [...set];
    this.syncTripConfigs();
  }

  onTripTypeChange(busNumber: string, type: 'AC' | 'Non AC'): void {
    this.busTripConfigs = this.busTripConfigs.map((trip) => trip.busNumber !== busNumber ? trip : { ...trip, serviceType: type, price: null, discountPrice: null, isReady: false });
  }

  onTripPriceChange(busNumber: string, price: number): void {
    this.busTripConfigs = this.busTripConfigs.map((trip) => {
      if (trip.busNumber !== busNumber) {
        return trip;
      }
      const nextDiscount = trip.discountPrice !== null && trip.discountPrice >= price ? null : trip.discountPrice;
      return { ...trip, price, discountPrice: nextDiscount, isReady: false };
    });
  }

  onTripDiscountPriceChange(busNumber: string, rawValue: string): void {
    const parsed = Number(rawValue);
    this.busTripConfigs = this.busTripConfigs.map((trip) => {
      if (trip.busNumber !== busNumber) {
        return trip;
      }
      if (!trip.price || Number.isNaN(parsed) || parsed <= 0 || parsed >= trip.price) {
        return { ...trip, discountPrice: null, isReady: false };
      }
      return { ...trip, discountPrice: parsed, isReady: false };
    });
  }

  updateTrip(busNumber: string, field: keyof Omit<BusTripConfig, 'busNumber' | 'price' | 'serviceType'>, value: string): void {
    this.busTripConfigs = this.busTripConfigs.map((trip) => {
      if (trip.busNumber !== busNumber) {
        return trip;
      }
      const next = { ...trip, [field]: value, isReady: false };
      if (field === 'departureTime') {
        next.boardingPointTimes = this.getDefaultBoardingTimes(value, trip.boardingPoints.length);
      }
      return next;
    });
  }

  addBoardingPoint(busNumber: string): void {
    this.busTripConfigs = this.busTripConfigs.map((trip) => {
      if (trip.busNumber !== busNumber) {
        return trip;
      }
      return {
        ...trip,
        boardingPoints: [...trip.boardingPoints, `Custom Point ${trip.boardingPoints.length + 1}`],
        boardingPointTimes: [...trip.boardingPointTimes, this.getBoardingPointTime(trip.departureTime, trip.boardingPointTimes.length)],
        isReady: false
      };
    });
  }

  updateBoardingPoint(busNumber: string, index: number, value: string): void {
    this.busTripConfigs = this.busTripConfigs.map((trip) => {
      if (trip.busNumber !== busNumber) {
        return trip;
      }
      const next = [...trip.boardingPoints];
      next[index] = value;
      return { ...trip, boardingPoints: next, isReady: false };
    });
  }

  toggleSeat(busNumber: string, seat: string): void {
    this.busTripConfigs = this.busTripConfigs.map((trip) => {
      if (trip.busNumber !== busNumber) {
        return trip;
      }
      const set = new Set(trip.unavailableSeats);
      if (set.has(seat)) {
        set.delete(seat);
      } else {
        set.add(seat);
      }
      return { ...trip, unavailableSeats: [...set], isReady: false };
    });
  }

  onTripCabinPriceChange(busNumber: string, field: 'cabinPriceEconomy' | 'cabinPricePremium', price: number): void {
    this.busTripConfigs = this.busTripConfigs.map((trip) => {
      if (trip.busNumber !== busNumber) {
        return trip;
      }
      return { ...trip, [field]: price, isReady: false };
    });
  }

  toggleCabinSeat(busNumber: string, seat: string): void {
    this.busTripConfigs = this.busTripConfigs.map((trip) => {
      if (trip.busNumber !== busNumber) {
        return trip;
      }
      const set = new Set(trip.cabinUnavailableSeats);
      if (set.has(seat)) {
        set.delete(seat);
      } else {
        set.add(seat);
      }
      return { ...trip, cabinUnavailableSeats: [...set], isReady: false };
    });
  }

  isSeatUnavailable(trip: BusTripConfig, seat: string): boolean {
    return trip.unavailableSeats.includes(seat);
  }

  isCabinSeatUnavailable(trip: BusTripConfig, seat: string): boolean {
    return trip.cabinUnavailableSeats.includes(seat);
  }

  getAvailableSeatCount(trip: BusTripConfig): number {
    return this.seatLabels.length - trip.unavailableSeats.length;
  }

  getAvailableCabinSeatCount(trip: BusTripConfig): number {
    return this.cabinSeatLabels.length - trip.cabinUnavailableSeats.length;
  }

  getSeatRows(): { leftA: string; leftB: string; rightA: string; rightB: string }[] {
    const rows: { leftA: string; leftB: string; rightA: string; rightB: string }[] = [];
    for (let i = 0; i < this.seatLabels.length; i += 4) {
      rows.push({ leftA: this.seatLabels[i], leftB: this.seatLabels[i + 1], rightA: this.seatLabels[i + 2], rightB: this.seatLabels[i + 3] });
    }
    return rows;
  }

  getCabinSeatRows(): { leftA: string; leftB: string; rightA: string; rightB: string }[] {
    const rows: { leftA: string; leftB: string; rightA: string; rightB: string }[] = [];
    for (let i = 0; i < this.cabinSeatLabels.length; i += 4) {
      rows.push({ leftA: this.cabinSeatLabels[i], leftB: this.cabinSeatLabels[i + 1], rightA: this.cabinSeatLabels[i + 2], rightB: this.cabinSeatLabels[i + 3] });
    }
    return rows;
  }

  getBoardingPointTime(departureTime: string, index: number): string {
    if (!departureTime) {
      return '--:--';
    }
    const base = this.parse12HourToMinutes(departureTime);
    if (base === null) {
      return '--:--';
    }
    return this.to12HourLabel(base + (index * 30));
  }

  getTravelDuration(departureTime: string, arrivalTime: string): string {
    const dep = this.parse12HourToMinutes(departureTime);
    const arr = this.parse12HourToMinutes(arrivalTime);
    if (dep === null || arr === null) {
      return '--';
    }
    let diff = arr - dep;
    if (diff < 0) {
      diff += 24 * 60;
    }
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  }

  markBusReady(busNumber: string): void {
    this.busTripConfigs = this.busTripConfigs.map((trip) => {
      if (trip.busNumber !== busNumber) {
        return trip;
      }
      const missingLaunchCabinPrice = this.isLaunchMode && (!trip.cabinPriceEconomy || !trip.cabinPricePremium);
      if (!trip.to || !trip.serviceType || !trip.price || !trip.departureDate || !trip.departureTime || !trip.arrivalTime || trip.boardingPoints.length === 0 || missingLaunchCabinPrice) {
        return trip;
      }
      if (!this.isDepartureAfterHistory(trip.busNumber, trip.departureDate, trip.departureTime)) {
        return trip;
      }
      return { ...trip, isReady: true };
    });
  }

  resetBus(busNumber: string): void {
    const points = this.locationBoardingPoints[this.selectedFrom] ? [...this.locationBoardingPoints[this.selectedFrom]] : [];
    this.busTripConfigs = this.busTripConfigs.map((trip) => trip.busNumber !== busNumber ? trip : {
      ...trip,
      departureDate: this.selectedDepartureDate,
      to: '',
      serviceType: '',
      price: null,
      discountPrice: null,
      departureTime: '',
      arrivalTime: '',
      boardingPoints: points,
      boardingPointTimes: this.getDefaultBoardingTimes('', points.length),
      unavailableSeats: [],
      cabinUnavailableSeats: [],
      cabinPriceEconomy: null,
      cabinPricePremium: null,
      isReady: false
    });
  }

  resetAll(): void {
    this.selectedFrom = '';
    this.selectedOperatorId = null;
    this.selectedBusNameId = null;
    this.selectedBusNumbers = [];
    this.busTripConfigs = [];
    this.busRequiredFrom = {};
    this.busMinDepartureAt = {};
    this.selectedDepartureDate = this.today;
    this.errorMessage = '';
    this.successMessage = '';
  }

  confirmSchedule(): void {
    this.errorMessage = '';
    this.successMessage = '';
    if (!this.selectedFrom || !this.selectedOperatorLabel || !this.selectedBusNameLabel) {
      this.errorMessage = `Please select From, Operator and ${this.modeLabel} Name.`;
      return;
    }
    const blocked = this.selectedBusNumbers.find((busNo) => !this.isBusSelectableFrom(busNo));
    if (blocked) {
      this.errorMessage = `${this.modeLabel} ${blocked} can start only from ${this.busRequiredFrom[blocked]}.`;
      return;
    }
    if (!this.isReadyToConfirm) {
      this.errorMessage = `Complete all selected ${this.modeLabel.toLowerCase()} sections before confirm.`;
      return;
    }
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      this.errorMessage = 'User session missing. Login again.';
      return;
    }

    const requests = this.busTripConfigs.map((trip) => this.getScheduleService().createSchedule({
      from: this.selectedFrom,
      operatorName: this.selectedOperatorLabel,
      operatorImage: this.selectedOperatorLogo || undefined,
      busName: this.selectedBusNameLabel,
      busNumber: trip.busNumber,
      to: trip.to,
      serviceType: trip.serviceType as 'AC' | 'Non AC',
      price: trip.price as number,
      discountPrice: trip.discountPrice,
      departureDate: trip.departureDate,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      boardingPoints: trip.boardingPoints,
      boardingPointTimes: trip.boardingPointTimes,
      unavailableSeats: trip.unavailableSeats,
      cabinUnavailableSeats: this.isLaunchMode ? trip.cabinUnavailableSeats : [],
      cabinPriceEconomy: this.isLaunchMode ? trip.cabinPriceEconomy ?? undefined : undefined,
      cabinPricePremium: this.isLaunchMode ? trip.cabinPricePremium ?? undefined : undefined,
      createdByUserId: currentUser.id as number
    }));

    this.isSubmitting = true;
    forkJoin(requests).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = `All selected ${this.modeLabel.toLowerCase()} schedules saved successfully.`;
        setTimeout(() => {
          window.location.reload();
        }, 500);
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'Could not save schedules. Run json server and try again.';
      }
    });
  }

  trackByBusNumber(_: number, trip: BusTripConfig): string {
    return trip.busNumber;
  }

  trackByIndex(index: number): number {
    return index;
  }

  private syncTripConfigs(): void {
    const map = new Map(this.busTripConfigs.map((trip) => [trip.busNumber, trip]));
    this.busTripConfigs = this.selectedBusNumbers.map((number) => {
      const old = map.get(number);
      if (old) {
        return old;
      }
      const points = this.locationBoardingPoints[this.selectedFrom] ? [...this.locationBoardingPoints[this.selectedFrom]] : [];
      return {
        busNumber: number,
        departureDate: this.selectedDepartureDate,
        to: '',
        serviceType: '',
        price: null,
        discountPrice: null,
        departureTime: '',
        arrivalTime: '',
        boardingPoints: points,
        boardingPointTimes: this.getDefaultBoardingTimes('', points.length),
        unavailableSeats: [],
        cabinUnavailableSeats: [],
        cabinPriceEconomy: null,
        cabinPricePremium: null,
        isReady: false
      };
    });
  }

  private refreshBusConstraints(): void {
    const candidates = this.generatedBusNumbers;
    if (candidates.length === 0) {
      this.busRequiredFrom = {};
      this.busMinDepartureAt = {};
      return;
    }
    const calls = candidates.map((busNo) => this.getScheduleService().getSchedulesByBusNumber(busNo));
    forkJoin(calls).subscribe({
      next: (allRows) => {
        const nextFrom: Record<string, string> = {};
        const nextMin: Record<string, { date: string; time: string }> = {};
        allRows.forEach((rows, idx) => {
          const busNo = candidates[idx];
          const latest = this.findLatestSchedule(rows);
          if (!latest) {
            return;
          }
          nextFrom[busNo] = latest.to;
          const nextAt = this.getNextAvailableFromLatest(latest);
          if (nextAt) {
            nextMin[busNo] = nextAt;
          }
        });
        this.busRequiredFrom = nextFrom;
        this.busMinDepartureAt = nextMin;
        const latestRequiredDate = Object.values(nextMin).map((x) => x.date).sort().pop();
        if (latestRequiredDate && this.selectedDepartureDate < latestRequiredDate) {
          this.selectedDepartureDate = latestRequiredDate;
        }
        this.selectedBusNumbers = this.selectedBusNumbers.filter((busNo) => this.isBusSelectableFrom(busNo));
        this.syncTripConfigs();
      }
    });
  }

  private findLatestSchedule(rows: BusScheduleEntry[]): BusScheduleEntry | null {
    if (!rows.length) {
      return null;
    }
    return [...rows].sort((a, b) => (this.toEpochMinutes(b.departureDate, b.departureTime) ?? 0) - (this.toEpochMinutes(a.departureDate, a.departureTime) ?? 0))[0];
  }

  private getNextAvailableFromLatest(latest: BusScheduleEntry): { date: string; time: string } | null {
    const dep = this.toEpochMinutes(latest.departureDate, latest.departureTime);
    const arr = this.toEpochMinutes(latest.departureDate, latest.arrivalTime);
    if (dep === null || arr === null) {
      return null;
    }
    const normalizedArrival = arr >= dep ? arr : arr + (24 * 60);
    const d = new Date(normalizedArrival * 60000);
    return {
      date: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`,
      time: this.to12HourLabel((d.getUTCHours() * 60) + d.getUTCMinutes())
    };
  }

  private toEpochMinutes(dateText: string, timeText: string): number | null {
    const time = this.parse12HourToMinutes(timeText);
    if (!dateText || time === null) {
      return null;
    }
    const date = new Date(`${dateText}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return Math.floor(date.getTime() / 60000) + time;
  }

  private isDepartureAfterHistory(busNumber: string, date: string, time: string): boolean {
    const minAt = this.busMinDepartureAt[busNumber];
    if (!minAt) {
      return true;
    }
    const cur = this.toEpochMinutes(date, time);
    const min = this.toEpochMinutes(minAt.date, minAt.time);
    return cur !== null && min !== null && cur >= min;
  }

  private resetAfterOperator(): void {
    this.selectedBusNameId = null;
    this.resetAfterBusName();
  }

  private resetAfterBusName(): void {
    this.selectedBusNumbers = [];
    this.busTripConfigs = [];
    this.busRequiredFrom = {};
    this.busMinDepartureAt = {};
  }

  private getScheduleService(): BusManagementService | LaunchManagementService {
    return this.isLaunchMode ? this.launchManagementService : this.busManagementService;
  }

  private to12HourLabel(totalMinutes: number): string {
    const normalized = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
    const hour24 = Math.floor(normalized / 60);
    const minute = normalized % 60;
    const meridiem = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    return `${hour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${meridiem}`;
  }

  private parse12HourToMinutes(value: string): number | null {
    const match = value.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/);
    if (!match) {
      return null;
    }
    const hour12 = Number(match[1]);
    const minute = Number(match[2]);
    const meridiem = match[3];
    if (hour12 < 1 || hour12 > 12 || minute < 0 || minute > 59) {
      return null;
    }
    let hour24 = hour12 % 12;
    if (meridiem === 'PM') {
      hour24 += 12;
    }
    return hour24 * 60 + minute;
  }

  private getDefaultBoardingTimes(departureTime: string, count: number): string[] {
    return Array.from({ length: count }, (_, index) => this.getBoardingPointTime(departureTime, index));
  }
}
