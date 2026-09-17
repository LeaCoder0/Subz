import { Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { archive, arrowBack, refresh } from 'ionicons/icons';
import { RouterLink } from '@angular/router';
import { AlertController, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonTitle, IonToolbar, Platform } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { StorageService } from '../../Services/storage.service';
import { ThemeService } from '../../Services/theme.service';

@Component({
  selector: 'app-data-management',
  templateUrl: './data-management.page.html',
  styleUrls: ['./data-management.page.scss'],
  imports: [IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonTitle, IonToolbar, RouterLink, TranslatePipe],
})
export class DataManagementPage implements OnInit {

  constructor(
    public alertController: AlertController,
    private storageService: StorageService,
    public themeService: ThemeService,
    public translateService: TranslateService,
    private platform: Platform,
  ) {
    addIcons({ archive, arrowBack, refresh });
 }

  ngOnInit() {
  }

  async backup(): Promise<void> {
    this.platform.ready().then(() => {
      if (this.platform.is('android')) {
        this.storageService.backupAllDataAndroid();
      }
      else if (this.platform.is('mobileweb')) {
        this.backupWeb();
      }
    });
  }

  async backupWeb(): Promise<void> {
    const alertStrings: any = {};

    this.translateService.get('GENERAL.CANCEL').subscribe(CANCEL => {
      alertStrings.cancel = CANCEL;
    });
    this.translateService.get('TABS.SETTINGS.BACKUP').subscribe(BACKUP => {
      alertStrings.header = BACKUP;
    });
    this.translateService.get('TABS.SETTINGS.COPY_TO_CLIPBOARD').subscribe(COPY_TO_CLIPBOARD => {
      alertStrings.copyToClipboard = COPY_TO_CLIPBOARD;
    });

    const alert = await this.alertController.create({
      cssClass: 'alert-full-width',
      header: alertStrings.header,
      message: await this.storageService.getAllData(),
      buttons: [
        {
          text: alertStrings.cancel,
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: alertStrings.copyToClipboard,
          cssClass: 'secondary',
          handler: async () => {
            this.copyTextToClipboard(await this.storageService.getAllData());
        }
      }]
    });

    await alert.present();
  }

  async restore(): Promise<void> {
    this.platform.ready().then(() => {
      if (this.platform.is('android')) {
        this.restoreAndroid();
      }
      else if (this.platform.is('mobileweb')) {
        this.restoreWeb();
      }
    });
  }

  async restoreAndroid(): Promise<void> {
    const alertStrings: any = {};

    this.translateService.get('TABS.SETTINGS.RESTORE').subscribe(RESTORE => {
      alertStrings.header = RESTORE;
    });
    this.translateService.get('TABS.SETTINGS.RESTORE_BACKUP_ALERT_MESSAGE').subscribe(RESTORE_BACKUP_ALERT_MESSAGE => {
      alertStrings.message = RESTORE_BACKUP_ALERT_MESSAGE;
    });
    this.translateService.get('GENERAL.CANCEL').subscribe(CANCEL => {
      alertStrings.cancel = CANCEL;
    });
    this.translateService.get('TABS.SETTINGS.RESTORE_BACKUP_REPLACE').subscribe(RESTORE_BACKUP_REPLACE => {
      alertStrings.restoreBackupReplace = RESTORE_BACKUP_REPLACE;
    });
    this.translateService.get('TABS.SETTINGS.RESTORE_BACKUP_MERGE').subscribe(RESTORE_BACKUP_MERGE => {
      alertStrings.restoreBackupMerge = RESTORE_BACKUP_MERGE;
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
          text: alertStrings.restoreBackupReplace,
          handler: () => {
            this.storageService.restoreAllDataAndroid().then(() => {
              this.themeService.applyTheme();
            });
          }
        }, {
          text: alertStrings.restoreBackupMerge,
          handler: () => {
            this.storageService.restoreAllDataAndroid(true).then(() => {
              this.themeService.applyTheme();
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async restoreWeb(): Promise<void> {
    const alertStrings: any = {};

    this.translateService.get('TABS.SETTINGS.RESTORE').subscribe(RESTORE => {
      alertStrings.header = RESTORE;
    });
    this.translateService.get('TABS.SETTINGS.RESTORE_BACKUP_ALERT_MESSAGE').subscribe(RESTORE_BACKUP_ALERT_MESSAGE => {
      alertStrings.message = RESTORE_BACKUP_ALERT_MESSAGE;
    });
    this.translateService.get('GENERAL.CANCEL').subscribe(CANCEL => {
      alertStrings.cancel = CANCEL;
    });
    this.translateService.get('TABS.SETTINGS.BACKUP_DATA').subscribe(BACKUP_DATA => {
      alertStrings.backupData = BACKUP_DATA;
    });
    this.translateService.get('TABS.SETTINGS.RESTORE_BACKUP_REPLACE').subscribe(RESTORE_BACKUP_REPLACE => {
      alertStrings.restoreBackupReplace = RESTORE_BACKUP_REPLACE;
    });
    this.translateService.get('TABS.SETTINGS.RESTORE_BACKUP_MERGE').subscribe(RESTORE_BACKUP_MERGE => {
      alertStrings.restoreBackupMerge = RESTORE_BACKUP_MERGE;
    });

    const alert = await this.alertController.create({
      cssClass: 'alert-full-width',
      header: alertStrings.header,
      message: alertStrings.message,
      inputs: [
        {
          name: 'restore',
          type: 'textarea',
          placeholder: alertStrings.backupData
        }
      ],
      buttons: [
        {
          text: alertStrings.cancel,
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: alertStrings.restoreBackupReplace,
          cssClass: 'secondary',
          handler: async (inputs) => {
            await this.storageService.restoreAllData(inputs.restore).then(() => {
              this.themeService.applyTheme();
            });
          }
        }, {
          text: alertStrings.restoreBackupMerge,
          cssClass: 'secondary',
          handler: async (inputs) => {
            await this.storageService.restoreAllData(inputs.restore, true).then(() => {
              this.themeService.applyTheme();
            });
          }
        }
      ]
    });

    await alert.present();
  }

  copyTextToClipboard(val: string){
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

}
