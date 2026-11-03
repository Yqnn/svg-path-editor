import { Component, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { kDefaultPath } from '../constants/default-path.const';
import { Storage } from '../storage';
import { SvgPath } from '../../lib/svg';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { PathPreview } from '../path-preview/path-preview';
import { MatButton } from '@angular/material/button';

export class DialogData {
  path?: string;
}

@Component({
    selector: 'app-import-dialog',
    templateUrl: 'import-dialog.html',
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, PathPreview, MatDialogActions, MatButton]
})
export class ImportDialog {
  dialogRef = inject<MatDialogRef<ImportDialog>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);


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
export class Import implements OnInit {
  dialog = inject(MatDialog);
  storageService = inject(Storage);

  private urlPath?: string;
  @Output() importPath = new EventEmitter<string>();

  constructor() {
    this.urlPath = this.readPath();
  }

  private readPath(): string {
    const fragment = decodeURIComponent(window.location.hash.slice(1));
    const check = /^P=[mMlLvVhHcCsSqQtTaAzZ0-9\-e._,]+$/;
    if(check.test(fragment)) {
      const path = fragment.slice(2).replace(/_/g, ' ');
      try {
        const _ = new SvgPath(path);
        return path;
      } catch {
        // Ignore malformed paths from the URL fragment.
      }
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
    const dialogRef = this.dialog.open(ImportDialog, {
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
