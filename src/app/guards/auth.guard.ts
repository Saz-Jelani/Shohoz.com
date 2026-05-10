import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private readonly loginReturnUrlKey = 'shohoz_login_return_url';

  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (this.authService.isLoggedIn()) {
      return true;
    }
    sessionStorage.setItem(this.loginReturnUrlKey, state.url);

    return this.router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }
}
