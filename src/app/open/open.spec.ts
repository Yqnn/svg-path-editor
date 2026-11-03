import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { Open } from './open';

describe('Open', () => {
  let component: Open;
  let fixture: ComponentFixture<Open>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MatDialogModule, MatIconModule, Open]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Open);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
