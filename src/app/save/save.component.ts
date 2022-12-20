import { Component, Inject, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { StorageService } from '../storage.service';

export interface DialogData {
  name: string;
}

@Component({
  selector: 'app-save-dialog',
  templateUrl: 'save-dialog.component.html',
})
export class SaveDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SaveDialogComponent>,
    public storageService: StorageService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
  }
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
  styleUrls: ['./save.component.css']
})
export class SaveComponent {
  @Input() path = '';
  @Input() name = '';
  @Output() nameChange = new EventEmitter<string>();

  constructor(
    public dialog: MatDialog,
    public storageService: StorageService,
  ) {}

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
