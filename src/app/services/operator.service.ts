import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { Operator } from '../models/operator.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OperatorService {
  private readonly apiUrl = `${environment.apiBaseUrl}/operators`;
  private operatorsCache$?: Observable<Operator[]>;

  constructor(private readonly http: HttpClient) {}

  getAllOperators(): Observable<Operator[]> {
    if (!this.operatorsCache$) {
      this.operatorsCache$ = this.http.get<Operator[]>(this.apiUrl).pipe(shareReplay(1));
    }
    return this.operatorsCache$;
  }

  createOperator(payload: Operator): Observable<Operator> {
    return this.http.post<Operator>(this.apiUrl, payload).pipe(
      tap(() => this.operatorsCache$ = undefined)
    );
  }

  updateOperator(id: number, payload: Operator): Observable<Operator> {
    return this.http.put<Operator>(`${this.apiUrl}/${id}`, payload).pipe(
      tap(() => this.operatorsCache$ = undefined)
    );
  }

  deleteOperator(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.operatorsCache$ = undefined)
    );
  }
}
