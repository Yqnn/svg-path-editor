import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KeyboardNavigableDirective } from './keyboard-navigable.directive';

describe('KeyboardNavigableDirective', () => {
  it('should create an instance', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ElementRef, useValue: new ElementRef(document.createElement('input')) },
      ],
    });

    const directive = TestBed.runInInjectionContext(() => new KeyboardNavigableDirective());
    expect(directive).toBeTruthy();
  });
});
