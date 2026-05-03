import { Component, Input } from '@angular/core';
import { Offer } from '../../models/booking.models';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.component.html',
  styleUrls: ['./offers.component.css']
})
export class OffersComponent {
  @Input() offers: Offer[] = [];
}
