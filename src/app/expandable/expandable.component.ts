import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';

import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-expandable',
    templateUrl: './expandable.component.html',
    styleUrls: ['./expandable.component.scss'],
    animations: [
        trigger('openClose', [
            state('*', style({ height: '*' })),
            transition(':enter', [style({ height: '0' }), animate('100ms ease')]),
            transition(':leave', [animate('100ms ease', style({ height: '0' }))]),
        ])
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatIcon]
})
export class ExpandableComponent {
  @Input() opened = true;
  @Input() panelTitle = '';
  @Input() panelInfo = '';

  toggle() {
    this.opened = !this.opened;
  }

}
