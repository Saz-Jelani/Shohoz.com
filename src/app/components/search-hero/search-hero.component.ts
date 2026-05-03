import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-search-hero',
  templateUrl: './search-hero.component.html',
  styleUrls: ['./search-hero.component.css']
})
export class SearchHeroComponent {
  @Input() selectedMode = 'Bus';

  tripType: 'One Way' | 'Round Trip' = 'Round Trip';
  fromCity = 'Dhaka';
  toCity = 'Destination';

  setTripType(type: 'One Way' | 'Round Trip'): void {
    this.tripType = type;
  }

  swapRoute(): void {
    const currentFrom = this.fromCity;
    this.fromCity = this.toCity;
    this.toCity = currentFrom;
  }
}
