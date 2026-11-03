import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Canvas } from './canvas';

describe('Canvas', () => {
  let component: Canvas;
  let fixture: ComponentFixture<Canvas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Canvas],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Canvas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
