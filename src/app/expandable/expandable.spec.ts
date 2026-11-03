import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { Expandable } from './expandable';

describe('Expandable', () => {
  let component: Expandable;
  let fixture: ComponentFixture<Expandable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Expandable],
      providers: [provideNoopAnimations()],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Expandable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
