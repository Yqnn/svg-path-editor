import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormatterDirective } from './formatter.directive';

describe('FormatterDirective', () => {
  it('should create an instance', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ElementRef, useValue: new ElementRef(document.createElement('input')) },
      ],
    });

    const directive = TestBed.runInInjectionContext(() => new FormatterDirective());
    expect(directive).toBeTruthy();
  });
});
