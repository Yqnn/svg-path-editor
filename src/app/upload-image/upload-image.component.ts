import { Component, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef} from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Image } from '../image';

@Component({
  selector: 'app-upload-image-dialog',
  templateUrl: 'upload-image-dialog.component.html',
  styleUrls: ['./upload-image-dialog.component.scss']
})
export class UploadImageDialogComponent {
  data: string | null = null;
  displayableData: SafeResourceUrl | null = null;
  name = '';
  x = '0';
  y = '0';
  width = '20';
  height = '20';
  preserveAspectRatio = true;

  constructor(
    public dialogRef: MatDialogRef<UploadImageDialogComponent>,
    public domSanitizer: DomSanitizer
  ) {
  }
  private importFile(file: File) {
    if (window.FileReader !== undefined) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.data = e.target?.result?.toString() ?? null;
        if(this.data) {
          this.displayableData = this.domSanitizer.bypassSecurityTrustResourceUrl(this.data);
        }
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
  templateUrl: './upload-image.component.html'
})
export class UploadImageComponent {
  @Output() addImage = new EventEmitter<Image>();
  @Output() cancel = new EventEmitter<void>();

  constructor(
    public dialog: MatDialog,
  ) {}

  openDialog(): void {
    const dialogRef = this.dialog.open(UploadImageDialogComponent, {
      width: '800px',
      panelClass: 'dialog'
    });
    dialogRef.afterClosed().subscribe((result: Image)  => {
      if (result) {
        this.addImage.emit(result);
      } else {
        this.cancel.emit();
      }
    });
  }
}
