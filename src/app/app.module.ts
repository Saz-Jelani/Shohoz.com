import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { SearchHeroComponent } from './components/search-hero/search-hero.component';
import { RouteListComponent } from './components/route-list/route-list.component';
import { OffersComponent } from './components/offers/offers.component';
import { BookingSummaryComponent } from './components/booking-summary/booking-summary.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SearchHeroComponent,
    RouteListComponent,
    OffersComponent,
    BookingSummaryComponent
  ],
  imports: [BrowserModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
