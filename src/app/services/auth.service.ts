import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { AuthUser } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/users';
  private readonly tokenKey = 'shohoz_token';
  private readonly userKey = 'shohoz_user';

  constructor(private readonly http: HttpClient) {}

  register(user: AuthUser): Observable<AuthUser> {
    return this.http.post<AuthUser>(this.apiUrl, user);
  }

  updateUser(userId: number, payload: Partial<AuthUser>): Observable<AuthUser> {
    return this.http.patch<AuthUser>(`${this.apiUrl}/${userId}`, payload).pipe(
      tap((updatedUser) => {
        localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
        if (updatedUser.email) {
          localStorage.setItem(this.tokenKey, updatedUser.email);
        }
      })
    );
  }

  changePassword(userId: number, password: string): Observable<AuthUser> {
    return this.updateUser(userId, { password });
  }

  login(email: string, password: string): Observable<boolean> {
    return this.http
      .get<AuthUser[]>(`${this.apiUrl}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`)
      .pipe(
        tap((users) => {
          if (users.length > 0) {
            localStorage.setItem(this.tokenKey, users[0].email);
            localStorage.setItem(this.userKey, JSON.stringify(users[0]));
          }
        }),
        map((users) => users.length > 0)
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): AuthUser | null {
    const rawUser = localStorage.getItem(this.userKey);
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch {
      return null;
    }
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.id === 1;
  }
}
