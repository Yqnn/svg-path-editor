import { Directive, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { formatNumber } from '../svg';

@Directive({
  selector: '[appFormatter]'
})
export class FormatterDirective implements OnChanges {
  @Input() formatterType: 'float'|'positive-float'|'integer'|'positive-integer' = 'float';
  @Input() value: number = 0;
  @Output() valueChange = new EventEmitter<number>();
  internalValue: number = 0;

  constructor(private el: ElementRef<HTMLInputElement>) { }

  private get viewValue(): string {
    return this.el.nativeElement.value;
  }

  private set viewValue(newValue: string) {
    if (this.viewValue !== newValue) {
      this.el.nativeElement.value = newValue;
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(e: FocusEvent) {
    if (this.internalValue !== parseFloat(this.viewValue)) {
      this.viewValue = formatNumber(this.internalValue, 4);
    }
  }

  @HostListener('input', ['$event'])
  onInput(e: InputEvent) {
    let value = '';
    if (this.formatterType === 'float') { value = this.viewValue.replace(/[\u066B,]/g, '.').replace(/[^\-0-9.eE]/g, ''); }
    if (this.formatterType === 'integer') { value = this.viewValue.replace(/[^\-0-9]/g, ''); }
    if (this.formatterType === 'positive-float') { value = this.viewValue.replace(/[\u066B,]/g, '.').replace(/[^0-9.eE]/g, ''); }
    if (this.formatterType === 'positive-integer') { value = this.viewValue.replace(/[^0-9]/g, ''); }

    this.viewValue = value;
    const floatValue = parseFloat(value);
    if (!isNaN(floatValue)) {
      this.valueChange.emit(floatValue);
      this.internalValue = floatValue;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.value) {
      if (changes.value.currentValue !== parseFloat(this.viewValue)) {
        this.viewValue = formatNumber(changes.value.currentValue, 4);
        this.internalValue = changes.value.currentValue;
      }
    }
  }
}
