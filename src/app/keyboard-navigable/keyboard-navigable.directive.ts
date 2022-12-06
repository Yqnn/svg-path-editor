import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appKeyboardNavigable]'
})
export class KeyboardNavigableDirective {
  @Input() keyboardNavigableIdPrefix = '';

  constructor(private el: ElementRef<HTMLInputElement>) { }

  setFocus(row: number, col: number, event: KeyboardEvent): boolean {
    const el = document.getElementById(`${this.keyboardNavigableIdPrefix}_${row}_${col}`) as HTMLInputElement;
    if (el) {
      el.focus();
      el.select();
      event.preventDefault();
      return true;
    }
    return false;
  }

  moveFocusTo(type: 'left'|'right'|'up'|'down', event: KeyboardEvent) {
    const id = this.el.nativeElement.getAttribute('id') || '';
    let row = parseInt(id.replace(/.*_([0-9]+)_[0-9]+$/, '$1'), 10);
    let col = parseInt(id.replace(/.*_[0-9]+_([0-9]+)$/, '$1'), 10);

    if (type === 'up') {
      row -= 1;
    }
    if (type === 'down') {
      row += 1;
    }
    if (type === 'left') {
      col -= 1;
    }
    if (type === 'right') {
      col += 1;
    }
    let count = 0;
    while (row >= 0 && count < 3) {
      if (this.setFocus(row, col, event)) {
        return;
      }
      if (type === 'right') {
        if (this.setFocus(row, col + 1, event) || this.setFocus(row + 1, 0, event)) {
          return;
        }
      }
      if (type === 'left') {
        if (col > 0 && this.setFocus(row, col - 1, event)) {
          return;
        }
        let col2 = 7;
        while (col2 >= 0) {
          col2 --;
          if (this.setFocus(row - 1, col2, event)) {
            return;
          }
        }
      }
      let col3 = col;
      while ((type === 'down' || type === 'up') && col3 > 0) {
        col3 --;
        if (this.setFocus(row, col3, event)) {
          return;
        }
      }
      count ++;
      if (type === 'up' || type === 'left') {
        row --;
      } else {
        row ++;
      }
    }
  }

  @HostListener('keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    const selStart = this.el.nativeElement.selectionStart;
    const selEnd = this.el.nativeElement.selectionEnd;
    if (selStart === selEnd) {
      if (selStart === 0) {
        if (e.key === 'ArrowLeft') {
          this.moveFocusTo('left', e);
        }
        if (e.key === 'ArrowUp') {
          this.moveFocusTo('up', e);
        }
      }
      if (selStart === this.el.nativeElement.value.length) {
        if (e.key === 'ArrowRight') {
          this.moveFocusTo('right', e);
        }
        if (e.key === 'ArrowDown') {
          this.moveFocusTo('down', e);
        }
      }
    }
  }
}
