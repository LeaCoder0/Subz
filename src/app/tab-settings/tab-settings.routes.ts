import { Routes } from '@angular/router';
import { TabSettingsPage } from './tab-settings.page';

export const routes: Routes = [
  {
    path: '',
    component: TabSettingsPage,
  },
  {
    path: 'ui',
    loadComponent: () => import('./ui/ui.page').then(m => m.UiPage)
  },
  {
    path: 'region',
    loadComponent: () => import('./region/region.page').then(m => m.RegionPage)
  },
  {
    path: 'license',
    loadComponent: () => import('./license/license.page').then(m => m.LicensePage)
  },
  {
    path: 'data-management',
    loadComponent: () => import('./data-management/data-management.page').then(m => m.DataManagementPage)
  },
  {
    path: 'about',
    loadComponent: () => import('./about/about.page').then(m => m.AboutPage)
  }
];
