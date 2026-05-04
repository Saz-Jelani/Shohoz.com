import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-operator-selector',
  templateUrl: './operator-selector.component.html',
  styleUrls: ['./operator-selector.component.css']
})
export class OperatorSelectorComponent {
  @Input() operators: string[] = [];
  @Input() busOptions: string[] = [];
  @Input() disabled = false;
  @Input() operatorName = '';
  @Input() busName = '';
  @Input() customBusName = '';

  @Output() operatorNameChange = new EventEmitter<string>();
  @Output() busNameChange = new EventEmitter<string>();
  @Output() customBusNameChange = new EventEmitter<string>();
}
