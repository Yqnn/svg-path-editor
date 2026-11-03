import {
  ChangeDetectorRef,
  Component,
  AfterViewInit,
  inject,
  output,
  viewChild,
} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { Storage } from '../storage';
import { SvgPath } from '../../lib/svg';
import { MatMiniFabButton, MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { CdkScrollable } from '@angular/cdk/scrolling';


export class DialogData {
  name?: string;
}

@Component({
    selector: 'app-open-dialog',
    templateUrl: 'open-dialog.html',
    styleUrls: ['./open-dialog.css'],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatTable, MatSort, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatSortHeader, MatCellDef, MatCell, MatMiniFabButton, MatTooltip, MatIcon, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatDialogActions, MatButton]
})
export class OpenDialog implements AfterViewInit {
  dialogRef = inject<MatDialogRef<OpenDialog>>(MatDialogRef);
  storageService = inject(Storage);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  private cd = inject(ChangeDetectorRef);


  dataSource = new MatTableDataSource(this.storageService.storedPaths.filter(it => !!it.name));
  displayedColumns = ['preview', 'name', 'create', 'change', 'actions'];
  beingRemoved?: string;
  readonly sort = viewChild(MatSort);

  ngAfterViewInit() {
    this.dataSource.sort = this.sort() ?? null;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'change': return new Date(item.changeDate).getTime();
        case 'create': return new Date(item.creationDate).getTime();
        case 'name': return item.name || '';
        default: return item.path;
      }
    };
    this.cd.markForCheck();
  }

  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric'
    };
    return new Intl.DateTimeFormat(undefined, options).format(date);
  }

  viewbox(path: string): string {
    const p = new SvgPath(path);
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
    templateUrl: './open.html',
    styleUrls: ['./open.css'],
    imports: [MatMiniFabButton, MatTooltip, MatIcon]
})
export class Open {
  dialog = inject(MatDialog);
  storageService = inject(Storage);

  readonly openPath = output<{ name: string; path: string }>();

  openDialog(): void {
    const dialogRef = this.dialog.open(OpenDialog, {
      width: '800px',
      panelClass: 'dialog',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((result: DialogData | undefined) => {
      if (result) {
        const storedPath = this.storageService.getPath(result.name);
        if(storedPath && storedPath.name && storedPath.path) {
          this.openPath.emit({
            name: storedPath.name,
            path: storedPath.path
          });
        }
      }
    });
  }
}
