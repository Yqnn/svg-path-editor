import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { Share } from './share';

describe('Share', () => {
  let component: Share;
  let fixture: ComponentFixture<Share>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MatDialogModule, MatIconModule, Share]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Share);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
