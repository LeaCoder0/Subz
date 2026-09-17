import { vi } from 'vitest';
import { Subject } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { SplashScreen } from '@capacitor/splash-screen';

import { AppComponent } from './app.component';
import { ThemeService } from './Services/theme.service';
import { NotificationService } from './Services/notification.service';

vi.mock('@capacitor/splash-screen', () => ({
  SplashScreen: { hide: vi.fn(() => Promise.resolve()) },
}));

/**
 * launchAutoHide is off, so nothing else will take the splash down. It used to be
 * hidden by the overview, which silently stopped being the landing screen when
 * books arrived -- leaving the app stuck on the splash indefinitely.
 */
describe('AppComponent splash handling', () => {
  let events: Subject<unknown>;
  let router: { events: Subject<unknown>; url: string; navigated: boolean; navigate: () => void };

  function build() {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: Platform, useValue: {
            ready: () => Promise.resolve(),
            backButton: { subscribeWithPriority: () => undefined },
          } },
        { provide: TranslateService, useValue: {
            setFallbackLang: () => undefined,
            getBrowserLang: () => 'en',
            use: () => new Subject(),
          } },
        { provide: ThemeService, useValue: { applyTheme: () => undefined } },
        { provide: NotificationService, useValue: { scheduleNotifications: () => undefined } },
      ],
    });
    return TestBed.runInInjectionContext(() => new AppComponent());
  }

  beforeEach(() => {
    vi.mocked(SplashScreen.hide).mockClear();
    events = new Subject();
    router = { events, url: '/books', navigated: false, navigate: () => undefined };
  });

  it('hides the splash once the first page has loaded', () => {
    build();
    expect(SplashScreen.hide).not.toHaveBeenCalled();

    events.next(new NavigationEnd(1, '/books', '/books'));
    expect(SplashScreen.hide).toHaveBeenCalled();
  });

  it('hides it straight away if navigation already finished', () => {
    router.navigated = true;
    build();
    expect(SplashScreen.hide).toHaveBeenCalled();
  });

  it('gives up waiting rather than leaving the app on the splash forever', () => {
    vi.useFakeTimers();
    try {
      build();
      expect(SplashScreen.hide).not.toHaveBeenCalled();

      vi.advanceTimersByTime(5000);   // navigation never completes
      expect(SplashScreen.hide).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
