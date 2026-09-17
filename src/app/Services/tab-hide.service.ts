import { Injectable } from '@angular/core';
import { filter } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class TabHideService {
  hideTabForPages = [
    '/tabs/settings/ui',
    '/tabs/settings/region',
    '/tabs/settings/data-management',
    '/tabs/settings/license',
    '/tabs/settings/about',
  ];

  constructor(private router: Router, private platform: Platform) {
    this.platform.ready().then(() => {
      this.subscribeToPageChanges();
    });
  }

  private subscribeToPageChanges() {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(e => {
      this.showOrHideTabs(e);
    });
  }

  private showOrHideTabs(e: any) {
    const tabBar = document.getElementById('myTabBar');

    try {
      if (this.hideTabForPages.indexOf(e.url) > -1) {
        tabBar.style.display = 'none';
      } else {
        tabBar.style.display = 'flex';
      }
    } catch (e) {
      // Page has no tab bar
    }
  }
}
