import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import { add, create, settings, trash } from 'ionicons/icons';
import { Router, RouterLink } from '@angular/router';
import { AlertController, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonNote, IonReorder, IonReorderGroup, IonTitle, IonToolbar, ItemReorderEventDetail } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';

import { IBook } from './Interfaces/bookInterface';
import { ISubscription } from '../tab-overview/Interfaces/subscriptionInterface';
import { ISettings } from '../tab-settings/Interfaces/settingsInterface';
import { StorageService } from '../Services/storage.service';
import { TotalCostByBillingIntervalPipe } from '../tab-overview/Pipes/total-cost-by-billing-interval.pipe';

@Component({
  selector: 'app-books',
  templateUrl: './books.page.html',
  styleUrls: ['./books.page.scss'],
  imports: [IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonNote, IonReorder, IonReorderGroup, IonTitle, IonToolbar, RouterLink, TranslatePipe, DecimalPipe],
})
export class BooksPage {
  private changeDetectorRef = inject(ChangeDetectorRef);
  private alertController = inject(AlertController);
  private router = inject(Router);
  private storageService = inject(StorageService);
  private totalCostPipe = inject(TotalCostByBillingIntervalPipe);
  translateService = inject(TranslateService);

  books: IBook[] = [];
  settings: ISettings;

  /** Totals per book id, so the template does not recompute on every check. */
  totals: Record<number, number> = {};

  private subscriptions: ISubscription[] = [];

  constructor() {
    addIcons({ add, create, settings, trash });

  }

  // Re-read on every entry so totals reflect edits made inside a book
  async ionViewWillEnter() {
    this.settings = await this.storageService.retrieveSettingsFromStorage();
    this.subscriptions = await this.storageService.retrieveSubscriptionsFromStorage();
    this.books = await this.storageService.retrieveBooksFromStorage();
    this.recalculateTotals();
    this.changeDetectorRef.detectChanges();
  }

  openBook(book: IBook) {
    this.router.navigate(['/books', book.id]);
  }

  async addBook() {
    const book = await this.storageService.createBook();
    this.books = await this.storageService.retrieveBooksFromStorage();
    this.recalculateTotals();
    this.changeDetectorRef.detectChanges();
    this.openBook(book);
  }

  async renameBook(book: IBook, event: Event) {
    event.stopPropagation();

    const alert = await this.alertController.create({
      header: this.translateService.instant('BOOKS.RENAME_BOOK'),
      inputs: [{ name: 'name', type: 'text', value: book.name }],
      buttons: [
        { text: this.translateService.instant('GENERAL.CANCEL'), role: 'cancel' },
        {
          text: this.translateService.instant('GENERAL.OK'),
          handler: async (data: { name: string }) => {
            await this.storageService.renameBook(book.id, data.name);
            this.books = await this.storageService.retrieveBooksFromStorage();
            this.changeDetectorRef.detectChanges();
          },
        },
      ],
    });

    await alert.present();
  }

  async deleteBook(book: IBook, event: Event) {
    event.stopPropagation();

    const alert = await this.alertController.create({
      header: this.translateService.instant('BOOKS.DELETE_BOOK'),
      message: this.translateService.instant('BOOKS.DELETE_BOOK_MESSAGE').replace('$NAME$', book.name),
      buttons: [
        { text: this.translateService.instant('GENERAL.CANCEL'), role: 'cancel' },
        {
          text: this.translateService.instant('GENERAL.DELETE'),
          handler: async () => {
            await this.storageService.deleteBook(book.id);
            this.subscriptions = await this.storageService.retrieveSubscriptionsFromStorage();
            this.books = await this.storageService.retrieveBooksFromStorage();
            this.recalculateTotals();
            this.changeDetectorRef.detectChanges();
          },
        },
      ],
    });

    await alert.present();
  }

  async handleReorder(event: CustomEvent<ItemReorderEventDetail>) {
    // complete() reorders the DOM for us and returns the reordered array
    this.books = event.detail.complete(this.books) as IBook[];
    await this.storageService.reorderBooks(this.books);
    this.changeDetectorRef.detectChanges();
  }

  private recalculateTotals() {
    const interval = this.settings?.defaultBillingInterval || 'MONTHS';

    this.totals = {};
    for (const book of this.books) {
      this.totals[book.id] = this.totalCostPipe.transform(
        this.subscriptions.filter(entry => entry.bookId === book.id), interval);
    }
  }
}
