import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'overview',
        loadComponent: () => import('../tab-overview/tab-overview.page').then(m => m.TabOverviewPage)
      },
      {
        path: 'settings',
        loadChildren: () => import('../tab-settings/tab-settings.routes').then(m => m.routes)
      },
      {
        path: '',
        redirectTo: '/tabs/overview',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/overview',
    pathMatch: 'full'
  }
];
