import {
  Directive,
  ElementRef,
  HostListener,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { formatNumber } from '../../lib/svg';

@Directive({
  selector: '[appFormatter]',
})
export class Formatter {
  private el = inject<ElementRef<HTMLInputElement>>(ElementRef);

  readonly formatterType = input<'float' | 'positive-float' | 'integer' | 'positive-integer'>(
    'float',
  );
  readonly numberValue = model(0);
  readonly suffix = input('');
  internalValue = 0;

  constructor() {
    effect(() => {
      const numberValue = this.numberValue();
      const suffix = this.suffix();
      if (numberValue !== parseFloat(this.viewValue)) {
        this.viewValue = formatNumber(numberValue, 4) + suffix;
        this.internalValue = numberValue;
      }
    });
  }

  private get viewValue(): string {
    return this.el.nativeElement.value;
  }

  private set viewValue(newValue: string) {
    if (this.viewValue !== newValue) {
      this.el.nativeElement.value = newValue;
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(_e: FocusEvent) {
    if (this.internalValue !== parseFloat(this.viewValue)) {
      this.viewValue = formatNumber(this.internalValue, 4);
    }

    const suffix = this.suffix();
    if (suffix !== '') {
      this.viewValue += suffix;
    }
  }

  @HostListener('focus', ['$event'])
  onFocus(_e: FocusEvent) {
    const suffix = this.suffix();
    if (suffix !== '') {
      this.viewValue = this.viewValue.replace(suffix, '');
    }
  }

  @HostListener('input', ['$event'])
  onInput(_e: Event) {
    const formatterType = this.formatterType();
    let value = '';
    if (formatterType === 'float') {
      value = this.viewValue.replace(/[\u066B,]/g, '.').replace(/[^\-0-9.eE]/g, '');
    }
    if (formatterType === 'integer') {
      value = this.viewValue.replace(/[^\-0-9]/g, '');
    }
    if (formatterType === 'positive-float') {
      value = this.viewValue.replace(/[\u066B,]/g, '.').replace(/[^0-9.eE]/g, '');
    }
    if (formatterType === 'positive-integer') {
      value = this.viewValue.replace(/[^0-9]/g, '');
    }

    this.viewValue = value;
    const floatValue = parseFloat(value);
    if (!isNaN(floatValue)) {
      this.numberValue.set(floatValue);
      this.internalValue = floatValue;
    }
  }
}
