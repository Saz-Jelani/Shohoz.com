import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-coming-soon',
  templateUrl: './coming-soon.component.html',
  styleUrls: ['./coming-soon.component.css']
})
export class ComingSoonComponent {
  featureName = '';

  constructor(private readonly route: ActivatedRoute) {
    this.route.queryParamMap.subscribe((params) => {
      this.featureName = (params.get('feature') || '').trim();
    });
  }
}
