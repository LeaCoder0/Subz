import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import { arrowBack, calendar, cash } from 'ionicons/icons';
import { NgFor } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { StorageService } from '../../Services/storage.service';
import { ThemeService } from '../../Services/theme.service';
import { ISettings } from '../Interfaces/settingsInterface';
import { currencies } from './CURRENCIES';
import { dateFormats } from './DATE_FORMATS';

@Component({
  selector: 'app-region',
  templateUrl: './region.page.html',
  styleUrls: ['./region.page.scss'],
  imports: [IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonSelect, IonSelectOption, IonTitle, IonToolbar, ReactiveFormsModule, RouterLink, TranslatePipe, NgFor],
})
export class RegionPage implements OnInit {
  private changeDetectorRef = inject(ChangeDetectorRef);
  settingsForm: FormGroup;
  retrievedSettings: ISettings;
  currencyList = currencies;
  dateFormatList = dateFormats;
  settingsFormChangeSubscription: Subscription;

  constructor(
    private formBuilder: FormBuilder,
    private storageService: StorageService,
    public themeService: ThemeService) {
    addIcons({ arrowBack, calendar, cash });


    this.settingsForm = this.formBuilder.group({
      currency: this.currencyList[0],
      dateFormat: this.dateFormatList[0],
    });
  }

  ngOnInit() {
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

}
