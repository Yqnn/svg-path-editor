import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KeyboardNavigable } from './keyboard-navigable';

describe('KeyboardNavigable', () => {
  it('should create an instance', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ElementRef, useValue: new ElementRef(document.createElement('input')) },
      ],
    });

    const directive = TestBed.runInInjectionContext(() => new KeyboardNavigable());
    expect(directive).toBeTruthy();
  });
});
