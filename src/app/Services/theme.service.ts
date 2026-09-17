import { Injectable, inject } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  storageService = inject(StorageService);


  applyTheme() {
    if (window.navigator.userAgent.includes('AndroidDarkMode')) {
      document.body.classList.add('dark');
    }

    this.storageService.retrieveSettingsFromStorage().then(settings => {
      if (settings.hasOwnProperty('forceDarkMode')) {
        if (settings.forceDarkMode) {
          document.body.classList.add('dark');
        } else {
          if (window.navigator.userAgent.includes('AndroidDarkMode')) {
            document.body.classList.add('dark');
          } else {
            document.body.classList.remove('dark');
          }
        }
      }
    });
  }
}
