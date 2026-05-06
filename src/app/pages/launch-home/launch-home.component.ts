import { Component } from '@angular/core';

@Component({
  selector: 'app-launch-home',
  templateUrl: './launch-home.component.html',
  styleUrls: ['./launch-home.component.css']
})
export class LaunchHomeComponent {
  recentFromStations = ['Chittagong', 'Dhaka'];
  recentToStations = ['Dhaka', "Cox's Bazar", 'Barisal', 'Chandokhali', 'Lahiri'];
}
