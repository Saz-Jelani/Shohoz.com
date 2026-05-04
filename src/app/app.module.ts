import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { SearchHeroComponent } from './components/search-hero/search-hero.component';
import { RouteListComponent } from './components/route-list/route-list.component';
import { OffersComponent } from './components/offers/offers.component';
import { BookingSummaryComponent } from './components/booking-summary/booking-summary.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AdminBusManagementComponent } from './pages/admin-bus-management/admin-bus-management.component';
import { FromSelectorComponent } from './components/admin/from-selector/from-selector.component';
import { OperatorSelectorComponent } from './components/admin/operator-selector/operator-selector.component';
import { ToSelectorComponent } from './components/admin/to-selector/to-selector.component';
import { PriceSelectorComponent } from './components/admin/price-selector/price-selector.component';
import { DepartureTimeSelectorComponent } from './components/admin/departure-time-selector/departure-time-selector.component';
import { ArrivalTimeSelectorComponent } from './components/admin/arrival-time-selector/arrival-time-selector.component';
import { MainLayoutComponent } from './components/layout/main-layout/main-layout.component';
import { FooterComponent } from './components/footer/footer.component';
import { BusSearchResultsComponent } from './pages/bus-search-results/bus-search-results.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SearchHeroComponent,
    RouteListComponent,
    OffersComponent,
    BookingSummaryComponent,
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    AdminBusManagementComponent,
    FromSelectorComponent,
    OperatorSelectorComponent,
    ToSelectorComponent,
    PriceSelectorComponent,
    DepartureTimeSelectorComponent,
    ArrivalTimeSelectorComponent,
    MainLayoutComponent,
    FooterComponent,
    BusSearchResultsComponent
  ],
  imports: [BrowserModule, AppRoutingModule, FormsModule, HttpClientModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
