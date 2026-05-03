import { Component } from '@angular/core';
import { Offer, RouteOption } from './models/booking.models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Shohoz.com';

  travelModes = ['Bus', 'Train'];
  selectedMode = 'Bus';

  popularRoutes: RouteOption[] = [
    { from: 'Dhaka', to: 'Chattogram', departure: '07:30 AM', fare: 'Tk 1,250', seatsLeft: 14 },
    { from: 'Dhaka', to: 'Cox\'s Bazar', departure: '10:45 PM', fare: 'Tk 1,800', seatsLeft: 9 },
    { from: 'Dhaka', to: 'Sylhet', departure: '08:00 AM', fare: 'Tk 980', seatsLeft: 22 },
    { from: 'Dhaka', to: 'Rajshahi', departure: '11:15 PM', fare: 'Tk 1,100', seatsLeft: 12 }
  ];

  offers: Offer[] = [
    { title: 'Weekend Saver', detail: 'Use code SHOHOZ15 and get up to 15% off.' },
    { title: 'Train Priority', detail: 'Pre-book train seats and skip rush-hour queues.' },
    { title: 'Group Booking', detail: 'Book 4+ seats together and unlock special fare.' }
  ];

  onModeChange(mode: string): void {
    this.selectedMode = mode;
  }
}
