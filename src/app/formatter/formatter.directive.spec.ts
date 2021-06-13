import { ElementRef } from '@angular/core';
import { FormatterDirective } from './formatter.directive';

describe('FormatterDirective', () => {
  it('should create an instance', () => {
    const el = new ElementRef(document.createElement('input'));
    const directive = new FormatterDirective(el);
    expect(directive).toBeTruthy();
  });
});
