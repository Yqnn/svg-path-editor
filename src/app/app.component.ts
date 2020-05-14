import { Component, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Svg, SvgItem, Point, SvgPoint, SvgControlPoint, formatNumber } from './svg';
import { Subject } from 'rxjs';
import { bufferTime, map, filter, throttleTime, buffer } from 'rxjs/operators';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('canvas') canvas: ElementRef;

  wheel$ = new Subject<WheelEvent>();

  rawPath = `M 4 8 L 10 1 L 13 0 L 12 3 L 5 9 C 6 10 6 11 7 10 C 7 11 8 12 7 12 A 1.42 1.42 0 0 1 6 13 A 5 5 0 0 0 4 10 Q 3.5 9.9 3.5 10.5 T 2 11.8 T 1.2 11 T 2.5 9.5 T 3 9 A 5 5 90 0 0 0 7 A 1.42 1.42 0 0 1 1 6 C 1 5 2 6 3 6 C 2 7 3 7 4 8 M 10 1 L 10 3 L 12 3 L 10.2 2.8 L 10 1`;
  parsedPath: Svg;

  invalidSyntax = false;
  preview = false;

  decimals = 0;
  roundValuesDecimals = 1;

  targetPoints: SvgPoint[] = [];
  controlPoints: SvgControlPoint[] = [];

  viewPortX = 0;
  viewPortY = 0;
  viewPortWidth = 30;
  viewPortHeight = 30;
  xGrid = Array(this.viewPortWidth + 1).fill(null).map((x, i) => i);
  yGrid = Array(this.viewPortHeight + 1).fill(null).map((x, i) => i);

  scaleX = 1;
  scaleY = 1;
  translateX = 0;
  translateY = 0;

  canvasWidth: number;
  canvasHeight: number;
  strokeWidth: number;


  draggedEvt: MouseEvent | TouchEvent;
  draggedPoint: SvgPoint;
  focusedItem: SvgItem;
  hoveredItem: SvgItem;
  wasCanvasDragged = false;
  draggedIsNew = false;

  trackByIndex = (idx, _) => idx;
  formatNumber = (v) => formatNumber(v, 4);

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    matRegistry: MatIconRegistry,
    sanitizer: DomSanitizer
  ) {
    matRegistry.addSvgIcon('delete', sanitizer.bypassSecurityTrustResourceUrl('./assets/delete.svg'));
    matRegistry.addSvgIcon('logo', sanitizer.bypassSecurityTrustResourceUrl('./assets/logo.svg'));
    matRegistry.addSvgIcon('more', sanitizer.bypassSecurityTrustResourceUrl('./assets/more.svg'));
    matRegistry.addSvgIcon('github', sanitizer.bypassSecurityTrustResourceUrl('./assets/github.svg'));

    this.reloadPath(this.rawPath, true);

    const throttler = throttleTime(50, undefined, {leading:false, trailing:true});
    this.wheel$
      .pipe( buffer(this.wheel$.pipe(throttler)) )
      .pipe( map(ev => ({
          event: ev[0],
          deltaY: ev.reduce((acc, cur) => acc + cur.deltaY, 0)
      })))
      .subscribe(this.mousewheel.bind(this));
  }

  ngAfterViewInit() {
    this.refreshCanvasSize();
    this.zoomAuto();
    this.changeDetectorRef.detectChanges();
    setTimeout(() => {
      this.refreshCanvasSize();
      this.zoomAuto();
    }, 0);
    window.addEventListener('resize', () => {
      this.refreshCanvasSize();
    });
  }

  refreshCanvasSize() {
    const rect = this.canvas.nativeElement.parentNode.getBoundingClientRect();
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;
    this.strokeWidth = this.viewPortWidth / this.canvasWidth;

    this.updateViewPort(
      this.viewPortX,
      this.viewPortY,
      this.viewPortWidth,
      null
    );
  }

  updateViewPort(x: number, y: number, w: number, h: number) {
    if (w === null) {
      w = this.canvasWidth * h / this.canvasHeight;
    }
    if (h === null) {
      h = this.canvasHeight * w / this.canvasWidth;
    }
    if (!w || !h) {
      return;
    }

    this.viewPortX = parseFloat((1 * x).toPrecision(6));
    this.viewPortY = parseFloat((1 * y).toPrecision(6));
    this.viewPortWidth = parseFloat((1 * w).toPrecision(4));
    this.viewPortHeight = parseFloat((1 * h).toPrecision(4));
    if (5 * this.viewPortWidth <= this.canvasWidth) {
      this.xGrid = Array(Math.ceil(this.viewPortWidth) + 1).fill(null).map((_, i) => Math.floor(this.viewPortX) + i);
      this.yGrid = Array(Math.ceil(this.viewPortHeight) + 1).fill(null).map((_, i) => Math.floor(this.viewPortY) + i);
    } else {
      this.xGrid = [];
      this.yGrid = [];
    }
    this.strokeWidth = this.viewPortWidth / this.canvasWidth;
  }

  insert(type: string, after: SvgItem, convert: boolean) {
    if (convert) {
      this.focusedItem =
        this.parsedPath.changeType(after, after.relative ? type.toLowerCase() : type);
      this.afertModelChange();
    } else {
      this.draggedIsNew = true;
      const pts = this.targetPoints;
      let point1: Point;

      let newItem: SvgItem;
      if (after) {
        point1 = after.targetLocation();
      } else if (pts.length === 0) {
        newItem = SvgItem.Make(['M', '0', '0']);
        this.parsedPath.insert(newItem);
        point1 = new Point(0, 0);
      } else {
        point1 = pts[pts.length - 1];
      }

      if (type.toLowerCase() !== 'm' || !newItem) {
        const relative = type.toLowerCase() === type;
        const X = (relative ?  0 : point1.x).toString();
        const Y = (relative ?  0 : point1.y).toString();
        switch (type.toLocaleLowerCase()) {
          case 'm': case 'l': case 't':
            newItem = SvgItem.Make([type, X, Y]) ; break;
          case 'h':
            newItem = SvgItem.Make([type, X]) ; break;
          case 'v':
            newItem = SvgItem.Make([type, Y]) ; break;
          case 's': case 'q':
            newItem = SvgItem.Make([type, X , Y, X, Y]) ; break;
          case 'c':
            newItem = SvgItem.Make([type, X , Y, X, Y, X, Y]) ; break;
          case 'a':
            newItem = SvgItem.Make([type, '1' , '1', '0', '0', '0', X, Y]) ; break;
          case 'z':
            newItem = SvgItem.Make([type]);
        }
        this.parsedPath.insert(newItem, after);
      }
      this.afertModelChange();

      this.focusedItem = newItem;
      this.startDrag(newItem.targetLocation());
    }
  }

  zoomAuto() {
    let xmin = 0;
    let ymin = 0;
    let xmax = 10;
    let ymax = 10;
    if (this.targetPoints.length > 0) {
      xmin = Math.min(...this.targetPoints.map( it => it.x ));
      ymin = Math.min(...this.targetPoints.map( it => it.y ));
      xmax = Math.max(...this.targetPoints.map( it => it.x ));
      ymax = Math.max(...this.targetPoints.map( it => it.y ));
    }
    const k = this.canvasHeight / this.canvasWidth;
    let w = xmax - xmin + 2;
    let h = ymax - ymin + 2;
    if (k < h / w) {
      w = h / k;
    } else {
      h = k * w;
    }

    this.updateViewPort(
      xmin - 1,
      ymin - 1,
      w,
      h
    );
  }

  scale(x: number, y: number) {
    this.parsedPath.scale(1 * x, 1 * y);
    this.scaleX = 1;
    this.scaleY = 1;
    this.afertModelChange();
  }

  translate(x: number, y: number) {
    this.parsedPath.translate(1 * x, 1 * y);
    this.translateX = 0;
    this.translateY = 0;
    this.afertModelChange();
  }

  setRelative(rel: boolean) {
    this.parsedPath.setRelative(rel);
    this.afertModelChange();
  }

  setValue(item: SvgItem, idx: number, valStr: string) {
    const val = parseFloat(valStr);
    if (!isNaN(val)) {
      item.values[idx] = val;
      this.parsedPath.refreshAbsolutePositions();
      this.afertModelChange();
    }
  }

  delete(item: SvgItem) {
    this.focusedItem = null;
    this.parsedPath.delete(item);
    this.afertModelChange();
  }

  afertModelChange() {
    this.reloadPoints();
    this.rawPath = this.parsedPath.asString();
  }

  roundValues(decimals: number) {
    this.reloadPath(this.parsedPath.asString(decimals));
  }

  canDelete(item: SvgItem): boolean {
    const idx = this.parsedPath.path.indexOf(item);
    return idx > 0;
  }
  canInsertAfter(item: SvgItem, type: string): boolean {
    let previousType: string;
    if (item !== null) {
      previousType = item.getType().toUpperCase();
    } else if (this.parsedPath.path.length > 0) {
      previousType = this.parsedPath.path[this.parsedPath.path.length - 1].getType().toUpperCase();
    }
    if (!previousType) {
      return type !== 'Z';
    }
    if (previousType === 'M') {
      return type !== 'M' && type !== 'Z' && type !== 'T' && type !== 'S';
    }
    if (previousType === 'Z') {
      return type !== 'Z' && type !== 'T' && type !== 'S';
    }
    if (previousType === 'C' || previousType === 'S' ) {
      return type !== 'T';
    }
    if (previousType === 'Q' || previousType === 'T' ) {
      return type !== 'S';
    }
    return type !== 'T' && type !== 'S';
  }
  canConvert(item: SvgItem, to: string): boolean {
    const idx = this.parsedPath.path.indexOf(item) ;
    if (idx === 0) {
      return false;
    }
    if (idx > 0) {
      return this.canInsertAfter(this.parsedPath.path[idx - 1], to);
    }
    return false;
  }

  getTooltip(item: SvgItem, idx: number) {
    const labels = {
      M: ['x', 'y'],
      m: ['dx', 'dy'],
      L: ['x', 'y'],
      l: ['dx', 'dy'],
      V: ['x'],
      v: ['dx'],
      H: ['y'],
      h: ['dy'],
      C: ['x1', 'y1', 'x2', 'y2', 'x', 'y'],
      c: ['dx1', 'dy1', 'dx2', 'dy2', 'dx', 'dy'],
      S: ['x2', 'y2', 'x', 'y'],
      s: ['dx2', 'dy2', 'dx', 'dy'],
      Q: ['x1', 'y1', 'x', 'y'],
      q: ['dx1', 'dy1', 'dx', 'dy'],
      T: ['x', 'y'],
      t: ['dx', 'dy'],
      A: ['rx', 'ry', 'x-axis-rotation', 'large-arc-flag', 'sweep-flag', 'x', 'y'],
      a: ['rx', 'ry', 'x-axis-rotation', 'large-arc-flag', 'sweep-flag', 'dx', 'dy']
    };
    return labels[item.getType()][idx];
  }

  reloadPath(newPath: string, autozoom = false) {
    this.focusedItem = null;
    this.rawPath = newPath;
    this.invalidSyntax = false;
    try {
      this.parsedPath = new Svg(this.rawPath);
      this.reloadPoints();
      if (autozoom) {
        this.zoomAuto();
      }
    } catch (e) {
      this.invalidSyntax = true;
    }
  }

  reloadPoints() {
    this.targetPoints = this.parsedPath.targetLocations();
    this.controlPoints = this.parsedPath.controlLocations();
  }

  eventToLocation(event: MouseEvent | TouchEvent, idx = 0): {x: number, y: number} {
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    let touch = event instanceof MouseEvent ? event : event.touches[idx];
    const x = this.viewPortX + (touch.clientX - rect.left) * this.strokeWidth;
    const y = this.viewPortY + (touch.clientY - rect.top) * this.strokeWidth;
    return {x, y};
  }

  mousewheel(event: {event: WheelEvent, deltaY: number}) {
    const k = Math.pow(1.005, event.deltaY);
    const pt = this.eventToLocation(event.event);
    const w = k * this.viewPortWidth;
    const h = k * this.viewPortHeight;
    const x = this.viewPortX + ((pt.x - this.viewPortX) - k * (pt.x - this.viewPortX));
    const y = this.viewPortY + ((pt.y - this.viewPortY) - k * (pt.y - this.viewPortY));
    this.updateViewPort(x, y, w, h);
  }

  startDrag(item: SvgPoint ) {
    if (item.itemReference.getType().toLowerCase() === 'z') {
      return;
    }
    this.focusedItem = item.itemReference;
    this.draggedPoint = item;
  }

  startDragCanvas(event: MouseEvent | TouchEvent) {
    this.draggedEvt = event;
    this.wasCanvasDragged = false;
  }

  stopDrag() {
    if (!this.draggedPoint && !this.wasCanvasDragged) {
      // unselect action
      this.focusedItem = null;
    }
    this.draggedPoint = null;
    this.draggedEvt = null;
    this.draggedIsNew = false;
  }

  drag(event: MouseEvent | TouchEvent) {
    if (this.draggedPoint || this.draggedEvt) {
      event.stopPropagation();
      const pt = this.eventToLocation(event);
      if (this.draggedPoint) {
        pt.x = parseFloat(pt.x.toFixed(this.decimals));
        pt.y = parseFloat(pt.y.toFixed(this.decimals));
        this.parsedPath.setLocation(this.draggedPoint, pt as Point);
        if (this.draggedIsNew) {
          const previousIdx = this.parsedPath.path.indexOf(this.draggedPoint.itemReference) - 1;
          if (previousIdx >= 0) {
            this.draggedPoint.itemReference.resetControlPoints(this.parsedPath.path[previousIdx]);
          }
        }
        this.afertModelChange();
      } else {
        this.wasCanvasDragged = true;
        if (
          window.TouchEvent
          && this.draggedEvt instanceof TouchEvent
          && event instanceof TouchEvent
          && this.draggedEvt.touches.length >= 2
          && event.touches.length >= 2)
        {
          // Pinch to Zoom
          const pt2 = this.eventToLocation(event, 1);
          const oriPt = this.eventToLocation(this.draggedEvt, 0);
          const oriPt2 = this.eventToLocation(this.draggedEvt, 1);
          const ptm = {x:0.5*(pt.x+pt2.x) , y:0.5*(pt.y+pt2.y)};
          const oriPtm ={x:0.5*(oriPt.x+oriPt2.x) , y:0.5*(oriPt.y+oriPt2.y)};
          const delta = {x: oriPtm.x - ptm.x , y: oriPtm.y - ptm.y};
          const k =
            Math.sqrt((oriPt.x-oriPt2.x)*(oriPt.x-oriPt2.x) + (oriPt.y-oriPt2.y)*(oriPt.y-oriPt2.y))/
            Math.sqrt((pt.x-pt2.x)*(pt.x-pt2.x) + (pt.y-pt2.y)*(pt.y-pt2.y));
          const w = k * this.viewPortWidth;
          const h = k * this.viewPortHeight;
          const x = this.viewPortX + delta.x + ((ptm.x - this.viewPortX) - k * (ptm.x - this.viewPortX));
          const y = this.viewPortY + delta.y + ((ptm.y - this.viewPortY) - k * (ptm.y - this.viewPortY));
          this.updateViewPort(x, y, w, h);
        } else {
          const oriPt = this.eventToLocation(this.draggedEvt);
          this.updateViewPort(
            this.viewPortX + (oriPt.x - pt.x), this.viewPortY + (oriPt.y - pt.y),
            this.viewPortWidth, this.viewPortHeight
          );
        }
        this.draggedEvt = event;
      }
    }
  }
}
