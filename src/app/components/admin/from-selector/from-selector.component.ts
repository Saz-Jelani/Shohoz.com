import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-from-selector',
  templateUrl: './from-selector.component.html',
  styleUrls: ['./from-selector.component.css']
})
export class FromSelectorComponent {
  @Input() locations: string[] = [];
  @Input() selectedFrom = '';
  @Output() selectedFromChange = new EventEmitter<string>();
}
