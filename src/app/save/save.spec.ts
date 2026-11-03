import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { Save } from './save';

describe('Save', () => {
  let component: Save;
  let fixture: ComponentFixture<Save>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MatDialogModule, MatIconModule, Save]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Save);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
