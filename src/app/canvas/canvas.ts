import {
  Component,
  ChangeDetectorRef,
  DestroyRef,
  ElementRef,
  HostListener,
  OnChanges,
  OnInit,
  SimpleChanges,
  afterNextRender,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { Subject } from 'rxjs';
import { buffer, map, throttleTime } from 'rxjs/operators';
import { Image } from '../image';
import { Point, SvgPath, SvgControlPoint, SvgItem, SvgPoint } from '../../lib/svg';
import { NgClass, NgStyle } from '@angular/common';

@Component({
  selector: '[app-canvas]',
  templateUrl: './canvas.html',
  styleUrl: './canvas.css',
  imports: [NgClass, NgStyle],
})
export class Canvas implements OnInit, OnChanges {
  canvas = inject(ElementRef);
  private cd = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly canvasWidth = model(0);
  readonly canvasHeight = model(0);
  readonly draggedPoint = model<SvgPoint | null>(null);
  readonly focusedItem = model<SvgItem | null>(null);
  readonly hoveredItem = model<SvgItem | null>(null);
  readonly wasCanvasDragged = model(false);
  readonly focusedImage = model<Image | null>(null);
  readonly parsedPath = input<SvgPath>();
  readonly targetPoints = input<SvgPoint[]>([]);
  readonly controlPoints = input<SvgControlPoint[]>([]);

  readonly decimals = input<number>();
  readonly viewPortX = input(0);
  readonly viewPortY = input(0);
  readonly viewPortWidth = input(0);
  readonly viewPortHeight = input(0);
  readonly strokeWidth = input(1);
  readonly preview = input(false);
  readonly filled = input(false);
  readonly showTicks = input(false);
  readonly draggedIsNew = input(false);
  readonly images = input<Image[]>([]);
  readonly editImages = input(true);

  readonly afterModelChange = output<void>();
  readonly dragging = output<boolean>();
  readonly viewPort = output<{
    x: number;
    y: number;
    w: number;
    h: number | null;
    force?: boolean;
  }>();
  readonly hoverPosition = output<{ x: number; y: number } | undefined>();
  readonly cursorPosition = output<(Point & { decimals?: number }) | undefined>();

  draggedEvt: MouseEvent | TouchEvent | null = null;
  wheel$ = new Subject<WheelEvent>();
  dragWithoutClick = true;
  draggedImage: Image | null = null;
  draggedImageType = 0;
  xGrid: number[] = [];
  yGrid: number[] = [];
  xGridSecondary: number[] = [];
  yGridSecondary: number[] = [];
  gridLabelStep = 1;

  // Utility functions
  min = Math.min;
  abs = Math.abs;
  trackByIndex = (idx: number, _: unknown) => idx;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['viewPortX'] ||
      changes['viewPortY'] ||
      changes['viewPortWidth'] ||
      changes['viewPortHeight'] ||
      changes['showTicks']
    ) {
      this.refreshGrid();
    }
    if (changes['draggedPoint'] && changes['draggedPoint'].currentValue) {
      this.startDrag(changes['draggedPoint'].currentValue);
    }
  }

  constructor() {
    afterNextRender(() => {
      this.refreshCanvasSize();
      this.cd.markForCheck();
    });

    const onResize = () => {
      this.refreshCanvasSize();
      this.cd.markForCheck();
    };
    // Following line is a workaround for a bug in Safari preventing the Wheel events to be fired:
    const onWheel = () => undefined;

    window.addEventListener('resize', onResize);
    window.addEventListener('wheel', onWheel);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('wheel', onWheel);
    });
  }

  ngOnInit(): void {
    const cap = (val: number, max: number) => (val > max ? max : val < -max ? -max : val);
    const throttler = throttleTime(20, undefined, { leading: false, trailing: true });
    this.wheel$
      .pipe(buffer(this.wheel$.pipe(throttler)))
      .pipe(
        map((ev) => ({
          event: ev[0],
          deltaY: ev.reduce((acc, cur) => acc + cap(cur.deltaY, 50), 0),
        })),
      )
      .subscribe(this.mousewheel.bind(this));
  }

  @HostListener('mousedown', ['$event']) onMouseDown($event: MouseEvent) {
    this.startDragCanvas($event);
    $event.stopPropagation();
  }
  @HostListener('mousemove', ['$event']) onMouseMove($event: MouseEvent) {
    this.drag($event);
  }
  @HostListener('mouseup', ['$event']) onMouseUp($event: MouseEvent) {
    this.stopDrag();
  }
  @HostListener('touchstart', ['$event']) onTouchStart($event: TouchEvent) {
    this.startDragCanvas($event);
    $event.preventDefault();
    $event.stopPropagation();
  }
  @HostListener('touchmove', ['$event']) onTouchMove($event: TouchEvent) {
    this.drag($event);
  }
  @HostListener('touchend', ['$event']) onTouchEnd($event: TouchEvent) {
    this.stopDrag();
  }
  @HostListener('wheel', ['$event']) onWheel($event: WheelEvent) {
    this.wheel$.next($event);
  }
  @HostListener('click', ['$event']) onClick($event: MouseEvent) {
    this.hoveredItem.set(null);
  }

  refreshCanvasSize() {
    const parent = this.canvas.nativeElement.parentNode;
    if (!parent) {
      return;
    }
    const rect = parent.getBoundingClientRect();
    this.canvasWidth.set(rect.width);
    this.canvasHeight.set(rect.height);

    this.viewPort.emit({
      x: this.viewPortX(),
      y: this.viewPortY(),
      w: this.viewPortWidth(),
      h: null,
      force: true,
    });
  }

  round(value: number): number {
    return Math.round(value * 1e10) / 1e10;
  }

  isEvenTick(value: number): boolean {
    return Number.isInteger(this.round(value / this.gridLabelStep));
  }

  refreshGrid() {
    const minPx = 10;
    const raw = this.canvasWidth() > 0 ? (minPx * this.viewPortWidth()) / this.canvasWidth() : 1;
    const e = Math.ceil(Math.log10(Math.max(raw, 1e-10)));

    let step = Math.pow(10, Math.max(e, -4));
    if (!this.showTicks()) {
      step = Math.max(step, 1);
    }
    const xStart = Math.floor(this.viewPortX() / step) * step;
    const xCount = Math.ceil(this.viewPortWidth() / step) + 2;
    this.xGrid = Array.from({ length: xCount }, (_, i) => this.round(xStart + i * step));
    const yStart = Math.floor(this.viewPortY() / step) * step;
    const yCount = Math.ceil(this.viewPortHeight() / step) + 2;
    this.yGrid = Array.from({ length: yCount }, (_, i) => this.round(yStart + i * step));

    if (this.showTicks()) {
      const secStep = (step < 1 ? 10 : 5) * step;
      const xSecStart = Math.floor(this.viewPortX() / secStep) * secStep;
      const xSecCount = Math.ceil(this.viewPortWidth() / secStep) + 2;
      this.xGridSecondary = Array.from({ length: xSecCount }, (_, i) =>
        this.round(xSecStart + i * secStep),
      );
      const ySecStart = Math.floor(this.viewPortY() / secStep) * secStep;
      const ySecCount = Math.ceil(this.viewPortHeight() / secStep) + 2;
      this.yGridSecondary = Array.from({ length: ySecCount }, (_, i) =>
        this.round(ySecStart + i * secStep),
      );
    } else {
      this.xGridSecondary = [];
      this.yGridSecondary = [];
    }
  }

  eventToLocation(event: MouseEvent | TouchEvent, idx = 0): { x: number; y: number } {
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const touch = event instanceof MouseEvent ? event : event.touches[idx];
    const x = this.viewPortX() + (touch.clientX - rect.left) * this.strokeWidth();
    const y = this.viewPortY() + (touch.clientY - rect.top) * this.strokeWidth();
    return { x, y };
  }

  pinchToZoom(previousEvent: MouseEvent | TouchEvent, event: MouseEvent | TouchEvent) {
    if (
      window.TouchEvent &&
      previousEvent instanceof TouchEvent &&
      event instanceof TouchEvent &&
      previousEvent.touches.length >= 2 &&
      event.touches.length >= 2
    ) {
      const pt = this.eventToLocation(event, 0);
      const pt2 = this.eventToLocation(event, 1);
      const oriPt = this.eventToLocation(previousEvent, 0);
      const oriPt2 = this.eventToLocation(previousEvent, 1);
      const ptm = { x: 0.5 * (pt.x + pt2.x), y: 0.5 * (pt.y + pt2.y) };
      const oriPtm = { x: 0.5 * (oriPt.x + oriPt2.x), y: 0.5 * (oriPt.y + oriPt2.y) };
      const delta = { x: oriPtm.x - ptm.x, y: oriPtm.y - ptm.y };
      const k =
        Math.sqrt(
          (oriPt.x - oriPt2.x) * (oriPt.x - oriPt2.x) + (oriPt.y - oriPt2.y) * (oriPt.y - oriPt2.y),
        ) / Math.sqrt((pt.x - pt2.x) * (pt.x - pt2.x) + (pt.y - pt2.y) * (pt.y - pt2.y));
      return { zoom: k, delta, center: ptm };
    }
    return null;
  }

  mousewheel(event: { event: WheelEvent; deltaY: number }) {
    const scale = Math.pow(1.005, event.deltaY);
    const pt = this.eventToLocation(event.event);

    this.zoomViewPort(scale, pt);
    this.cd.markForCheck();
  }

  zoomViewPort(scale: number, pt?: { x: number; y: number }) {
    if (!pt) {
      pt = {
        x: this.viewPortX() + 0.5 * this.viewPortWidth(),
        y: this.viewPortY() + 0.5 * this.viewPortHeight(),
      };
    }
    const w = scale * this.viewPortWidth();
    const h = scale * this.viewPortHeight();
    const x = this.viewPortX() + (pt.x - this.viewPortX() - scale * (pt.x - this.viewPortX()));
    const y = this.viewPortY() + (pt.y - this.viewPortY() - scale * (pt.y - this.viewPortY()));

    this.viewPort.emit({ x, y, w, h });
  }

  startDrag(item: SvgPoint) {
    if (item !== this.draggedPoint()) {
      this.dragWithoutClick = false;
    }

    this.dragging.emit(true);
    this.setCursorPosition({ ...item, decimals: this.decimals() });

    if (item.itemReference.getType().toLowerCase() === 'z') {
      return;
    }
    this.focusedItem.set(item.itemReference);
    this.draggedPoint.set(item);
  }

  startDragCanvas(event: MouseEvent | TouchEvent) {
    this.draggedEvt = event;
    this.wasCanvasDragged.set(false);
    this.dragWithoutClick = false;
  }

  startDragImage(event: MouseEvent | TouchEvent, im: Image, type: number): void {
    this.dragging.emit(true);
    this.draggedEvt = event;
    this.draggedImage = im;
    this.draggedImageType = type;
    this.focusedImage.set(im);
  }

  stopDrag() {
    if (this.draggedPoint() && this.draggedEvt) {
      this.drag(this.draggedEvt);
    }
    this.dragging.emit(false);

    if (!this.draggedPoint() && !this.wasCanvasDragged()) {
      // unselect action
      this.focusedItem.set(null);
      this.setCursorPosition(undefined);
    }
    if (!this.draggedImage && !this.wasCanvasDragged()) {
      this.focusedImage.set(null);
    }

    this.draggedPoint.set(null);
    this.draggedEvt = null;
    this.dragWithoutClick = true;

    this.draggedImage = null;
  }

  drag(event: MouseEvent | TouchEvent) {
    const pt = this.eventToLocation(event);
    this.hoverPosition.emit(pt);

    if (this.draggedPoint() || this.draggedEvt || this.draggedImage) {
      if (!this.dragWithoutClick && event instanceof MouseEvent && event.buttons === 0) {
        // Stop dragging if click is not maintained anymore.
        this.stopDrag();
        return;
      }

      event.stopPropagation();
      if (this.draggedImage && this.draggedEvt) {
        const oriPt = this.eventToLocation(this.draggedEvt);
        if (this.draggedImageType & 0b0001) {
          this.draggedImage.x1 += pt.x - oriPt.x;
        }
        if (this.draggedImageType & 0b0010) {
          this.draggedImage.y1 += pt.y - oriPt.y;
        }
        if (this.draggedImageType & 0b0100) {
          this.draggedImage.x2 += pt.x - oriPt.x;
        }
        if (this.draggedImageType & 0b1000) {
          this.draggedImage.y2 += pt.y - oriPt.y;
        }
        this.draggedEvt = event;
      } else if (this.draggedPoint() && this.parsedPath()) {
        const draggedPoint = this.draggedPoint()!;
        const parsedPath = this.parsedPath()!;
        const decimals = event.ctrlKey ? (this.decimals() ? 0 : 3) : this.decimals();
        pt.x = parseFloat(pt.x.toFixed(decimals));
        pt.y = parseFloat(pt.y.toFixed(decimals));
        parsedPath.setLocation(draggedPoint, pt as Point);
        if (this.draggedIsNew()) {
          const previousIdx = parsedPath.path.indexOf(draggedPoint.itemReference) - 1;
          if (previousIdx >= 0) {
            draggedPoint.itemReference.resetControlPoints(parsedPath.path[previousIdx]);
          }
        }
        this.afterModelChange.emit();
        this.draggedEvt = null;
        this.setCursorPosition({ ...pt, decimals });
      } else if (this.draggedEvt) {
        this.wasCanvasDragged.set(true);
        this.hoverPosition.emit(undefined);

        const pinchToZoom = this.pinchToZoom(this.draggedEvt, event);
        if (pinchToZoom !== null) {
          const w = pinchToZoom.zoom * this.viewPortWidth();
          const h = pinchToZoom.zoom * this.viewPortHeight();
          const x =
            this.viewPortX() +
            pinchToZoom.delta.x +
            (pinchToZoom.center.x - this.viewPortX()) * (1 - pinchToZoom.zoom);
          const y =
            this.viewPortY() +
            pinchToZoom.delta.y +
            (pinchToZoom.center.y - this.viewPortY()) * (1 - pinchToZoom.zoom);
          this.viewPort.emit({ x, y, w, h });
        } else {
          const oriPt = this.eventToLocation(this.draggedEvt);
          this.viewPort.emit({
            x: this.viewPortX() + (oriPt.x - pt.x),
            y: this.viewPortY() + (oriPt.y - pt.y),
            w: this.viewPortWidth(),
            h: this.viewPortHeight(),
          });
        }
        this.draggedEvt = event;
      }
    }
  }

  setCursorPosition(location?: { x: number; y: number; decimals?: number }) {
    this.cursorPosition.emit(location);
  }
}
