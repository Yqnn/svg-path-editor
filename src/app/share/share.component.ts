import { Component, Output, EventEmitter, Input, ViewChild, AfterViewInit, ElementRef, inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from '../storage.service';
import { CopiedSnackbarComponent } from '../copied-snackbar/copied-snackbar.component';
import { MatMiniFabButton, MatIconButton, MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { PathPreviewComponent } from '../path-preview/path-preview.component';
import { MatFormField, MatLabel, MatInput, MatSuffix } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

export class DialogData {
  path?: string;
}

@Component({
    selector: 'app-share-dialog',
    templateUrl: 'share-dialog.component.html',
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, PathPreviewComponent, MatFormField, MatLabel, MatInput, FormsModule, MatIconButton, MatSuffix, MatTooltip, MatIcon, MatDialogActions, MatButton]
})
export class ShareDialogComponent implements AfterViewInit {
  dialogRef = inject<MatDialogRef<ShareDialogComponent>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  private snackBar = inject(MatSnackBar);

  @ViewChild('input') inputField?: ElementRef;

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
    templateUrl: './share.component.html',
    imports: [MatMiniFabButton, MatTooltip, MatIcon]
})
export class ShareComponent {
  dialog = inject(MatDialog);
  storageService = inject(StorageService);

  @Input() path = '';
  @Output() importPath = new EventEmitter<string>();

  openDialog(): void {
    this.dialog.open(ShareDialogComponent, {
      width: '800px',
      panelClass: 'dialog',
      autoFocus: false,
      data: {path: this.path}
    });
  }
}
