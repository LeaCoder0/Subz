import { ChangeDetectorRef, Component, Input, OnInit, ViewChild, inject } from '@angular/core';
import Coloris, { init as initColoris } from '@melloware/coloris';

import { contrastHexFor, isPresetColor } from '../../subscription-color';
import { subscriptionColors } from '../../SUBSCRIPTION_COLORS';

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

import { angularDateFormats, dateFormats } from '../../../tab-settings/region/DATE_FORMATS';

/**
 * The npm build of Coloris drops the auto-init that the browser bundle performs
 * on DOM ready, so it has to be called by hand -- without it the picker element
 * is never created and opening it throws. Once per app, not once per modal.
 */
let colorPickerReady = false;

/** The preset palette as hex, offered as quick picks inside the picker. */
const PRESET_SWATCHES = ['#3880ff', '#2dd36f', '#ffc409', '#eb445a', '#92949c'];

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
  /** Sentinel for the select; never stored on a subscription. */
  readonly CUSTOM_COLOR = 'CUSTOM';

  /** Seeds the native picker when the entry has no custom colour yet. */
  private static readonly DEFAULT_CUSTOM_COLOR = '#3880ff';

  currentYear = new Date().getFullYear();
  maxDate = `${new Date().getFullYear() + 5}-12-31`;

  /**
   * The app forces its own dark mode with a body class rather than relying on
   * prefers-color-scheme, so Coloris's own 'auto' would not follow it -- the
   * mode is read from the same class ThemeService sets.
   */
  private setupColorPicker() {
    if (!colorPickerReady) {
      initColoris();
      colorPickerReady = true;
    }

    Coloris({
      el: '[data-coloris]',
      theme: 'default',
      themeMode: document.body.classList.contains('dark') ? 'dark' : 'light',
      format: 'hex',
      alpha: false,
      // Coloris only builds its .clr-field wrapper for inputs that exist at init
      // time, and ours is added later by the template. Clicking still opens the
      // picker because a string `el` binds through document-level delegation, so
      // wrapping is off and the swatch below is ours.
      wrap: false,
      focusInput: false,
      selectInput: false,
      // the built-in palette, as quick picks alongside the full spectrum
      swatches: PRESET_SWATCHES,
    });
  }

  get isPresetSelected(): boolean {
    return isPresetColor(this.subscriptionForm.value.color);
  }

  /** What the select shows: a preset name, or the Custom sentinel. */
  get selectedColorOption(): string {
    return this.isPresetSelected ? this.subscriptionForm.value.color : this.CUSTOM_COLOR;
  }

  /** The native picker only understands #rrggbb, so fall back for anything else. */
  get customColorValue(): string {
    const color = this.subscriptionForm.value.color;
    return /^#[0-9a-f]{6}$/i.test(color) ? color : ModalAddSubscriptionComponent.DEFAULT_CUSTOM_COLOR;
  }

  get previewContrastHex(): string {
    return contrastHexFor(this.subscriptionForm.value.color);
  }

  onColorOptionChange(option: string) {
    // Switching to Custom seeds a colour so the tile has something to show
    // straight away; picking a preset writes the preset name through unchanged.
    this.subscriptionForm.patchValue({
      color: option === this.CUSTOM_COLOR ? this.customColorValue : option,
    });
  }

  onCustomColorPicked(color: string) {
    this.subscriptionForm.patchValue({ color });
  }

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
    this.setupColorPicker();

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
