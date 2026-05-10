import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminBusManagementComponent } from './pages/admin-bus-management/admin-bus-management.component';
import { MainLayoutComponent } from './components/layout/main-layout/main-layout.component';
import { BusSearchResultsComponent } from './pages/bus-search-results/bus-search-results.component';
import { PassengerDetailsComponent } from './pages/passenger-details/passenger-details.component';
import { ReviewPayComponent } from './pages/review-pay/review-pay.component';
import { MyProfileComponent } from './pages/my-profile/my-profile.component';
import { ChangePasswordComponent } from './pages/change-password/change-password.component';
import { LaunchHomeComponent } from './pages/launch-home/launch-home.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'bus/search', component: BusSearchResultsComponent },
      { path: 'launch/search', component: BusSearchResultsComponent },
      { path: 'bus/passenger-details', component: PassengerDetailsComponent, canActivate: [AuthGuard] },
      { path: 'launch/passenger-details', component: PassengerDetailsComponent, canActivate: [AuthGuard] },
      { path: 'bus/review-pay', component: ReviewPayComponent, canActivate: [AuthGuard] },
      { path: 'launch/review-pay', component: ReviewPayComponent, canActivate: [AuthGuard] },
      { path: 'launch-tickets', component: LaunchHomeComponent },
      { path: 'my-profile', component: MyProfileComponent, canActivate: [AuthGuard] },
      { path: 'change-password', component: ChangePasswordComponent, canActivate: [AuthGuard] },
      { path: 'admin/bus-management', component: AdminBusManagementComponent, canActivate: [AuthGuard] },
      { path: 'admin/launch-management', component: AdminBusManagementComponent, canActivate: [AuthGuard] }
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
