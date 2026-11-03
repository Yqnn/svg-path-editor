import { Component, input, model } from '@angular/core';

import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-expandable',
  templateUrl: './expandable.html',
  styleUrls: ['./expandable.scss'],
  imports: [MatIcon],
})
export class Expandable {
  readonly opened = model(true);
  readonly panelTitle = input('');
  readonly panelInfo = input('');

  toggle() {
    this.opened.update((opened) => !opened);
  }
}
