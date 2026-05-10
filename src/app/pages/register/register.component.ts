import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, OnDestroy {
  firstName = '';
  lastName = '';
  mobile = '';
  email = '';
  gender: 'Male' | 'Female' = 'Male';
  password = '';
  confirmPassword = '';
  message = '';
  errorMessage = '';
  private readonly loginReturnUrlKey = 'shohoz_login_return_url';
  returnUrl = '';

  readonly slideImages: string[] = [
    encodeURI('assets/log_reg/download (1).jpg'),
    encodeURI('assets/log_reg/download (2).jpg'),
    encodeURI('assets/log_reg/download.jpg'),
    encodeURI('assets/log_reg/Good Evening.jpg'),
    encodeURI('assets/log_reg/sunset bus.jpg')
  ];
  currentSlideIndex = 0;
  private slideTimer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl')
      || sessionStorage.getItem(this.loginReturnUrlKey)
      || '';
    this.slideTimer = setInterval(() => {
      this.currentSlideIndex = (this.currentSlideIndex + 1) % this.slideImages.length;
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
    }
  }

  onSubmit(): void {
    this.message = '';
    this.errorMessage = '';
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Password and confirm password do not match';
      return;
    }

    const fullName = `${this.firstName} ${this.lastName}`.trim();
    this.authService.register({ name: fullName, email: this.email, password: this.password }).subscribe({
      next: () => {
        this.message = 'Registration successful. Please login.';
        this.router.navigate(['/login'], {
          queryParams: this.returnUrl ? { returnUrl: this.returnUrl } : undefined
        });
      },
      error: () => {
        this.errorMessage = 'Server connection failed. Run: npm run db';
      }
    });
  }
}
