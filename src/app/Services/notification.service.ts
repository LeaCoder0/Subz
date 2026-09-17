import { Injectable, inject } from '@angular/core';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { StorageService } from './storage.service';
import { ISubscription } from '../tab-overview/Interfaces/subscriptionInterface';
import { TranslateService } from '@ngx-translate/core';
import { NextCancelationPeriodDeadlinePipe } from '../tab-overview/Pipes/next-cancelation-period-deadline.pipe';
import { NotificationTimeForNextCancelationPeriodDeadlinePipe } from '../tab-overview/Pipes/notification-time-for-next-cancelation-period-deadline.pipe';
import { formatDate } from '@angular/common';

// Gets triggered 1) on entering the app component 2) after persisting subscriptions

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private storageService = inject(StorageService);
  private translateService = inject(TranslateService);
  private nextCancelationPeriodDeadlinePipe = inject(NextCancelationPeriodDeadlinePipe);
  private notificationTimeForNextCancelationPeriodDeadline = inject(NotificationTimeForNextCancelationPeriodDeadlinePipe);


  async scheduleNotifications() {
    const subscriptions: ISubscription[] = await this.storageService.retrieveSubscriptionsFromStorage();

    LocalNotifications.getPending().then(pending => {

      // Delete all pending notifications
      if (pending.notifications.length > 0) {
        LocalNotifications.cancel(pending);
      }

      // If there are subscriptions, (re)schedule the notifications
      if (subscriptions) {
        let notificationsToSchedule: LocalNotificationSchema[] = [];

        for (const subscription of subscriptions) {
          // Make a number out of it because empty attributes may saved as string
          const notificationBeforeCancelationPeriodInDays = Number(subscription.notificationBeforeCancelationPeriodInDays);

          // Go to next subscription if there is no alarm set
          if (!notificationBeforeCancelationPeriodInDays) { continue; }

          // Go to next subscription if there isn't any deadline
          if (!this.nextCancelationPeriodDeadlinePipe.transform(subscription)) { continue; }

          const scheduleAtDate = this.notificationTimeForNextCancelationPeriodDeadline.transform(subscription).dueDate;
          const nextCancelationPeriodDeadlineDate = this.nextCancelationPeriodDeadlinePipe.transform(subscription).dueDate;

          // If scheduleAt is in the past, don't schedule and go check next subscription
          if (scheduleAtDate < new Date()) { continue; }

          // Instants are safe because this service is called in app.component after i18n initialization
          const NOTIFICATION_TITLE = this.translateService.instant('NOTIFICATIONS.NOTIFICATION_TITLE')
            .replace('$NAME$', subscription.name)
            .replace('$DATE$', formatDate(nextCancelationPeriodDeadlineDate, 'mediumDate', this.translateService.currentLang()));
          const NOTIFICATION_BODY = this.translateService.instant('NOTIFICATIONS.NOTIFICATION_BODY')
            .replace('$NAME$', subscription.name)
            .replace('$DATE$', formatDate(nextCancelationPeriodDeadlineDate, 'mediumDate', this.translateService.currentLang()));

          const notification: LocalNotificationSchema = {
            id: Number(subscription.id),
            title: NOTIFICATION_TITLE,
            body: NOTIFICATION_BODY,
            schedule: { at: scheduleAtDate }
          };

          notificationsToSchedule.push(notification);
        }

        if (notificationsToSchedule.length !== 0) {
          LocalNotifications.schedule({ notifications: notificationsToSchedule });
        }
      }

    });
  }

}
