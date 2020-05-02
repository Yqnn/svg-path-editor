import { Component, Input, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-expandable',
  templateUrl: './expandable.component.html',
  styleUrls: ['./expandable.component.scss']
})
export class ExpandableComponent {
  @Input() opened: boolean;
  @Input() panelTitle: string;
  @ViewChild('contentWrapper') contentWrapper: ElementRef;

  opening = false;
  closing = false;
  duration = 200;
  timer: any;
  maxHeight = 'none';

  constructor() { }

  toggle() {
    clearTimeout(this.timer);
    if ((this.opened || this.opening) && !this.closing ) {
      this.closing = true;
      this.opening = false;
      this.maxHeight = this.contentWrapper.nativeElement.getBoundingClientRect().height + 'px';
      setTimeout(() => this.maxHeight = '0', 10);
      this.timer = setTimeout(() => {
        this.opened = false;
        this.closing = false;
      }, this.duration);
    } else {
      this.opening = true;
      this.closing = false;
      this.maxHeight = '0';
      setTimeout(() => this.maxHeight = this.contentWrapper.nativeElement.getBoundingClientRect().height + 'px', 10);
      this.timer = setTimeout(() => {
        this.opened = true;
        this.opening = false;
        this.maxHeight = 'none';
      }, this.duration);
    }
  }

}
