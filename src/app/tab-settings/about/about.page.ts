import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import { arrowBack } from 'ionicons/icons';
import { NgIf } from '@angular/common';
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
  private changeDetectorRef = inject(ChangeDetectorRef);
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
          this.changeDetectorRef.detectChanges();
        });
      }
      else if (this.platform.is('mobileweb')) {
        // Don't show version
      }
    });
  }

}
