import { Injectable } from '@angular/core';



function save() {
  return function(target: Object, propertyKey: string) {
    const localStorageKey = `SaveDecorator.${target.constructor.name}.${propertyKey}`;
    const storedValue = localStorage.getItem(localStorageKey);
    let value: any = JSON.parse(storedValue ?? 'null');
    const wasStored = storedValue !== null;
    let isInitialized = false;

    const setter = (newVal: any) => {
      if(!wasStored || isInitialized) {
        value = newVal;
        if(isInitialized) {
          localStorage.setItem(localStorageKey, JSON.stringify(value));
        }
      }
      isInitialized = true;
    };

    Object.defineProperty(target, propertyKey, {
      get: () => value,
      set: setter
    });
  }
}



@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  @save() viewPortX = -5;
  @save() viewPortY = -5;
  @save() viewPortWidth = 100;
  @save() viewPortHeight = 100;
  @save() viewPortLocked = false;
  @save() filled = false;
  @save() preview = false;
  @save() showTicks = true;
  @save() minifyOutput = false;
  @save() snapToGrid = true;
  @save() tickInterval = 5;
  @save() decimalPrecision = 3;
}


@Injectable({
  providedIn: 'root'
})
export class ExportConfigService {
  @save() fill = false;
  @save() fillColor = '#000000';
  @save() stroke = true;
  @save() strokeColor =  '#E2E2E2';
  @save() strokeWidth = 8;
}
