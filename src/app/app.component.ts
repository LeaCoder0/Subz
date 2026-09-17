import { Component, inject } from '@angular/core';
import { registerLocaleData } from '@angular/common';

import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { App } from '@capacitor/app';

import localeDe from '@angular/common/locales/de';
import localeEl from '@angular/common/locales/el';
import localeFr from '@angular/common/locales/fr';
import localeIt from '@angular/common/locales/it';
import localeNb from '@angular/common/locales/nb';
import localeRu from '@angular/common/locales/ru';
import localeSv from '@angular/common/locales/sv';
import localeTa from '@angular/common/locales/ta';
import localeZh from '@angular/common/locales/zh-Hans';
import { TabHideService } from './Services/tab-hide.service';
import { Router } from '@angular/router';
import { ThemeService } from './Services/theme.service';
import { NotificationService } from './Services/notification.service';
import { Observable } from 'rxjs';

/**
 * Locale data and the translation file each browser language maps to. `nb` and
 * `zh` differ from their translation-file names, which is why this is a table
 * rather than a straight passthrough.
 */
const LOCALES: Record<string, { data: unknown; lang: string }> = {
  de: { data: localeDe, lang: 'de' },
  el: { data: localeEl, lang: 'el' },
  fr: { data: localeFr, lang: 'fr' },
  it: { data: localeIt, lang: 'it' },
  nb: { data: localeNb, lang: 'nb_NO' },
  ru: { data: localeRu, lang: 'ru' },
  sv: { data: localeSv, lang: 'sv' },
  ta: { data: localeTa, lang: 'ta' },
  zh: { data: localeZh, lang: 'zh_Hans' },
};

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private platform = inject(Platform);
  private translateService = inject(TranslateService);
  private router = inject(Router);
  tabHideService = inject(TabHideService);
  notificationService = inject(NotificationService);
  themeService = inject(ThemeService);

  constructor() { this.initializeApp(); }

  initializeApp() {
    this.platform.ready().then(() => {
      this.setupInternationalisation().subscribe(() => { this.notificationService.scheduleNotifications(); });
      this.themeService.applyTheme();

      this.platform.backButton.subscribeWithPriority(0, () => {
        const url = this.router.url;

        if (url === '/tabs/overview' || url === '/tabs/settings') {
          App.exitApp();
        } else if (url === '/tabs/settings/ui'
          || url === '/tabs/settings/region'
          || url === '/tabs/settings/data-management'
          || url === '/tabs/settings/license'
          || url === '/tabs/settings/about') {
          this.router.navigate(['/tabs/settings']);
        }
      });
    });
  }

  setupInternationalisation(): Observable<any> {
    this.translateService.setFallbackLang('en');
    const browserLang = this.translateService.getBrowserLang();

    const locale = browserLang ? LOCALES[browserLang] : undefined;
    if (!locale) {
      return this.translateService.use('en');
    }

    // Register locale data so Angular's built-in pipes format for this language.
    registerLocaleData(locale.data);
    return this.translateService.use(locale.lang);
  }
}
