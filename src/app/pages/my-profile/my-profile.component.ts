import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthUser } from '../../models/auth.models';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent implements OnInit {
  user: AuthUser | null = null;
  fullName = '';
  email = '';
  message = '';
  errorMessage = '';
  saving = false;

  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.user = currentUser;
    this.fullName = currentUser.name;
    this.email = currentUser.email;
  }

  get initials(): string {
    return (this.user?.name || 'User')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';
  }

  saveProfile(): void {
    if (!this.user?.id) {
      return;
    }

    this.message = '';
    this.errorMessage = '';
    this.saving = true;

    this.authService.updateUser(this.user.id, {
      name: this.fullName.trim(),
      email: this.email.trim()
    }).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.message = 'Profile updated successfully.';
        this.saving = false;
      },
      error: () => {
        this.errorMessage = 'Unable to update profile right now.';
        this.saving = false;
      }
    });
  }
}
