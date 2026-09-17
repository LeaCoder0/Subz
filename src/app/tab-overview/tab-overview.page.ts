import { ChangeDetectorRef, Component, ViewChild, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import { add, arrowBack, closeOutline, filter, search, swapHorizontal } from 'ionicons/icons';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe, SlicePipe, TitleCasePipe } from '@angular/common';
import { SubscriptionCardComponent } from './Components/subscription-card/subscription-card.component';
import { SearchSubscriptionsPipe } from './Pipes/search-subscriptions.pipe';
import { SortSubscriptionsPipe } from './Pipes/sort-subscriptions.pipe';
import { TotalCostByBillingIntervalPipe } from './Pipes/total-cost-by-billing-interval.pipe';
import { FormsModule } from '@angular/forms';
import { AlertController, IonButton, IonButtons, IonCard, IonCardContent, IonCol, IonContent, IonFabButton, IonGrid, IonHeader, IonIcon, IonItem, IonLabel, IonRow, IonSearchbar, IonTitle, IonToolbar, ModalController } from '@ionic/angular';
import { ModalAddSubscriptionComponent } from './Components/modal-add-subscription/modal-add-subscription.component';
import { ISubscription } from './Interfaces/subscriptionInterface';
import { ISettings } from '../tab-settings/Interfaces/settingsInterface';
import { StorageService } from '../Services/storage.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { billingIntervals } from './BILLING_INTERVALS';
import { NotificationService } from '../Services/notification.service';

@Component({
  selector: 'app-tab-overview',
  templateUrl: 'tab-overview.page.html',
  styleUrls: ['tab-overview.page.scss'],
  imports: [IonButton, IonButtons, IonCard, IonCardContent, IonCol, IonContent, IonFabButton, IonGrid, IonHeader, IonIcon, IonItem, IonLabel, IonRow, IonSearchbar, IonTitle, IonToolbar, FormsModule, RouterLink, TranslatePipe, SearchSubscriptionsPipe, SortSubscriptionsPipe, TotalCostByBillingIntervalPipe, SubscriptionCardComponent, DecimalPipe, SlicePipe, TitleCasePipe],
})
export class TabOverviewPage {
  alertController = inject(AlertController);
  modalController = inject(ModalController);
  storageService = inject(StorageService);
  translateService = inject(TranslateService);
  notificationService = inject(NotificationService);

  private changeDetectorRef = inject(ChangeDetectorRef);
  private activatedRoute = inject(ActivatedRoute);
  @ViewChild('searchSubscriptions', { static: false }) searchSubscriptions: IonSearchbar;

  /** The book this overview is scoped to; set from the route before any load. */
  bookId: number;
  subscriptions: ISubscription[] = [];
  areSubscriptionsFetched = false;
  availableBillingIntervals = billingIntervals;
  selectedBillingInterval: string;
  settings: ISettings;
  subscriptionSearchFilter = '';
  sortSubscriptionsBy: string;
  isSearchbarEnabled = false;

  constructor() {
    addIcons({ add, arrowBack, closeOutline, filter, search, swapHorizontal });


}

  // Gets fired every page view so that settings which were made during runtime, etc. are immediately there
  ionViewWillEnter() {
    this.bookId = Number(this.activatedRoute.snapshot.paramMap.get('bookId'));
    this.retrieveSettingsFromStorage();
    this.retrieveSubscriptionsFromStorage().then(() => {
      this.areSubscriptionsFetched = true;
      this.changeDetectorRef.detectChanges();
    });
  }

  addSubscription(sub: ISubscription): void {
    let id: number;
    do { id = Math.floor((Math.random() * 999999999999) + 1); } while (this.subscriptions.some(subscription => subscription.id === id));

    sub.id = id;
    sub.bookId = this.bookId;
    sub.created = Date.now();
    sub.lastEdited = sub.created;

    this.subscriptions.push(sub);
    this.saveSubscriptionsToStorage();

    // New subscription array with Array.slice() because otherwise the Angular change detection for sorting pipe
    // wouldn't be called after adding new subscriptions leading to not show the new subscription until page refresh
    this.subscriptions = this.subscriptions.slice();
    this.changeDetectorRef.detectChanges();
  }

  updateSubscription(sub: ISubscription): void {
    const index = this.subscriptions.findIndex(subscription => subscription.id === sub.id);
    this.subscriptions[index] = sub;
    this.saveSubscriptionsToStorage();

    // New subscription array with Array.slice() because otherwise the Angular change detection for sorting pipe
    // wouldn't be called after updating subscriptions leading to not show the new subscription until page refresh
    this.subscriptions = this.subscriptions.slice();
    this.changeDetectorRef.detectChanges();
  }

  deleteSubscription(sub: ISubscription): void {
    this.subscriptions = this.subscriptions.filter(subscription => subscription.id !== sub.id);
    this.saveSubscriptionsToStorage();
    this.changeDetectorRef.detectChanges();
  }

  async saveSubscriptionsToStorage() {
    await this.storageService.saveBookSubscriptionsToStorage(this.bookId, this.subscriptions)
      .then(() => { this.notificationService.scheduleNotifications(); });
  }

  async retrieveSubscriptionsFromStorage() {
    this.subscriptions = await this.storageService.retrieveSubscriptionsFromStorage(this.bookId);
    this.changeDetectorRef.detectChanges();
  }

  async presentAddSubscriptionModal() {
    const modal = await this.modalController.create({
      component: ModalAddSubscriptionComponent
    });

    modal.onDidDismiss()
        .then((data) => {
          if (data.data) {
            this.addSubscription(data.data.sub);
          }
      });

    return await modal.present();
  }

  // Handles modal for updating and deleting an existing subscription
  async presentUpdateSubscriptionModal(subscription: ISubscription) {
    const modal = await this.modalController.create({
      component: ModalAddSubscriptionComponent,
      componentProps: {
        existingSubscription: subscription
      }
    });

    modal.onDidDismiss()
        .then((data) => {
          if (data.data) {
            // Delete
            if (data.data.delete) {
              this.deleteSubscription(data.data.sub);
            }
            // Update
            else {
              this.updateSubscription(data.data.sub);
            }
          }
      });

    return await modal.present();
  }

  // Rotates between available billing intervals
  changeChoosenBillingInterval(): void {
    if (this.selectedBillingInterval === this.availableBillingIntervals[this.availableBillingIntervals.length - 1]) {
      this.selectedBillingInterval = this.availableBillingIntervals[0];
    } else {
      const index = this.availableBillingIntervals.findIndex(element => element === this.selectedBillingInterval);
      this.selectedBillingInterval = this.availableBillingIntervals[index + 1];
    }
    this.settings.defaultBillingInterval = this.selectedBillingInterval;
    this.saveSettingsToStorage();
  }

  async retrieveSettingsFromStorage() {
    this.settings = await this.storageService.retrieveSettingsFromStorage();
    this.changeDetectorRef.detectChanges();
    this.selectedBillingInterval = this.settings.defaultBillingInterval || 'MONTHS';
    this.sortSubscriptionsBy = this.settings.defaultSortBy || 'nextBillingAsc';
  }

  async saveSettingsToStorage() {
    this.storageService.saveSettingsToStorage(this.settings);
  }

  async showSortingAlert() {
    const alertStrings: any = {};

    this.translateService.get('TABS.OVERVIEW.SORT_BY').subscribe(SORT_BY => {
      alertStrings.header = SORT_BY;
    });
    this.translateService.get('TABS.OVERVIEW.NAME').subscribe(NAME => {
      alertStrings.name = NAME;
    });
    this.translateService.get('TABS.OVERVIEW.COSTS_PER_PERIOD').subscribe(COSTS_PER_PERIOD => {
      alertStrings.costsPerPeriod = COSTS_PER_PERIOD;
    });
    this.translateService.get('TABS.OVERVIEW.NEXT_PAYMENT').subscribe(NEXT_PAYMENT => {
      alertStrings.nextPayment = NEXT_PAYMENT;
    });
    this.translateService.get('TABS.OVERVIEW.NEXT_SUBSCRIPTION_EXTENSION').subscribe(NEXT_SUBSCRIPTION_EXTENSION => {
      alertStrings.nextSubscriptionExtension = NEXT_SUBSCRIPTION_EXTENSION;
    });
    this.translateService.get('GENERAL.ASC').subscribe(ASC => {
      alertStrings.asc = ASC;
    });
    this.translateService.get('GENERAL.DESC').subscribe(DESC => {
      alertStrings.desc = DESC;
    });

    const alert = await this.alertController.create({
      cssClass: 'alert-full-width',
      header: alertStrings.header,
      inputs: [
        {
          name: 'name',
          type: 'radio',
          label: alertStrings.name,
          value: 'name',
          checked: this.sortSubscriptionsBy.startsWith('name')
        },
        {
          name: 'cost',
          type: 'radio',
          label: alertStrings.costsPerPeriod,
          value: 'cost',
          checked: this.sortSubscriptionsBy.startsWith('cost')
        },
        {
          name: 'nextBilling',
          type: 'radio',
          label: alertStrings.nextPayment,
          value: 'nextBilling',
          checked: this.sortSubscriptionsBy.startsWith('nextBilling')
        },
        {
          name: 'nextContractExtension',
          type: 'radio',
          label: alertStrings.nextSubscriptionExtension,
          value: 'nextContractExtension',
          checked: this.sortSubscriptionsBy.startsWith('nextContractExtension')
        },
      ],
      buttons: [
        {
          text: alertStrings.asc + ' ↑',
          cssClass: this.sortSubscriptionsBy.endsWith('Asc')? 'alert-sort-selected button-solid' : '',
          handler: (sortBy) => {
            this.sortSubscriptions(sortBy + 'Asc');
          },
        }, {
          text: alertStrings.desc + ' ↓',
          cssClass: this.sortSubscriptionsBy.endsWith('Desc')? 'alert-sort-selected' : '',
          handler: (sortBy) => {
            this.sortSubscriptions(sortBy + 'Desc');
          }
        }
      ]
    });

    await alert.present();
  }

  sortSubscriptions(sortBy: string) {
    if (sortBy !== this.sortSubscriptionsBy) {
      this.sortSubscriptionsBy = sortBy;
      this.settings.defaultSortBy = sortBy;
      this.saveSettingsToStorage();
    }
    this.changeDetectorRef.detectChanges();
  }

  dismissHelperText(attributeName: string): void {
    if (attributeName === 'hideOverviewHelperTextGeneral') { this.settings.hideOverviewHelperTextGeneral = true; }
    else if (attributeName === 'hideOverviewHelperTextMenuBar') { this.settings.hideOverviewHelperTextMenuBar = true; }
    else { return; }

    this.saveSettingsToStorage();
  }

  toggleSearchbarVisibility() {
    this.subscriptionSearchFilter = '';
    this.isSearchbarEnabled = !this.isSearchbarEnabled;
    if (this.isSearchbarEnabled) {
      setTimeout(() => {
        this.searchSubscriptions.setFocus();
      }, 100);
    }
  }

}
