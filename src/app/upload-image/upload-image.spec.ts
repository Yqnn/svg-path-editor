import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { UploadImage } from './upload-image';

describe('UploadImage', () => {
  let component: UploadImage;
  let fixture: ComponentFixture<UploadImage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatDialogModule, MatIconModule, UploadImage],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadImage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
