import { Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { arrowBack } from 'ionicons/icons';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular';
import { licenseText } from './Helpers/mit-license-text';

@Component({
  selector: 'app-license',
  templateUrl: './license.page.html',
  styleUrls: ['./license.page.scss'],
  imports: [IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, RouterLink, TranslatePipe],
})
export class LicensePage implements OnInit {
  licenseText = licenseText;

  constructor() {
    addIcons({ arrowBack });
 }

  ngOnInit() {
  }

}
