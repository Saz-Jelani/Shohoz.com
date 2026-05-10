import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { AuthUser } from '../models/auth.models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiBaseUrl}/users`;
  private readonly tokenKey = 'shohoz_token';
  private readonly userKey = 'shohoz_user';
  private readonly usersKey = 'shohoz_users_local';

  constructor(private readonly http: HttpClient) {}

  register(user: AuthUser): Observable<AuthUser> {
    if (environment.production) {
      const users = this.getLocalUsers();
      const email = user.email.trim().toLowerCase();
      if (users.some((u) => u.email.trim().toLowerCase() === email)) {
        return throwError(() => new Error('Email already exists'));
      }
      const created: AuthUser = { ...user, id: this.getNextLocalUserId(users) };
      users.push(created);
      this.setLocalUsers(users);
      return of(created);
    }
    return this.http.post<AuthUser>(this.apiUrl, user);
  }

  updateUser(userId: number, payload: Partial<AuthUser>): Observable<AuthUser> {
    if (environment.production) {
      const users = this.getLocalUsers();
      const index = users.findIndex((u) => (u.id ?? 0) === userId);
      if (index < 0) {
        return throwError(() => new Error('User not found'));
      }
      const updatedUser = { ...users[index], ...payload, id: users[index].id };
      users[index] = updatedUser;
      this.setLocalUsers(users);
      localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
      if (updatedUser.email) {
        localStorage.setItem(this.tokenKey, updatedUser.email);
      }
      return of(updatedUser);
    }

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
    if (!environment.production) {
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

    return this.http
      .get<AuthUser[]>(`${this.apiUrl}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`)
      .pipe(
        catchError(() => of([])),
        map((apiUsers) => {
          if (apiUsers.length > 0) {
            return apiUsers[0];
          }
          const localUsers = this.getLocalUsers();
          return localUsers.find((u) => u.email === email && u.password === password) ?? null;
        }),
        tap((user) => {
          if (user) {
            localStorage.setItem(this.tokenKey, user.email);
            localStorage.setItem(this.userKey, JSON.stringify(user));
          }
        }),
        map((user) => !!user)
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

  private getLocalUsers(): AuthUser[] {
    const raw = localStorage.getItem(this.usersKey);
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw) as AuthUser[];
    } catch {
      return [];
    }
  }

  private setLocalUsers(users: AuthUser[]): void {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  private getNextLocalUserId(users: AuthUser[]): number {
    return users.reduce((max, user) => Math.max(max, user.id ?? 0), 1) + 1;
  }
}
