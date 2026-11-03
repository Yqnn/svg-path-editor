import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { Overlay, ScrollStrategy } from '@angular/cdk/overlay';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import {
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MAT_TOOLTIP_SCROLL_STRATEGY,
} from '@angular/material/tooltip';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
    {
      provide: MAT_TOOLTIP_SCROLL_STRATEGY,
      deps: [Overlay],
      useFactory(overlay: Overlay): () => ScrollStrategy {
        return () => overlay.scrollStrategies.close();
      },
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        appearance: 'fill',
        floatLabels: 'always',
        color: 'accent',
      },
    },
    {
      provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
      useValue: {
        disableTooltipInteractivity: true,
      },
    },
  ],
};
