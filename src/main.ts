import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { NextCancelationPeriodDeadlinePipe } from './app/tab-overview/Pipes/next-cancelation-period-deadline.pipe';
import { NotificationTimeForNextCancelationPeriodDeadlinePipe } from './app/tab-overview/Pipes/notification-time-for-next-cancelation-period-deadline.pipe';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
    // NotificationService injects both of these directly, so they need to be
    // resolvable through DI as well as usable as template pipes.
    NextCancelationPeriodDeadlinePipe,
    NotificationTimeForNextCancelationPeriodDeadlinePipe,
    provideTranslateService({
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    }),
  ],
}).catch(err => console.log(err));
