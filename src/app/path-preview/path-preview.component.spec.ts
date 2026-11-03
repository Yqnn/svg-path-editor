import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PathPreviewComponent } from './path-preview.component';

describe('PathPreviewComponent', () => {
  let component: PathPreviewComponent;
  let fixture: ComponentFixture<PathPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PathPreviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PathPreviewComponent);
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
