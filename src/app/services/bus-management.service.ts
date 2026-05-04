import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BusScheduleEntry } from '../models/bus-management.models';

@Injectable({ providedIn: 'root' })
export class BusManagementService {
  private readonly apiUrl = 'http://localhost:3000/busSchedules';

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
}
