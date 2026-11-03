import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  ElementRef,
  afterNextRender,
  inject,
} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Storage } from '../storage';
import { CopiedSnackbar } from '../copied-snackbar/copied-snackbar';
import { MatMiniFabButton, MatIconButton, MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { PathPreview } from '../path-preview/path-preview';
import { MatFormField, MatLabel, MatInput, MatSuffix } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

export class DialogData {
  path?: string;
}

@Component({
    selector: 'app-share-dialog',
    templateUrl: 'share-dialog.html',
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, PathPreview, MatFormField, MatLabel, MatInput, FormsModule, MatIconButton, MatSuffix, MatTooltip, MatIcon, MatDialogActions, MatButton]
})
export class ShareDialog {
  dialogRef = inject<MatDialogRef<ShareDialog>>(MatDialogRef);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  private snackBar = inject(MatSnackBar);

  @ViewChild('input') inputField?: ElementRef;

  constructor() {
    afterNextRender(() => this.selectText());
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
    this.snackBar.openFromComponent(CopiedSnackbar, {
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
    templateUrl: './share.html',
    imports: [MatMiniFabButton, MatTooltip, MatIcon]
})
export class Share {
  dialog = inject(MatDialog);
  storageService = inject(Storage);

  @Input() path = '';
  @Output() importPath = new EventEmitter<string>();

  openDialog(): void {
    this.dialog.open(ShareDialog, {
      width: '800px',
      panelClass: 'dialog',
      autoFocus: false,
      data: {path: this.path}
    });
  }
}
