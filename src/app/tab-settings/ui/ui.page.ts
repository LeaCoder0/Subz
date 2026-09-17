import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import { arrowBack, calendar, helpBuoy, moon } from 'ionicons/icons';
import { TranslatePipe } from '@ngx-translate/core';
import { IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonNote, IonTitle, IonToolbar } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { StorageService } from '../../Services/storage.service';
import { ThemeService } from '../../Services/theme.service';
import { ISettings } from '../Interfaces/settingsInterface';

@Component({
  selector: 'app-ui',
  templateUrl: './ui.page.html',
  styleUrls: ['./ui.page.scss'],
  imports: [IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonNote, IonTitle, IonToolbar, ReactiveFormsModule, RouterLink, TranslatePipe],
})
export class UiPage {
  private formBuilder = inject(FormBuilder);
  private storageService = inject(StorageService);
  themeService = inject(ThemeService);
  private router = inject(Router);

  private changeDetectorRef = inject(ChangeDetectorRef);
  settingsForm: FormGroup;
  retrievedSettings: ISettings;
  settingsFormChangeSubscription: Subscription;

  constructor() {
    addIcons({ arrowBack, calendar, helpBuoy, moon });



    this.settingsForm = this.formBuilder.group({
      forceDarkMode: false,
      notificationBeforeCancelationPeriodInDays: null
    });
  }

  ionViewWillEnter() {
    this.retrieveSettingsFromStorage().then(() => {
      this.listenForSettingsFormChanges();
    });
  }

  ionViewWillLeave() {
    this.settingsFormChangeSubscription.unsubscribe();
  }

  listenForSettingsFormChanges(): void {
    this.settingsFormChangeSubscription = this.settingsForm.valueChanges.subscribe(() => {
      this.saveSettingsToStorage();
    });
  }

  async saveSettingsToStorage(): Promise<void> {
    if (this.settingsForm.valid) {
      const settings: ISettings = Object.assign(this.retrievedSettings, this.settingsForm.value);

      this.storageService.saveSettingsToStorage(settings).then(() => {
        this.themeService.applyTheme();
      });
    }
  }

  async retrieveSettingsFromStorage(): Promise<void> {
    this.retrievedSettings = await this.storageService.retrieveSettingsFromStorage();
    this.changeDetectorRef.detectChanges();

    Object.keys(this.settingsForm.controls).forEach(key => {
      if (this.retrievedSettings.hasOwnProperty(key)) {
        this.settingsForm.patchValue({
          [key]: this.retrievedSettings[key]
        });
      }
    });
  }

  async showHelpTextsInOverview(): Promise<void> {
    this.retrievedSettings.hideOverviewHelperTextGeneral = false;
    this.retrievedSettings.hideOverviewHelperTextMenuBar = false;

    this.storageService.saveSettingsToStorage(this.retrievedSettings);
    this.router.navigate(['tabs/overview']);
  }

}
