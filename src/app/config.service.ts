import { Injectable } from '@angular/core';



function save() {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(target: Object, propertyKey: string) { 
    const localStorageKey = `SaveDecorator.${target.constructor.name}.${propertyKey}`;
    const storedValue = localStorage.getItem(localStorageKey);
    let value = JSON.parse(storedValue ?? 'null');
    const wasStored = storedValue !== null;
    let isInitialized = false;

    const setter = (newVal: unknown) => {
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
  @save() viewPortX = 0;
  @save() viewPortY = 0;
  @save() viewPortWidth = 30;
  @save() viewPortHeight = 30;
  @save() viewPortLocked = false;
  @save() filled = true;
  @save() preview = false;
  @save() showTicks = false;
  @save() minifyOutput = false;
  @save() snapToGrid = true;
  @save() tickInterval = 5;
  @save() decimalPrecision = 3;
}


@Injectable({
  providedIn: 'root'
})
export class ExportConfigService {
  @save() fill = true;
  @save() fillColor = '#000000';
  @save() stroke = false;
  @save() strokeColor =  '#FF0000';
  @save() strokeWidth = 0.1;
}