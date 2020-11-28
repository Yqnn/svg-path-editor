import { Component, AfterViewInit, HostBinding, HostListener, ViewChild } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Svg, SvgItem, Point, SvgPoint, SvgControlPoint, formatNumber } from './svg';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { StorageService } from './storage.service';
import { CanvasComponent } from './canvas/canvas.component';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('leftColumnParent', [
      transition(':enter', [])
    ]),
    trigger('leftColumn', [
      state('*', style({'max-width': '300px'})),
      transition(':enter', [style({'max-width': '0'}), animate('100ms ease')]),
      transition(':leave', [animate('100ms ease', style({'max-width': '0'}))])
    ])
  ]
})
export class AppComponent implements AfterViewInit {
  // Svg path data model:
  parsedPath: Svg;
  targetPoints: SvgPoint[] = [];
  controlPoints: SvgControlPoint[] = [];

  // Raw path:
  _rawPath = this.storage.getPath()?.path
    || `M 4 8 L 10 1 L 13 0 L 12 3 L 5 9 C 6 10 6 11 7 10 C 7 11 8 12 7 12 A 1.42 1.42 0 0 1 6 13 `
      + `A 5 5 0 0 0 4 10 Q 3.5 9.9 3.5 10.5 T 2 11.8 T 1.2 11 T 2.5 9.5 T 3 9 A 5 5 90 0 0 0 7 A 1.42 1.42 0 0 1 1 6 `
      + `C 1 5 2 6 3 6 C 2 7 3 7 4 8 M 10 1 L 10 3 L 12 3 L 10.2 2.8 L 10 1`;
  pathName: string;
  invalidSyntax = false;

  // Undo/redo
  history: string[] = [];
  historyCursor = -1;
  historyDisabled = false;

  // Configuration panel inputs:
  viewPortX = 0;
  viewPortY = 0;
  viewPortWidth = 30;
  viewPortHeight = 30;
  viewPortLocked = false;
  preview = false;
  showTicks = false;
  minifyOutput = false;
  snapToGrid = true;
  tickInterval = 5;
  roundValuesDecimals = 1;

  //  Path operations panel inputs:
  scaleX = 1;
  scaleY = 1;
  translateX = 0;
  translateY = 0;
  decimalPrecision = 3;

  // Canvas Data:
  @ViewChild(CanvasComponent) canvas;
  canvasWidth = 100;
  canvasHeight = 100;
  strokeWidth: number;

  // Dragged & hovered elements
  draggedPoint: SvgPoint;
  focusedItem: SvgItem;
  hoveredItem: SvgItem;
  wasCanvasDragged = false;
  draggedIsNew = false;
  dragging = false;

  // UI State
  isLeftPanelOpened = true;
  isContextualMenuOpened = false;

  // Utility functions:
  trackByIndex = (idx, _) => idx;
  formatNumber = (v) => formatNumber(v, 4);

  constructor(
    matRegistry: MatIconRegistry,
    sanitizer: DomSanitizer,
    private storage: StorageService
  ) {
    for (const icon of ['delete', 'logo', 'more', 'github', 'zoom_in', 'zoom_out', 'zoom_fit']) {
      matRegistry.addSvgIcon(icon, sanitizer.bypassSecurityTrustResourceUrl(`./assets/${icon}.svg`));
    }
    this.reloadPath(this.rawPath, true);
  }

  @HostListener('document:keydown', ['$event']) onKeyDown($event) {
    const tag = $event.target.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
      if ($event.shiftKey && ($event.metaKey || $event.ctrlKey) && $event.key.toLowerCase() === 'z') {
        this.redo();
        $event.preventDefault();
      } else if (($event.metaKey || $event.ctrlKey) && $event.key.toLowerCase() === 'z') {
        this.undo();
        $event.preventDefault();
      } else if (!$event.metaKey && !$event.ctrlKey && /^[mlvhcsqtaz]$/i.test($event.key)) {
        if (this.canInsertAfter(this.focusedItem, $event.key)) {
          this.insert($event.key, this.focusedItem, false);
          $event.preventDefault();
        }
      } else if (!$event.metaKey && !$event.ctrlKey && $event.key === 'Escape') {
        if (this.dragging) {
          // If an element is being dragged, undo by reloading the current history entry
          this.reloadPath(this.history[this.historyCursor]);
        } else {
          // stopDrag will unselect selected item if any
          this.canvas.stopDrag();
        }
      }
    }
  }

  get decimals() {
    return  this.snapToGrid ? 0 : this.decimalPrecision;
 }

  ngAfterViewInit() {
    setTimeout(() => {
      this.zoomAuto();
    }, 0);
  }

  get rawPath(): string {
    return this._rawPath;
  }
  set rawPath(value: string) {
      this._rawPath = value;
      this.pushHistory();
  }

  setIsDragging(dragging: boolean) {
    this.dragging = dragging;
    this.setHistoryDisabled(dragging);
    if (!dragging) {
      this.draggedIsNew = false;
    }
  }

  setHistoryDisabled(value: boolean) {
    this.historyDisabled = value;
    if (!value) {
      this.pushHistory();
    }
  }

  pushHistory() {
    if (!this.historyDisabled && this.rawPath !== this.history[this.historyCursor]) {
      this.historyCursor ++;
      this.history.splice(this.historyCursor, this.history.length - this.historyCursor, this.rawPath);
      this.storage.addPath(null, this.rawPath);
    }
  }

  canUndo(): boolean {
    return this.historyCursor > 0;
  }

  undo() {
    if (this.canUndo()) {
      this.historyDisabled = true;
      this.historyCursor --;
      this.reloadPath(this.history[this.historyCursor]);
      this.historyDisabled = false;
    }
  }

  canRedo(): boolean {
    return this.historyCursor < this.history.length - 1;
  }

  redo() {
    if (this.canRedo()) {
      this.historyDisabled = true;
      this.historyCursor ++;
      this.reloadPath(this.history[this.historyCursor]);
      this.historyDisabled = false;
    }
  }

  updateViewPort(x: number, y: number, w: number, h: number, force = false) {
    if (!force && this.viewPortLocked) {
      return;
    }
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
      this.setHistoryDisabled(true);
      this.afertModelChange();

      this.focusedItem = newItem;
      this.draggedPoint = newItem.targetLocation();
    }
  }

  zoomAuto() {
    if (this.viewPortLocked) {
      return;
    }
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

  setValue(item: SvgItem, idx: number, val: number) {
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
    this.rawPath = this.parsedPath.asString(4, this.minifyOutput);
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

  openPath(newPath: string, name: string) {
    this.pathName = name;
    this.reloadPath(newPath, true);
    this.history = [];
    this.historyCursor = -1;
  }

  reloadPath(newPath: string, autozoom = false) {
    this.hoveredItem = null;
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

  toggleLeftPanel() {
    this.isLeftPanelOpened = !this.isLeftPanelOpened;
  }
}
