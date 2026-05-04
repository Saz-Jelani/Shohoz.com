import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-departure-time-selector',
  templateUrl: './departure-time-selector.component.html',
  styleUrls: ['./departure-time-selector.component.css']
})
export class DepartureTimeSelectorComponent {
  @Input() timeOptions: string[] = [];
  @Input() disabled = false;
  @Input() selectedTime = '';
  @Output() selectedTimeChange = new EventEmitter<string>();
}
