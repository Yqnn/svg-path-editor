import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef} from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Image } from '../image';

@Component({
  selector: 'app-upload-image-dialog',
  templateUrl: 'upload-image-dialog.component.html',
  styleUrls: ['./upload-image-dialog.component.scss']
})
export class UploadImageDialogComponent {
  data: string = null;
  displayableData: SafeResourceUrl = null;
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
      reader.onload = (e: any) => {
        this.data = e.target.result;
        this.displayableData = this.domSanitizer.bypassSecurityTrustResourceUrl(this.data);
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
      preserveAspectRatio: this.preserveAspectRatio
    });
  }
  onFileSelected(uploadInput: HTMLInputElement) {
    if (typeof (FileReader) !== 'undefined') {
      this.importFile(uploadInput.files[0]);
    } else {
      alert('FileReader not supported');
    }
  }
  onDrop(event: DragEvent) {
    const file = event.dataTransfer.files[0];
    if (/^image\//.test(file.type)) {
      this.importFile(file);
    }
    event.preventDefault();
  }
  onDragOver(event) {
      event.stopPropagation();
      event.preventDefault();
  }
}

@Component({
  selector: 'app-upload-image',
  templateUrl: './upload-image.component.html'
})
export class UploadImageComponent implements OnInit {
  @Output() addImage = new EventEmitter<Image>();

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
      }
    });
  }

  ngOnInit(): void {
  }
}
