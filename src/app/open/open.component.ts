import { Component, Inject, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { StorageService } from '../storage.service';
import { Svg } from '../svg';

export class DialogData {
  name: string;
}

@Component({
  selector: 'app-open-dialog',
  templateUrl: 'open-dialog.component.html',
  styleUrls: ['./open-dialog.component.css']
})
export class OpenDialogComponent implements AfterViewInit {
  constructor(
    public dialogRef: MatDialogRef<OpenDialogComponent>,
    public storageService: StorageService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
  }

  dataSource = new MatTableDataSource(this.storageService.storedPaths.filter(it => !!it.name));
  displayedColumns = ['preview', 'name', 'create', 'change', 'actions'];
  beingRemoved: string;
  @ViewChild(MatSort) sort: MatSort;

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'change': return new Date(item.changeDate);
        case 'create': return new Date(item.creationDate);
        default: return item[property];
      }
    };
  }

  formatDate(date: Date): string {
    const options = {
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric'
    };
    return new Intl.DateTimeFormat(undefined, options).format(date);
  }

  viewbox(path: string): string {
    const p = new Svg(path);
    const locs = p.targetLocations();
    if (locs.length > 0) {
      const minx = locs.reduce((acc, pt) => Math.min(acc, pt.x), Infinity);
      const miny = locs.reduce((acc, pt) => Math.min(acc, pt.y), Infinity);
      const maxx = locs.reduce((acc, pt) => Math.max(acc, pt.x), -Infinity);
      const maxy = locs.reduce((acc, pt) => Math.max(acc, pt.y), -Infinity);
      return `${minx} ${miny} ${maxx - minx} ${maxy - miny}`;
    }
    return `0 0 0 0`;
  }
  onOpen(name: string): void {
    this.dialogRef.close({name});
  }
  onCancel(): void {
    this.dialogRef.close();
  }
  onRemove(name: string): void {
    this.storageService.removePath(name);
    this.dataSource = new MatTableDataSource(this.storageService.storedPaths.filter(it => !!it.name));
    this.beingRemoved = undefined;
  }
}

@Component({
  selector: 'app-open',
  templateUrl: './open.component.html',
  styleUrls: ['./open.component.css']
})
export class OpenComponent {
  @Output() openPath = new EventEmitter<{name: string, path: string}>();

  constructor(
    public dialog: MatDialog,
    public storageService: StorageService,
  ) {}

  openDialog(): void {
    const dialogRef = this.dialog.open(OpenDialogComponent, {
      width: '800px',
      panelClass: 'dialog',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((result: DialogData)  => {
      if (result) {
        this.openPath.emit(this.storageService.getPath(result.name));
      }
    });
  }
}
