import { Component, input, model } from '@angular/core';

import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-expandable',
  templateUrl: './expandable.html',
  styleUrl: './expandable.scss',
  imports: [MatIcon],
})
export class Expandable {
  readonly opened = model(true);
  readonly panelTitle = input('');
  readonly panelInfo = input('');
  hasToggled = false;

  toggle() {
    this.hasToggled = true;
    this.opened.update((opened) => !opened);
  }
}
