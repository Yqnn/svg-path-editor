import { ElementRef } from '@angular/core';
import { KeyboardNavigableDirective } from './keyboard-navigable.directive';



describe('KeyboardNavigableDirective', () => {
  it('should create an instance', () => {
    const el = new ElementRef(document.createElement('input'));
    const directive = new KeyboardNavigableDirective(el);
    expect(directive).toBeTruthy();
  });
});
