import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'books',
    loadComponent: () => import('./books/books.page').then(m => m.BooksPage)
  },
  {
    path: 'books/:bookId',
    loadComponent: () => import('./tab-overview/tab-overview.page').then(m => m.TabOverviewPage)
  },
  {
    path: 'settings',
    loadChildren: () => import('./tab-settings/tab-settings.routes').then(m => m.routes)
  },
  {
    path: '',
    redirectTo: '/books',
    pathMatch: 'full'
  }
];
