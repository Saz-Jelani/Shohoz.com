import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-launch-home',
  templateUrl: './launch-home.component.html',
  styleUrls: ['./launch-home.component.css']
})
export class LaunchHomeComponent {
  readonly locations: string[] = ['Dhaka', 'Chattogram', "Cox's Bazar", 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur'];

  fromCity = '';
  toCity = '';
  journeyDate = '';
  readonly today = new Date().toISOString().split('T')[0];

  fromSuggestions: string[] = [...this.locations];
  toSuggestions: string[] = [...this.locations];
  showFromDropdown = false;
  showToDropdown = false;

  constructor(private readonly router: Router) {}

  onCityInput(field: 'from' | 'to'): void {
    this.updateSuggestions(field);
    if (field === 'from') {
      this.showFromDropdown = true;
      this.recomputeToLocations();
    } else {
      this.showToDropdown = true;
    }
  }

  onCityFocus(field: 'from' | 'to'): void {
    this.updateSuggestions(field);
    if (field === 'from') {
      this.showFromDropdown = true;
    } else {
      this.showToDropdown = true;
    }
  }

  hideDropdown(field: 'from' | 'to'): void {
    setTimeout(() => {
      if (field === 'from') {
        this.showFromDropdown = false;
      } else {
        this.showToDropdown = false;
      }
    }, 120);
  }

  selectSuggestion(field: 'from' | 'to', district: string): void {
    if (field === 'from') {
      this.fromCity = district;
      this.showFromDropdown = false;
      this.recomputeToLocations();
      this.updateSuggestions('to');
      if (this.toCity && this.toCity === this.fromCity) {
        this.toCity = '';
      }
      return;
    }

    this.toCity = district;
    this.showToDropdown = false;
  }

  onSearch(): void {
    if (!this.fromCity || !this.toCity || !this.journeyDate) {
      return;
    }
    // Navigate to common search results page; pass mode=Launch so results component loads launch schedules
    this.router.navigate(['/launch/search'], {
      queryParams: {
        from: this.fromCity,
        to: this.toCity,
        date: this.journeyDate,
        mode: 'Launch'
      }
    });
  }

  private recomputeToLocations(): void {
    this.toSuggestions = this.locations
      .filter((location) => location.toLowerCase() !== this.fromCity.trim().toLowerCase())
      .sort((a, b) => a.localeCompare(b));
  }

  private updateSuggestions(field: 'from' | 'to'): void {
    const query = (field === 'from' ? this.fromCity : this.toCity).trim().toLowerCase();
    const source = field === 'from' ? this.locations : this.toSuggestions;
    const filtered = source.filter((district) => district.toLowerCase().includes(query));

    if (field === 'from') {
      this.fromSuggestions = filtered;
    } else {
      this.toSuggestions = filtered;
    }
  }
}
