import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  email = '';
  password = '';
  errorMessage = '';
  private readonly successToastStorageKey = 'shohoz_success_toast';
  private readonly loginReturnUrlKey = 'shohoz_login_return_url';
  private readonly loginNoticeKey = 'shohoz_login_notice';
  returnUrl = '';
  warningToastMessage = '';
  showWarningToast = false;
  private warningToastTimer?: ReturnType<typeof setTimeout>;

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

    const loginNotice = sessionStorage.getItem(this.loginNoticeKey);
    if (loginNotice) {
      this.warningToastMessage = loginNotice;
      this.showWarningToast = true;
      sessionStorage.removeItem(this.loginNoticeKey);
      this.warningToastTimer = setTimeout(() => {
        this.showWarningToast = false;
      }, 4000);
    }
  }

  ngOnDestroy(): void {
    if (this.slideTimer) {
      clearInterval(this.slideTimer);
    }
    if (this.warningToastTimer) {
      clearTimeout(this.warningToastTimer);
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.authService.login(this.email, this.password).subscribe({
      next: (ok) => {
        if (ok) {
          const returnUrlFromQuery = this.route.snapshot.queryParamMap.get('returnUrl');
          const returnUrlFromSession = sessionStorage.getItem(this.loginReturnUrlKey);
          const returnUrl = returnUrlFromQuery || returnUrlFromSession || '/';
          sessionStorage.removeItem(this.loginReturnUrlKey);
          sessionStorage.setItem(this.successToastStorageKey, JSON.stringify({
            line1: 'Login',
            line2: 'Successfully Completed !',
            endAt: Date.now() + 3000
          }));
          window.dispatchEvent(new CustomEvent('shohoz-success-toast'));
          this.router.navigateByUrl(returnUrl, { replaceUrl: true });
          return;
        }

        this.errorMessage = 'Invalid email or password';
      },
      error: () => {
        this.errorMessage = 'Server connection failed. Run: npm run db';
      }
    });
  }
}
