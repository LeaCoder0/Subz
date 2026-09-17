import { Component } from '@angular/core';
import { addIcons } from 'ionicons';
import { documentText, documents, easel, globe, informationCircle } from 'ionicons/icons';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-tab-settings',
  templateUrl: 'tab-settings.page.html',
  styleUrls: ['tab-settings.page.scss'],
  imports: [IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonTitle, IonToolbar, RouterLink, TranslatePipe],
})
export class TabSettingsPage {

  constructor() {
    addIcons({ documentText, documents, easel, globe, informationCircle });
 }

}
