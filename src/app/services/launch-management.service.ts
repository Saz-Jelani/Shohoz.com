import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { LaunchScheduleEntry } from '../models/launch-management.models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LaunchManagementService {
  private readonly apiUrl = `${environment.apiBaseUrl}/launchSchedules`;
  private schedulesCache$?: Observable<LaunchScheduleEntry[]>;

  constructor(private readonly http: HttpClient) {}

  createSchedule(payload: LaunchScheduleEntry): Observable<LaunchScheduleEntry> {
    return this.http.post<LaunchScheduleEntry>(this.apiUrl, payload).pipe(
      tap(() => this.schedulesCache$ = undefined)
    );
  }

  getSchedulesByBusNumber(busNumber: string): Observable<LaunchScheduleEntry[]> {
    return this.http.get<LaunchScheduleEntry[]>(`${this.apiUrl}?busNumber=${encodeURIComponent(busNumber)}`);
  }

  getAllSchedules(): Observable<LaunchScheduleEntry[]> {
    if (!this.schedulesCache$) {
      this.schedulesCache$ = this.http.get<LaunchScheduleEntry[]>(this.apiUrl).pipe(shareReplay(1));
    }
    return this.schedulesCache$;
  }

  getScheduleById(id: number): Observable<LaunchScheduleEntry> {
    return this.http.get<LaunchScheduleEntry>(`${this.apiUrl}/${id}`);
  }

  updateSchedule(id: number, payload: Partial<LaunchScheduleEntry>): Observable<LaunchScheduleEntry> {
    return this.http.patch<LaunchScheduleEntry>(`${this.apiUrl}/${id}`, payload).pipe(
      tap(() => this.schedulesCache$ = undefined)
    );
  }
}
