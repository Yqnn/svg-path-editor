import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { StorageService } from '../storage.service';
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
    templateUrl: 'save-dialog.component.html',
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatFormField, MatLabel, MatInput, FormsModule, MatDialogActions, MatButton]
})
export class SaveDialogComponent {
  dialogRef = inject<MatDialogRef<SaveDialogComponent>>(MatDialogRef);
  storageService = inject(StorageService);
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
    templateUrl: './save.component.html',
    styleUrls: ['./save.component.css'],
    imports: [MatMiniFabButton, MatTooltip, MatIcon]
})
export class SaveComponent {
  dialog = inject(MatDialog);
  storageService = inject(StorageService);

  @Input() path = '';
  @Input() name = '';
  @Output() nameChange = new EventEmitter<string>();

  openDialog(): void {
    let name = this.name;
    if (!name) {
      let i = 1;
      name = 'My path';
      while (this.storageService.hasPath(name)) {
        name = `My path ${i}`;
        i++;
      }
    }

    const dialogRef = this.dialog.open(SaveDialogComponent, {
      width: '350px',
      panelClass: 'dialog',
      data: {name}
    });

    dialogRef.afterClosed().subscribe((result: DialogData)  => {
      if (result) {
        this.storageService.addPath(result.name, this.path);
        this.name = result.name;
        this.nameChange.emit(this.name);
      }
    });
  }
}
