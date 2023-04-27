import { Component, Input, OnInit } from '@angular/core';
import { browserComputePathBoundingBox } from '../svg-bbox';

@Component({
  selector: 'app-path-preview',
  templateUrl: './path-preview.component.html'
})
export class PathPreviewComponent implements OnInit {
  @Input() x?: number;
  @Input() y?: number;
  @Input() width?: number;
  @Input() height?: number;

  @Input() fillColor?: string = '#000000';
  @Input() strokeColor?: string;
  @Input() strokeWidth?: number;
  @Input() path = '';

  ngOnInit(): void {
    if(this.x === undefined || this.y === undefined || this.width === undefined || this.height === undefined) {
      const bbox = browserComputePathBoundingBox(this.path);
      this.x = bbox.x;
      this.y = bbox.y;
      this.width = bbox.width;
      this.height = bbox.height;
    }
  }

  patternScale(containterWidth: number, containerHeight: number): number {
    return Math.max((this.width??0) / containterWidth, (this.height??0) / containerHeight);
  }

}
