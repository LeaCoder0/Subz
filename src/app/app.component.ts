import { Component, inject } from '@angular/core';
import { registerLocaleData } from '@angular/common';

import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';

import localeDe from '@angular/common/locales/de';
import localeEl from '@angular/common/locales/el';
import localeFr from '@angular/common/locales/fr';
import localeIt from '@angular/common/locales/it';
import localeNb from '@angular/common/locales/nb';
import localeRu from '@angular/common/locales/ru';
import localeSv from '@angular/common/locales/sv';
import localeTa from '@angular/common/locales/ta';
import localeZh from '@angular/common/locales/zh-Hans';
import { NavigationEnd, Router } from '@angular/router';
import { ThemeService } from './Services/theme.service';
import { NotificationService } from './Services/notification.service';
import { Observable, filter, take } from 'rxjs';

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
  notificationService = inject(NotificationService);
  themeService = inject(ThemeService);

  constructor() { this.initializeApp(); }

  initializeApp() {
    // Started before platform.ready() so it cannot miss the first navigation
    this.hideSplashOnFirstPage();

    this.platform.ready().then(() => {
      this.setupInternationalisation().subscribe(() => { this.notificationService.scheduleNotifications(); });
      this.themeService.applyTheme();

      this.platform.backButton.subscribeWithPriority(0, () => {
        // The books list is the root of the app, so back exits from there.
        // Anywhere else, back goes up one path segment.
        const segments = this.router.url.split('/').filter(segment => segment.length > 0);

        if (segments.length <= 1) {
          App.exitApp();
          return;
        }

        this.router.navigate(['/' + segments.slice(0, -1).join('/')]);
      });
    });
  }

  /**
   * launchAutoHide is off, so the splash stays until the app hides it. Doing that
   * on the first completed navigation means it covers startup no matter which
   * route lands first -- it used to live in the overview, which stopped being the
   * landing screen when books arrived, leaving the splash up indefinitely.
   */
  private hideSplashOnFirstPage() {
    // A splash that never hides is indistinguishable from the app not starting,
    // so this also gives up after a few seconds rather than waiting forever.
    const hide = () => SplashScreen.hide().catch(() => undefined);
    setTimeout(hide, 5000);

    if (this.router.navigated) {
      hide();
      return;
    }

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      take(1),
    ).subscribe(hide);
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
