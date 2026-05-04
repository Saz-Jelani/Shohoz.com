import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DestinationPricing } from '../../../models/bus-management.models';

@Component({
  selector: 'app-price-selector',
  templateUrl: './price-selector.component.html',
  styleUrls: ['./price-selector.component.css']
})
export class PriceSelectorComponent {
  @Input() disabled = false;
  @Input() prices: DestinationPricing[] = [];
  @Output() pricesChange = new EventEmitter<DestinationPricing[]>();

  readonly acOptions = [600, 700, 800, 900, 1000];
  readonly nonAcOptions = [500, 600, 700, 800, 900];

  updateFare(to: string, type: 'acFare' | 'nonAcFare', value: number): void {
    if (this.disabled) {
      return;
    }
    const next = this.prices.map((row) => (row.to === to ? { ...row, [type]: value } : row));
    this.pricesChange.emit(next);
  }
}
