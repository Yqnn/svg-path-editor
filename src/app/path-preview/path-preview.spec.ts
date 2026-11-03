import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PathPreview } from './path-preview';

describe('PathPreview', () => {
  let component: PathPreview;
  let fixture: ComponentFixture<PathPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PathPreview],
    }).compileComponents();

    fixture = TestBed.createComponent(PathPreview);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('x', 0);
    fixture.componentRef.setInput('y', 0);
    fixture.componentRef.setInput('width', 100);
    fixture.componentRef.setInput('height', 100);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
