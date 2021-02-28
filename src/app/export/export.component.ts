import { Component, Inject, Input } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { StorageService } from '../storage.service';
import { Svg } from '../svg';

class DialogData {
  path: string;
  name: string;
}

@Component({
  selector: 'app-export-dialog',
  templateUrl: 'export-dialog.component.html',
  styleUrls: ['./export-dialog.component.scss']
})
export class ExportDialogComponent {
  x = 0;
  y = 0;
  width = 0;
  height = 0;

  fill = true;
  fillColor = '#000000';
  stroke = false;
  strokeColor =  '#FF0000';
  strokeWidth = 0.1;

  constructor(
    public dialogRef: MatDialogRef<ExportDialogComponent>,
    public storageService: StorageService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.refreshViewbox();
  }

  download(fileName: string, data: string) {
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const anchor = document.createElement('a');
    anchor.href = window.URL.createObjectURL(blob);
    anchor.setAttribute('download', fileName);
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => window.URL.revokeObjectURL(anchor.href), 100);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
  onExport(): void {
    const svg =
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${this.x} ${this.y} ${this.width} ${this.height}">
  <path d="${this.data.path}"${this.stroke ? ` stroke="${this.strokeColor}" stroke-width="${this.strokeWidth}"` : ''} fill="${this.fill ? this.fillColor : 'none'}"/>
</svg>`;
    this.download(this.data.name || 'svg-path.svg', svg);
    this.dialogRef.close();
  }

  patternScale(containterWidth: number, containerHeight: number): number {
    return Math.max(this.width / containterWidth, this.height / containerHeight);
  }

  refreshViewbox() {
    const p = new Svg(this.data.path);
    const locs = p.targetLocations();
    if (locs.length > 0) {
      this.x = locs.reduce((acc, pt) => Math.min(acc, pt.x), Infinity);
      this.y = locs.reduce((acc, pt) => Math.min(acc, pt.y), Infinity);
      this.width = locs.reduce((acc, pt) => Math.max(acc, pt.x), -Infinity) - this.x;
      this.height = locs.reduce((acc, pt) => Math.max(acc, pt.y), -Infinity) - this.y;
      if (this.stroke) {
        this.x -= this.strokeWidth;
        this.y -= this.strokeWidth;
        this.width += 2 * this.strokeWidth;
        this.height += 2 * this.strokeWidth;
      }
    }
  }
}



@Component({
  selector: 'app-export',
  templateUrl: './export.component.html'
})
export class ExportComponent {
  @Input() path: string;
  @Input() name: string;

  constructor(
    public dialog: MatDialog
  ) {}

  openDialog(): void {
    const dialogRef = this.dialog.open(ExportDialogComponent, {
      width: '800px',
      panelClass: 'dialog',
      data: {path: this.path, name: this.name}
    });
  }
}
