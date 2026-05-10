import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { BusScheduleEntry } from '../models/bus-management.models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BusManagementService {
  private readonly apiUrl = `${environment.apiBaseUrl}/busSchedules`;
  private readonly bookingsApiUrl = `${environment.apiBaseUrl}/bookings`;
  private schedulesCache$?: Observable<BusScheduleEntry[]>;
  private bookingsCache$?: Observable<any[]>;

  constructor(private readonly http: HttpClient) {}

  createSchedule(payload: BusScheduleEntry): Observable<BusScheduleEntry> {
    return this.http.post<BusScheduleEntry>(this.apiUrl, payload).pipe(
      tap(() => this.schedulesCache$ = undefined)
    );
  }

  getSchedulesByBusNumber(busNumber: string): Observable<BusScheduleEntry[]> {
    return this.http.get<BusScheduleEntry[]>(`${this.apiUrl}?busNumber=${encodeURIComponent(busNumber)}`);
  }

  getAllSchedules(): Observable<BusScheduleEntry[]> {
    if (!this.schedulesCache$) {
      this.schedulesCache$ = this.http.get<BusScheduleEntry[]>(this.apiUrl).pipe(shareReplay(1));
    }
    return this.schedulesCache$;
  }

  getScheduleById(id: number): Observable<BusScheduleEntry> {
    return this.http.get<BusScheduleEntry>(`${this.apiUrl}/${id}`);
  }

  updateSchedule(id: number, payload: Partial<BusScheduleEntry>): Observable<BusScheduleEntry> {
    return this.http.patch<BusScheduleEntry>(`${this.apiUrl}/${id}`, payload).pipe(
      tap(() => this.schedulesCache$ = undefined)
    );
  }

  getAllBookings(): Observable<any[]> {
    if (!this.bookingsCache$) {
      this.bookingsCache$ = this.http.get<any[]>(this.bookingsApiUrl).pipe(shareReplay(1));
    }
    return this.bookingsCache$;
  }
}
