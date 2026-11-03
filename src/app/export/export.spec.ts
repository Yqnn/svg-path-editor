import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { Export } from './export';

describe('Export', () => {
  let component: Export;
  let fixture: ComponentFixture<Export>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MatDialogModule, MatIconModule, Export]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Export);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
