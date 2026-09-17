import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { addIcons } from 'ionicons';
import { arrowBack } from 'ionicons/icons';
import { TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { App } from '@capacitor/app';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonText, IonTitle, IonToolbar, Platform } from '@ionic/angular';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  imports: [IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonText, IonTitle, IonToolbar, RouterLink, TranslatePipe, NgIf],
})
export class AboutPage implements OnInit {
  version: string;

  constructor(
    private platform: Platform
  ) {
    addIcons({ arrowBack });
 }

  ngOnInit() {
    this.platform.ready().then(() => {
      if (this.platform.is('android')) {
        App.getInfo().then(appInfo => {
          this.version = appInfo.version;
        });
      }
      else if (this.platform.is('mobileweb')) {
        // Don't show version
      }
    });
  }

}
