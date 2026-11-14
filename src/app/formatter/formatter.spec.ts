import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Formatter } from './formatter';

describe('Formatter', () => {
  it('should create an instance', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ElementRef, useValue: new ElementRef(document.createElement('input')) },
      ],
    });

    const directive = TestBed.runInInjectionContext(() => new Formatter());
    expect(directive).toBeTruthy();
  });
});
