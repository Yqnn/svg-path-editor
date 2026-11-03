import { Component, inject, input, model } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { Storage } from '../storage';
import { MatMiniFabButton, MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel, MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

export interface DialogData {
  name: string;
}

@Component({
  selector: 'app-save-dialog',
  templateUrl: 'save-dialog.html',
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    MatDialogActions,
    MatButton,
  ],
})
export class SaveDialog {
  dialogRef = inject<MatDialogRef<SaveDialog>>(MatDialogRef);
  storageService = inject(Storage);
  data = inject<DialogData>(MAT_DIALOG_DATA);

  onCancel(): void {
    this.dialogRef.close();
  }
  onSave(): void {
    this.dialogRef.close(this.data);
  }
}

@Component({
  selector: 'app-save',
  templateUrl: './save.html',
  styleUrl: './save.css',
  imports: [MatMiniFabButton, MatTooltip, MatIcon],
})
export class Save {
  dialog = inject(MatDialog);
  storageService = inject(Storage);

  readonly path = input('');
  readonly name = model('');

  openDialog(): void {
    let name = this.name();
    if (!name) {
      let i = 1;
      name = 'My path';
      while (this.storageService.hasPath(name)) {
        name = `My path ${i}`;
        i++;
      }
    }

    const dialogRef = this.dialog.open(SaveDialog, {
      width: '350px',
      panelClass: 'dialog',
      data: { name },
    });

    dialogRef.afterClosed().subscribe((result: DialogData | undefined) => {
      if (result) {
        this.storageService.addPath(result.name, this.path());
        this.name.set(result.name);
      }
    });
  }
}
