import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { buffer, map, throttleTime } from 'rxjs/operators';
import { Point, Svg, SvgControlPoint, SvgItem, SvgPoint } from '../svg';

/* tslint:disable:component-selector */
@Component({
  selector: '[app-canvas]',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements OnInit, OnChanges, AfterViewInit {
  get canvasWidth(): number { return this._canvasWidth; }
  set canvasWidth(canvasWidth: number) { this._canvasWidth = canvasWidth; this.canvasWidthChange.emit(this._canvasWidth); }
  get canvasHeight(): number { return this._canvasHeight; }
  set canvasHeight(canvasHeight: number) { this._canvasHeight = canvasHeight; this.canvasHeightChange.emit(this._canvasHeight); }
  get draggedPoint(): SvgPoint { return this._draggedPoint; }
  @Input() set draggedPoint(draggedPoint: SvgPoint) { this._draggedPoint = draggedPoint; this.draggedPointChange.emit(this.draggedPoint); }
  get focusedItem(): SvgItem { return this._focusedItem; }
  @Input() set focusedItem(focusedItem: SvgItem) { this._focusedItem = focusedItem; this.focusedItemChange.emit(this.focusedItem); }
  get hoveredItem(): SvgItem { return this._hoveredItem; }
  @Input() set hoveredItem(hoveredItem: SvgItem) { this._hoveredItem = hoveredItem; this.hoveredItemChange.emit(this.hoveredItem); }
  get wasCanvasDragged(): boolean { return this._wasCanvasDragged; }
  @Input() set wasCanvasDragged(wasCanvasDragged: boolean) {
    this._wasCanvasDragged = wasCanvasDragged;
    this.wasCanvasDraggedChange.emit(this._wasCanvasDragged);
  }

  constructor(public canvas: ElementRef) { }
  @Input() parsedPath: Svg;
  @Input() targetPoints: SvgPoint[] = [];
  @Input() controlPoints: SvgControlPoint[] = [];

  @Input() decimals: number;
  @Input() viewPortX: number;
  @Input() viewPortY: number;
  @Input() viewPortWidth: number;
  @Input() viewPortHeight: number;
  @Input() strokeWidth: number;
  @Input() preview: boolean;
  @Input() showTicks: boolean;
  @Input() tickInterval: number;
  @Input() draggedIsNew = false;

  @Output() afertModelChange = new EventEmitter<void>();
  @Output() dragging = new EventEmitter<boolean>();
  @Output() viewPort = new EventEmitter<{x: number, y: number, w: number, h: number}>();


  _canvasWidth: number;
  @Output() canvasWidthChange = new EventEmitter<number>();

  _canvasHeight: number;
  @Output() canvasHeightChange = new EventEmitter<number>();

  _draggedPoint: SvgPoint;
  @Output() draggedPointChange = new EventEmitter<SvgPoint>();

  _focusedItem: SvgItem;
  @Output() focusedItemChange = new EventEmitter<SvgItem>();

  _hoveredItem: SvgItem;
  @Output() hoveredItemChange = new EventEmitter<SvgItem>();

  _wasCanvasDragged = false;
  @Output() wasCanvasDraggedChange = new EventEmitter<boolean>();

  draggedEvt: MouseEvent | TouchEvent;
  wheel$ = new Subject<WheelEvent>();
  dragWithoutClick = true;
  xGrid: number[];
  yGrid: number[];

  trackByIndex = (idx, _) => idx;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.viewPortX || changes.viewPortY || changes.viewPortWidth || changes.viewPortHeight) {
      this.refreshGrid();
    }
    if (changes.draggedPoint && changes.draggedPoint.currentValue) {
      this.startDrag(changes.draggedPoint.currentValue);
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.refreshCanvasSize();
    });
    window.addEventListener('resize', () => {
      this.refreshCanvasSize();
    });
  }

  ngOnInit(): void {
    const throttler = throttleTime(50, undefined, {leading: false, trailing: true});
    this.wheel$
      .pipe( buffer(this.wheel$.pipe(throttler)) )
      .pipe( map(ev => ({
          event: ev[0],
          deltaY: ev.reduce((acc, cur) => acc + cur.deltaY, 0)
      })))
      .subscribe(this.mousewheel.bind(this));
  }

  @HostListener('mousedown', ['$event']) onMouseDown($event) {
    this.startDragCanvas($event);
    $event.stopPropagation();
  }
  @HostListener('mousemove', ['$event']) onMouseMove($event) {
    this.drag($event);
  }
  @HostListener('mouseup', ['$event'])  onMouseUp($event) {
    this.stopDrag();
  }
  @HostListener('touchstart', ['$event']) onTouchStart($event) {
    this.startDragCanvas($event);
    $event.preventDefault();
    $event.stopPropagation();
  }
  @HostListener('touchmove', ['$event']) onTouchMove($event) {
    this.drag($event);
  }
  @HostListener('touchend', ['$event']) onTouchEnd($event) {
    this.stopDrag();
  }
  @HostListener('wheel', ['$event']) onWheel($event) {
    this.wheel$.next($event);
  }
  @HostListener('click', ['$event']) onClick($event) {
    this.hoveredItem = null;
  }


  refreshCanvasSize() {
    const rect = this.canvas.nativeElement.parentNode.getBoundingClientRect();
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;

    this.viewPort.emit({
      x: this.viewPortX,
      y: this.viewPortY,
      w: this.viewPortWidth,
      h: null
    });
  }

  refreshGrid() {
    if (5 * this.viewPortWidth <= this.canvasWidth) {
      this.xGrid = Array(Math.ceil(this.viewPortWidth) + 1).fill(null).map((_, i) => Math.floor(this.viewPortX) + i);
      this.yGrid = Array(Math.ceil(this.viewPortHeight) + 1).fill(null).map((_, i) => Math.floor(this.viewPortY) + i);
    } else {
      this.xGrid = [];
      this.yGrid = [];
    }
  }



  eventToLocation(event: MouseEvent | TouchEvent, idx = 0): {x: number, y: number} {
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const touch = event instanceof MouseEvent ? event : event.touches[idx];
    const x = this.viewPortX + (touch.clientX - rect.left) * this.strokeWidth;
    const y = this.viewPortY + (touch.clientY - rect.top) * this.strokeWidth;
    return {x, y};
  }

  pinchToZoom(previousEvent: MouseEvent | TouchEvent, event: MouseEvent | TouchEvent) {
    if ( window.TouchEvent
      && previousEvent instanceof TouchEvent
      && event instanceof TouchEvent
      && previousEvent.touches.length >= 2
      && event.touches.length >= 2)
    {
      const pt = this.eventToLocation(event, 0);
      const pt2 = this.eventToLocation(event, 1);
      const oriPt = this.eventToLocation(previousEvent, 0);
      const oriPt2 = this.eventToLocation(previousEvent, 1);
      const ptm = {x: 0.5 * (pt.x + pt2.x) , y: 0.5 * (pt.y + pt2.y)};
      const oriPtm = {x: 0.5 * (oriPt.x + oriPt2.x) , y: 0.5 * (oriPt.y + oriPt2.y)};
      const delta = {x: oriPtm.x - ptm.x , y: oriPtm.y - ptm.y};
      const k =
        Math.sqrt((oriPt.x - oriPt2.x) * (oriPt.x - oriPt2.x) + (oriPt.y - oriPt2.y) * (oriPt.y - oriPt2.y)) /
        Math.sqrt((pt.x - pt2.x) * (pt.x - pt2.x) + (pt.y - pt2.y) * (pt.y - pt2.y));
      return {zoom: k, delta, center: ptm};
    }
    return null;
  }

  mousewheel(event: {event: WheelEvent, deltaY: number}) {
    const k = Math.pow(1.005, event.deltaY);
    const pt = this.eventToLocation(event.event);
    const w = k * this.viewPortWidth;
    const h = k * this.viewPortHeight;
    const x = this.viewPortX + ((pt.x - this.viewPortX) - k * (pt.x - this.viewPortX));
    const y = this.viewPortY + ((pt.y - this.viewPortY) - k * (pt.y - this.viewPortY));
    this.viewPort.emit({x, y, w, h});
  }

  startDrag(item: SvgPoint) {
    if (item !== this.draggedPoint) {
      this.dragWithoutClick = false;
    }

    this.dragging.emit(true);
    if (item.itemReference.getType().toLowerCase() === 'z') {
      return;
    }
    this.focusedItem = item.itemReference;
    this.draggedPoint = item;
  }

  startDragCanvas(event: MouseEvent | TouchEvent) {
    this.draggedEvt = event;
    this.wasCanvasDragged = false;
    this.dragWithoutClick = false;
  }

  stopDrag() {
    if (this.draggedPoint && this.draggedEvt) {
      this.drag(this.draggedEvt);
    }
    this.dragging.emit(false);

    if (!this.draggedPoint && !this.wasCanvasDragged) {
      // unselect action
      this.focusedItem = null;
    }
    this.draggedPoint = null;
    this.draggedEvt = null;
    this.dragWithoutClick = true;
  }

  drag(event: MouseEvent | TouchEvent) {
    if (this.draggedPoint || this.draggedEvt) {

      if (!this.dragWithoutClick && event instanceof MouseEvent && event.buttons === 0) {
        // Stop dragging is click is not maintained anymore.
        this.stopDrag();
        return;
      }

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
        this.afertModelChange.emit();
        this.draggedEvt = null;
      } else {
        this.wasCanvasDragged = true;
        const pinchToZoom = this.pinchToZoom(this.draggedEvt, event);
        if (pinchToZoom !== null){
          const w = pinchToZoom.zoom * this.viewPortWidth;
          const h = pinchToZoom.zoom * this.viewPortHeight;
          const x = this.viewPortX + pinchToZoom.delta.x + (pinchToZoom.center.x - this.viewPortX) * (1 - pinchToZoom.zoom);
          const y = this.viewPortY + pinchToZoom.delta.y + (pinchToZoom.center.y - this.viewPortY) * (1 - pinchToZoom.zoom);
          this.viewPort.emit({x, y, w, h});
        } else {
          const oriPt = this.eventToLocation(this.draggedEvt);
          this.viewPort.emit({
            x: this.viewPortX + (oriPt.x - pt.x), y: this.viewPortY + (oriPt.y - pt.y),
            w: this.viewPortWidth, h: this.viewPortHeight
          });
        }
        this.draggedEvt = event;
      }
    }
  }
}
