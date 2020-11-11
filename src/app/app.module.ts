import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule, MAT_TOOLTIP_SCROLL_STRATEGY } from '@angular/material/tooltip';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Overlay, ScrollStrategy } from '@angular/cdk/overlay';


import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { ExpandableComponent } from './expandable/expandable.component';
import { CanvasComponent } from './canvas/canvas.component';
import { OpenComponent, OpenDialogComponent } from './open/open.component';
import { SaveComponent, SaveDialogComponent } from './save/save.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { FormatterDirective } from './formatter/formatter.directive';
import { KeyboardNavigableDirective } from './keyboard-navigable/keyboard-navigable.directive';

@NgModule({
  declarations: [
    AppComponent,
    ExpandableComponent,
    CanvasComponent,
    OpenComponent,
    SaveComponent,
    SaveDialogComponent,
    OpenDialogComponent,
    FormatterDirective,
    KeyboardNavigableDirective
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
    BrowserAnimationsModule,
    ScrollingModule
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


