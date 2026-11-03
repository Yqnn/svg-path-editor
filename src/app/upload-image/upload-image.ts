import { ChangeDetectorRef, Component, inject, output } from '@angular/core';
import { MatDialog, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Image } from '../image';
import { MatMiniFabButton, MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { CdkScrollable } from '@angular/cdk/scrolling';

import { MatFormField, MatLabel, MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';

@Component({
    selector: 'app-upload-image-dialog',
    templateUrl: 'upload-image-dialog.html',
    styleUrls: ['./upload-image-dialog.scss'],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatButton, MatFormField, MatLabel, MatInput, FormsModule, MatCheckbox, MatDialogActions]
})
export class UploadImageDialog {
  dialogRef = inject<MatDialogRef<UploadImageDialog>>(MatDialogRef);
  domSanitizer = inject(DomSanitizer);
  private cd = inject(ChangeDetectorRef);

  data: string | null = null;
  displayableData: SafeResourceUrl | null = null;
  name = '';
  x = '0';
  y = '0';
  width = '20';
  height = '20';
  preserveAspectRatio = true;
  private importFile(file: File) {
    if (window.FileReader !== undefined) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.data = e.target?.result?.toString() ?? null;
        if(this.data) {
          this.displayableData = this.domSanitizer.bypassSecurityTrustResourceUrl(this.data);
        }
        this.cd.markForCheck();
      };
      this.name = file.name;
      reader.readAsDataURL(file);
    } else {
      alert('FileReader not supported');
    }
  }
  onCancel(): void {
    this.dialogRef.close();
  }
  onUploadImage(): void {
    this.dialogRef.close({
      data: this.data,
      x1: parseFloat(this.x),
      y1: parseFloat(this.y),
      x2: parseFloat(this.x) + parseFloat(this.width),
      y2: parseFloat(this.y) + parseFloat(this.height),
      preserveAspectRatio: this.preserveAspectRatio,
      opacity:1.0
    });
  }
  onFileSelected(uploadInput: HTMLInputElement) {
    if (typeof (FileReader) !== 'undefined') {
      if(uploadInput.files) {
        this.importFile(uploadInput.files[0]);
      }
    } else {
      alert('FileReader not supported');
    }
  }
  onDrop(event: DragEvent) {
    if(event.dataTransfer && event.dataTransfer.files) {
      const file = event.dataTransfer.files[0];
      if (/^image\//.test(file.type)) {
        this.importFile(file);
      }
    }
    event.preventDefault();
  }
  onDragOver(event: DragEvent) {
      event.stopPropagation();
      event.preventDefault();
  }
}

@Component({
    selector: 'app-upload-image',
    templateUrl: './upload-image.html',
    imports: [MatMiniFabButton, MatTooltip, MatIcon]
})
export class UploadImage {
  dialog = inject(MatDialog);

  readonly addImage = output<Image>();
  readonly cancelled = output<void>();

  openDialog(): void {
    const dialogRef = this.dialog.open(UploadImageDialog, {
      width: '800px',
      panelClass: 'dialog',
    });
    dialogRef.afterClosed().subscribe((result: Image | undefined) => {
      if (result) {
        this.addImage.emit(result);
      } else {
        this.cancelled.emit();
      }
    });
  }
}
