import { Component, Inject, Input } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { ExportConfigService } from '../config.service';
import { StorageService } from '../storage.service';
import { Svg } from '../svg';
import { browserComputePathBoundingBox } from '../svg-bbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CopiedSnackbarComponent } from '../copied-snackbar/copied-snackbar.component';

interface DialogData {
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

  constructor(
    public dialogRef: MatDialogRef<ExportDialogComponent>,
    public storageService: StorageService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public cfg: ExportConfigService,
    private snackBar: MatSnackBar
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
	
	copyToClipboard(data: string) {
    navigator.clipboard.writeText(data);
    this.snackBar.openFromComponent(CopiedSnackbarComponent, {
      horizontalPosition:'center',
      verticalPosition: 'top',
      duration: 2000
    });
	}

	makeSVG(): string {
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${this.x} ${this.y} ${this.width} ${this.height}">
	<path d="${this.data.path}"${this.cfg.stroke ? ` stroke="${this.cfg.strokeColor}" stroke-width="${this.cfg.strokeWidth}"` : ''} fill="${this.cfg.fill ? this.cfg.fillColor : 'none'}"/>
</svg>`;
	}

  onCancel(): void {
    this.dialogRef.close();
  }
  onExport(): void {
    const svg = this.makeSVG();

    this.download(this.data.name || 'svg-path.svg', svg);
    this.dialogRef.close();
  }
	onCopyToClipboard(): void {
		const svg = this.makeSVG();
		this.copyToClipboard(svg);
	}

  refreshViewbox() {
    const p = new Svg(this.data.path);
    const locs = p.targetLocations();
    if (locs.length > 0) {
      const bbox = browserComputePathBoundingBox(this.data.path);

      this.x = bbox.x;
      this.y = bbox.y;
      this.width = bbox.width;
      this.height = bbox.height;
      if (this.cfg.stroke) {
        this.x -= this.cfg.strokeWidth;
        this.y -= this.cfg.strokeWidth;
        this.width += 2 * this.cfg.strokeWidth;
        this.height += 2 * this.cfg.strokeWidth;
      }
      this.x = parseFloat(this.x.toPrecision(6));
      this.y = parseFloat(this.y.toPrecision(6));
      this.width = parseFloat(this.width.toPrecision(4));
      this.height = parseFloat(this.height.toPrecision(4));
    }
  }
}



@Component({
  selector: 'app-export',
  templateUrl: './export.component.html'
})
export class ExportComponent {
  @Input() path = '';
  @Input() name = '';

  constructor(
    public dialog: MatDialog
  ) {}

  openDialog(): void {
    this.dialog.open(ExportDialogComponent, {
      width: '800px',
      panelClass: 'dialog',
      data: {path: this.path, name: this.name},
      autoFocus: false
    });
  }
}
