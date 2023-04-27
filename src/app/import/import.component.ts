import { Component, Output, EventEmitter, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { kDefaultPath } from '../app.component';
import { StorageService } from '../storage.service';
import { Svg } from '../svg';

export class DialogData {
  path?: string;
}

@Component({
  selector: 'app-import-dialog',
  templateUrl: 'import-dialog.component.html'
})
export class ImportDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ImportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
  onCancel(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-import',
  template: ''
})
export class ImportComponent implements OnInit {
  private urlPath?: string;
  @Output() importPath = new EventEmitter<string>();

  constructor(
    public dialog: MatDialog,
    public storageService: StorageService,
  ) {
    this.urlPath = this.readPath();
  }

  private readPath(): string {
    const fragment = decodeURIComponent(window.location.hash.slice(1));
    const check = /^P=[mMlLvVhHcCsSqQtTaAzZ0-9\-e._,]+$/;
    if(check.test(fragment)) {
      const path = fragment.slice(2).replace(/_/g, ' ');
      try {
        const _ = new Svg(path);
        return path;
      } catch (e) { /* */ }
    }
    return '';
  }

  ngOnInit() {
    const openedPath = this.storageService.getPath();
    const unsavedChanges = openedPath && openedPath.path !== kDefaultPath;
    if(this.urlPath && this.urlPath !== openedPath?.path) {
      if(unsavedChanges) {
        this.openDialog();
      } else {
        this.finalize(true);
      }
    }
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(ImportDialogComponent, {
      width: '800px',
      panelClass: 'dialog',
      autoFocus: false,
      data: {path: this.urlPath}
    });

    dialogRef.afterClosed().subscribe((result: boolean)  => {
      this.finalize(result);
    });
  }

  private finalize(result: boolean): void {
    if(result) {
      this.importPath.emit(this.urlPath);
    }
    window.location.hash = '';
  }
}
