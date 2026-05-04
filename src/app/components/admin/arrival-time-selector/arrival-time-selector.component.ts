import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-arrival-time-selector',
  templateUrl: './arrival-time-selector.component.html',
  styleUrls: ['./arrival-time-selector.component.css']
})
export class ArrivalTimeSelectorComponent {
  @Input() timeOptions: string[] = [];
  @Input() disabled = false;
  @Input() selectedTime = '';
  @Output() selectedTimeChange = new EventEmitter<string>();
}
