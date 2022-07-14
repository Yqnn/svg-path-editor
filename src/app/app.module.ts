import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { HttpClientModule } from '@angular/common/http';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { MatTooltipModule, MAT_TOOLTIP_SCROLL_STRATEGY } from '@angular/material/tooltip';
import { MatSliderModule } from '@angular/material/slider';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';

import { Overlay, ScrollStrategy } from '@angular/cdk/overlay';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { FormatterDirective } from './formatter/formatter.directive';
import { KeyboardNavigableDirective } from './keyboard-navigable/keyboard-navigable.directive';
import { ExpandableComponent } from './expandable/expandable.component';
import { CanvasComponent } from './canvas/canvas.component';
import { PathPreviewComponent } from './path-preview/path-preview.component';
import { OpenComponent, OpenDialogComponent } from './open/open.component';
import { SaveComponent, SaveDialogComponent } from './save/save.component';
import { ExportComponent, ExportDialogComponent } from './export/export.component';
import { UploadImageComponent, UploadImageDialogComponent } from './upload-image/upload-image.component';
import { ImportComponent, ImportDialogComponent } from './import/import.component';
import { ShareComponent, ShareDialogComponent, ShareDialogSnackbarComponent } from './share/share.component';

@NgModule({
  declarations: [
    AppComponent,
    ExpandableComponent,
    CanvasComponent,
    OpenComponent,
    OpenDialogComponent,
    SaveComponent,
    SaveDialogComponent,
    ExportComponent,
    ExportDialogComponent,
    UploadImageComponent,
    UploadImageDialogComponent,
    ImportComponent,
    ImportDialogComponent,
    ShareComponent,
    ShareDialogComponent,
    ShareDialogSnackbarComponent,
    FormatterDirective,
    KeyboardNavigableDirective,
    PathPreviewComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTooltipModule,
    MatDialogModule,
    MatTableModule,
    MatSortModule,
    MatSliderModule,
    MatSnackBarModule,
    BrowserAnimationsModule,
    ScrollingModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [{
    provide: MAT_TOOLTIP_SCROLL_STRATEGY,
    deps: [Overlay],
    useFactory(overlay: Overlay): () => ScrollStrategy {
      return () => overlay.scrollStrategies.close();
    }
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }


