import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Operator } from '../models/operator.model';

@Injectable({ providedIn: 'root' })
export class OperatorService {
  private readonly apiUrl = 'http://localhost:3000/operators';

  constructor(private readonly http: HttpClient) {}

  getAllOperators(): Observable<Operator[]> {
    return this.http.get<Operator[]>(this.apiUrl);
  }

  createOperator(payload: Operator): Observable<Operator> {
    return this.http.post<Operator>(this.apiUrl, payload);
  }

  updateOperator(id: number, payload: Operator): Observable<Operator> {
    return this.http.put<Operator>(`${this.apiUrl}/${id}`, payload);
  }

  deleteOperator(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
