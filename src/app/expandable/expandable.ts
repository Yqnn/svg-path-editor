import { Component, Input } from '@angular/core';

import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-expandable',
  templateUrl: './expandable.html',
  styleUrls: ['./expandable.scss'],
  imports: [MatIcon],
})
export class Expandable {
  @Input() opened = true;
  @Input() panelTitle = '';
  @Input() panelInfo = '';

  toggle() {
    this.opened = !this.opened;
  }

}
