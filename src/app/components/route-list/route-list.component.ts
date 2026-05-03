import { Component, Input } from '@angular/core';
import { RouteOption } from '../../models/booking.models';

@Component({
  selector: 'app-route-list',
  templateUrl: './route-list.component.html',
  styleUrls: ['./route-list.component.css']
})
export class RouteListComponent {
  @Input() popularRoutes: RouteOption[] = [];
}
