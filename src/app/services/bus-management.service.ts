import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BusScheduleEntry } from '../models/bus-management.models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BusManagementService {
  private readonly apiUrl = `${environment.apiBaseUrl}/busSchedules`;
  private readonly bookingsApiUrl = `${environment.apiBaseUrl}/bookings`;

  constructor(private readonly http: HttpClient) {}

  createSchedule(payload: BusScheduleEntry): Observable<BusScheduleEntry> {
    return this.http.post<BusScheduleEntry>(this.apiUrl, payload);
  }

  getSchedulesByBusNumber(busNumber: string): Observable<BusScheduleEntry[]> {
    return this.http.get<BusScheduleEntry[]>(`${this.apiUrl}?busNumber=${encodeURIComponent(busNumber)}`);
  }

  getAllSchedules(): Observable<BusScheduleEntry[]> {
    return this.http.get<BusScheduleEntry[]>(this.apiUrl);
  }

  getScheduleById(id: number): Observable<BusScheduleEntry> {
    return this.http.get<BusScheduleEntry>(`${this.apiUrl}/${id}`);
  }

  updateSchedule(id: number, payload: Partial<BusScheduleEntry>): Observable<BusScheduleEntry> {
    return this.http.patch<BusScheduleEntry>(`${this.apiUrl}/${id}`, payload);
  }

  getAllBookings(): Observable<any[]> {
    return this.http.get<any[]>(this.bookingsApiUrl);
  }
}
