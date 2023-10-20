import { Component, Output, EventEmitter, Inject, Input, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from '../storage.service';
import { CopiedSnackbarComponent } from '../copied-snackbar/copied-snackbar.component';

export class DialogData {
  path?: string;
}

@Component({
  selector: 'app-share-dialog',
  templateUrl: 'share-dialog.component.html'
})
export class ShareDialogComponent implements AfterViewInit {
  @ViewChild('input') inputField?: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<ShareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private snackBar: MatSnackBar
  ) {
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.selectText());
  }

  private selectText(): void {
    const el = this.inputField?.nativeElement;
    el?.focus();
    el?.select();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  copy(): void {
    this.selectText();
    navigator.clipboard.writeText(this.inputField?.nativeElement.value);
    this.snackBar.openFromComponent(CopiedSnackbarComponent, {
      horizontalPosition:'center',
      verticalPosition: 'top',
      duration: 2000
    });
  }

  getUrl(): string {
    const loc = window.location;
    const fragment = this.data.path?.replace(/ +/g, '_');
    return `${loc.protocol}//${loc.host}${loc.pathname}#P=${fragment}`;
  }
}

@Component({
  selector: 'app-share',
  templateUrl: './share.component.html'
})
export class ShareComponent {
  @Input() path = '';
  @Output() importPath = new EventEmitter<string>();

  constructor(
    public dialog: MatDialog,
    public storageService: StorageService,
  ) {
  }

  openDialog(): void {
    this.dialog.open(ShareDialogComponent, {
      width: '800px',
      panelClass: 'dialog',
      autoFocus: false,
      data: {path: this.path}
    });
  }
}
