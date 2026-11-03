import { Component, OnInit, input, model } from '@angular/core';
import { browserComputePathBoundingBox } from '../svg-bbox';

@Component({
  selector: 'app-path-preview',
  templateUrl: './path-preview.html',
})
export class PathPreview implements OnInit {
  readonly x = model<number | undefined>(undefined);
  readonly y = model<number | undefined>(undefined);
  readonly width = model<number | undefined>(undefined);
  readonly height = model<number | undefined>(undefined);

  readonly fillColor = input<string | undefined>('#000000');
  readonly strokeColor = input<string>();
  readonly strokeWidth = input<number>();
  readonly path = input('');

  ngOnInit(): void {
    if (
      this.x() === undefined ||
      this.y() === undefined ||
      this.width() === undefined ||
      this.height() === undefined
    ) {
      const bbox = browserComputePathBoundingBox(this.path());
      this.x.set(bbox.x);
      this.y.set(bbox.y);
      this.width.set(bbox.width);
      this.height.set(bbox.height);
    }
  }

  patternScale(containerWidth: number, containerHeight: number): number {
    return Math.max((this.width() ?? 0) / containerWidth, (this.height() ?? 0) / containerHeight);
  }
}
