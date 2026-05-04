import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-to-selector',
  templateUrl: './to-selector.component.html',
  styleUrls: ['./to-selector.component.css']
})
export class ToSelectorComponent {
  @Input() availableLocations: string[] = [];
  @Input() disabled = false;
  @Input() selectedTo: string[] = [];
  @Output() selectedToChange = new EventEmitter<string[]>();

  onToggleAll(checked: boolean): void {
    if (this.disabled) {
      return;
    }
    this.selectedToChange.emit(checked ? [...this.availableLocations] : []);
  }

  onToggleLocation(location: string, checked: boolean): void {
    if (this.disabled) {
      return;
    }
    const nextSet = new Set(this.selectedTo);
    if (checked) {
      nextSet.add(location);
    } else {
      nextSet.delete(location);
    }
    this.selectedToChange.emit([...nextSet]);
  }

  isSelected(location: string): boolean {
    return this.selectedTo.includes(location);
  }

  get isAllSelected(): boolean {
    return this.availableLocations.length > 0 && this.selectedTo.length === this.availableLocations.length;
  }
}
