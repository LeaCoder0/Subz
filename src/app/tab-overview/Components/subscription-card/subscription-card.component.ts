import { Component, Input } from '@angular/core';
import { DatePipe, DecimalPipe, LowerCasePipe, NgIf, SlicePipe, TitleCasePipe } from '@angular/common';
import { CostByBillingIntervalPipe } from '../../Pipes/cost-by-billing-interval.pipe';
import { NextBillingPipe } from '../../Pipes/next-billing.pipe';
import { NextCancelationPeriodDeadlinePipe } from '../../Pipes/next-cancelation-period-deadline.pipe';
import { NotificationTimeForNextCancelationPeriodDeadlinePipe } from '../../Pipes/notification-time-for-next-cancelation-period-deadline.pipe';
import { addIcons } from 'ionicons';
import { card, notifications, warning } from 'ionicons/icons';
import { ISubscription } from '../../Interfaces/subscriptionInterface';
import { IonCard, IonCardContent, IonChip, IonCol, IonGrid, IonIcon, IonLabel, IonRow, ToastController } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-subscription-card',
  templateUrl: './subscription-card.component.html',
  styleUrls: ['./subscription-card.component.scss'],
  imports: [IonCard, IonCardContent, IonChip, IonCol, IonGrid, IonIcon, IonLabel, IonRow, TranslatePipe, CostByBillingIntervalPipe, NextBillingPipe, NextCancelationPeriodDeadlinePipe, NotificationTimeForNextCancelationPeriodDeadlinePipe, DecimalPipe, LowerCasePipe, NgIf, SlicePipe, TitleCasePipe],
})
export class SubscriptionCardComponent {
  @Input() subscription: ISubscription;
  @Input() selectedBillingInterval: string;
  @Input() currency: string;

  constructor(
    private toastController: ToastController,
    private nextBillingPipe: NextBillingPipe,
    private nextCancelationPeriodDeadlinePipe: NextCancelationPeriodDeadlinePipe,
    private notificationTimeForNextCancelationPeriodDeadlinePipe: NotificationTimeForNextCancelationPeriodDeadlinePipe,
    public translateService: TranslateService) {
    addIcons({ card, notifications, warning });
 }

  explainNextBilling(event: Event, subscription: ISubscription) {
    event.stopPropagation();

    const nextBillingInDays = this.nextBillingPipe.transform(subscription).inDaysFromToday;
    const nextBillingDate = new DatePipe(this.translateService.currentLang()).transform(this.nextBillingPipe.transform(subscription).dueDate);

    this.translateService.get('TABS.OVERVIEW.DAYS_UNTIL_NEXT_BILLING_ON_HELPER').subscribe(DAYS_UNTIL_NEXT_BILLING_ON_HELPER => {
      this.toastMessage(nextBillingInDays + ' ' + DAYS_UNTIL_NEXT_BILLING_ON_HELPER + ' ' + nextBillingDate);
    });
  }

  explainNextCancelationPeriodDeadline(event: Event, subscription: ISubscription) {
    event.stopPropagation();

    const nextCancelationPeriodDeadlineInDays = this.nextCancelationPeriodDeadlinePipe.transform(subscription).inDaysFromToday;
    const nextCancelationPeriodDeadlineDate = new DatePipe(this.translateService.currentLang())
      .transform(this.nextCancelationPeriodDeadlinePipe
      .transform(subscription).dueDate);

    this.translateService.get('TABS.OVERVIEW.DAYS_UNTIL_NEXT_CANCELATION_PERIOD_DEADLINE_ON_HELPER').subscribe(
      DAYS_UNTIL_NEXT_CANCELATION_PERIOD_DEADLINE_ON_HELPER => {
      this.toastMessage(nextCancelationPeriodDeadlineInDays + ' ' + DAYS_UNTIL_NEXT_CANCELATION_PERIOD_DEADLINE_ON_HELPER + ' ' + nextCancelationPeriodDeadlineDate);
    });
  }

  explainAlarmForNextCancelationPeriodDeadline(event: Event, subscription: ISubscription) {
    event.stopPropagation();

    const alarmForNextCancelationPeriodDeadlineDate = new DatePipe(this.translateService.currentLang())
      .transform(this.notificationTimeForNextCancelationPeriodDeadlinePipe
      .transform(subscription).dueDate);

    this.translateService.get('TABS.OVERVIEW.NOTIFICATION_BEFORE_CANCELATION_PERIOD_STARTS_ON').subscribe(
      NOTIFICATION_BEFORE_CANCELATION_PERIOD_STARTS_ON => {
      this.toastMessage(NOTIFICATION_BEFORE_CANCELATION_PERIOD_STARTS_ON + ' ' + alarmForNextCancelationPeriodDeadlineDate);
    });
  }

  async toastMessage(helperText: string) {
    const toast = await this.toastController.create({
      cssClass: 'toast-center-text',
      message: helperText,
      duration: 3000
    });
    toast.present();
  }

}
