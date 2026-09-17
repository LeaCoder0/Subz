import { ChangeDetectorRef, Component, Input, OnInit, ViewChild, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import { arrowBack, save } from 'ionicons/icons';
import { DatePipe, LowerCasePipe, UpperCasePipe } from '@angular/common';
import { AlertController, IonButton, IonButtons, IonCol, IonContent, IonDatetime, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonListHeader, IonModal, IonNote, IonRow, IonSelect, IonSelectOption, IonTitle, IonToolbar, ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ISettings } from '../../../tab-settings/Interfaces/settingsInterface';
import { ISubscription } from '../../Interfaces/subscriptionInterface';
import { StorageService } from '../../../Services/storage.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { billingIntervals } from '../../BILLING_INTERVALS';
import { subscriptionColors } from '../../SUBSCRIPTION_COLORS';
import { angularDateFormats, dateFormats } from '../../../tab-settings/region/DATE_FORMATS';

@Component({
  selector: 'app-modal-add-subscription',
  templateUrl: './modal-add-subscription.component.html',
  styleUrls: ['./modal-add-subscription.component.scss'],
  imports: [IonButton, IonButtons, IonCol, IonContent, IonDatetime, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonListHeader, IonModal, IonNote, IonRow, IonSelect, IonSelectOption, IonTitle, IonToolbar, ReactiveFormsModule, TranslatePipe, DatePipe, LowerCasePipe, UpperCasePipe],
})
export class ModalAddSubscriptionComponent implements OnInit {
  alertController = inject(AlertController);
  modalController = inject(ModalController);
  private formBuilder = inject(FormBuilder);
  private storageService = inject(StorageService);
  translateService = inject(TranslateService);

  private changeDetectorRef = inject(ChangeDetectorRef);
  @Input() existingSubscription?: ISubscription; // If passed, the component is used for updating an existing subscription
  @ViewChild('nameInput') nameInput: IonInput;

  subscriptionForm: FormGroup;
  availableBillingIntervals = billingIntervals;
  colors = subscriptionColors;
  retrievedSettings: ISettings;
  dateFormatList = dateFormats;
  currentYear = new Date().getFullYear();
  maxDate = `${new Date().getFullYear() + 5}-12-31`;

  /** The user's stored format, translated into Angular DatePipe tokens. */
  get displayDateFormat(): string {
    return angularDateFormats[this.retrievedSettings?.dateFormat] ?? angularDateFormats[dateFormats[0]];
  }

  constructor() {
    addIcons({ arrowBack, save });

    this.subscriptionForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: [''],
      cost: ['', Validators.required],
      color: ['BLUE', Validators.required],
      billingStart: [new Date().toISOString().slice(0, 10), Validators.required],
      billingEvery: [1, Validators.required],
      billingInterval: ['MONTHS', Validators.required],
      contractStart: [new Date().toISOString().slice(0, 10), Validators.required],
      minimumContractDuration: [2, Validators.required],
      minimumContractDurationInterval: ['YEARS', Validators.required],
      extensionAfterMinimumContractDurationEvery: [6, Validators.required],
      extensionAfterMinimumContractDurationInterval: ['MONTHS', Validators.required],
      cancelationPeriodEvery: [3],
      cancelationPeriodInterval: ['MONTHS'],
      notificationBeforeCancelationPeriodInDays: [null]
    });
  }

  ngOnInit() {
    this.retrieveSettingsFromStorage().then(() => {
      if (this.existingSubscription) {
        // Update form to existing subscription
        this.fillFormWithExistingSubscription();
      } else {
        this.fillNotificationBeforeCancelationPeriodInDays();
      }
    });
  }

  ionViewDidEnter() {
    if (!this.existingSubscription) {
      this.focusNameInput();
    }
  }

  // For new subscription and updating existing one
  save() {
    if (this.subscriptionForm.valid) {
      const subscription: ISubscription = this.subscriptionForm.value;
      // Updating subscription, keep id, keep created, and update lastEdited
      if (this.existingSubscription) {
        subscription.id = this.existingSubscription.id;
        subscription.created = this.existingSubscription.created;
        subscription.lastEdited = Date.now();
      }

      this.modalController.dismiss({sub: subscription});
    } else {
      Object.values(this.subscriptionForm.controls).forEach(control => {
        control.markAsTouched();
      });
    }
  }

  delete() {
    this.modalController.dismiss({delete: true, sub: this.existingSubscription});
  }

  async showDeleteConfirmationModal() {
    const alertStrings: any = {};

    this.translateService.get('GENERAL.CANCEL').subscribe(CANCEL => {
      alertStrings.cancel = CANCEL;
    });
    this.translateService.get('GENERAL.OK').subscribe(OK => {
      alertStrings.ok = OK;
    });
    this.translateService.get('TABS.OVERVIEW.REMOVE_SUBSCRIPTION_ALERT_HEADER').subscribe(REMOVE_SUBSCRIPTION_ALERT_HEADER => {
      alertStrings.header = REMOVE_SUBSCRIPTION_ALERT_HEADER;
    });
    this.translateService.get('TABS.OVERVIEW.REMOVE_SUBSCRIPTION_ALERT_MESSAGE').subscribe(REMOVE_SUBSCRIPTION_ALERT_MESSAGE => {
      alertStrings.message = REMOVE_SUBSCRIPTION_ALERT_MESSAGE;
    });

    const alert = await this.alertController.create({
      cssClass: 'alert-full-width',
      header: alertStrings.header,
      message: alertStrings.message,
      buttons: [
        {
          text: alertStrings.cancel,
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: alertStrings.ok,
          handler: () => {
            this.delete();
          }
        }
      ]
    });

    await alert.present();
  }

  dismiss() {
    this.modalController.dismiss();
  }

  async retrieveSettingsFromStorage() {
    this.retrievedSettings = await this.storageService.retrieveSettingsFromStorage();
    this.changeDetectorRef.detectChanges();
  }

  fillFormWithExistingSubscription(): void {
    Object.keys(this.subscriptionForm.controls).forEach(key => {
      this.subscriptionForm.patchValue({
        [key]: this.existingSubscription[key]
      });
    });
  }

  fillNotificationBeforeCancelationPeriodInDays(): void {
    if (this.retrievedSettings) {
      this.subscriptionForm.patchValue({
        notificationBeforeCancelationPeriodInDays: this.retrievedSettings.notificationBeforeCancelationPeriodInDays,
      });
    }
  }

  focusNameInput(): void {
    setTimeout(() => {
      this.nameInput.setFocus();
    }, 100);
  }

}
