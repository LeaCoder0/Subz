import { Pipe, PipeTransform, inject } from '@angular/core';
import { NextCancelationPeriodDeadlinePipe } from './next-cancelation-period-deadline.pipe';
import { ISubscription } from '../Interfaces/subscriptionInterface';

@Pipe({
  name: 'notificationTimeForNextCancelationPeriodDeadline'
})
export class NotificationTimeForNextCancelationPeriodDeadlinePipe implements PipeTransform {
  private nextCancelationPeriodDeadlinePipe = inject(NextCancelationPeriodDeadlinePipe);


  transform(subscription: ISubscription): { dueDate: Date, inDaysFromToday: number } {
    const notifyInDaysPrior = subscription.notificationBeforeCancelationPeriodInDays;
    if (notifyInDaysPrior) {
      if (!this.nextCancelationPeriodDeadlinePipe.transform(subscription)) { return null; }
      const dueDate = this.nextCancelationPeriodDeadlinePipe.transform(subscription).dueDate;
      dueDate.setDate(dueDate.getDate() - notifyInDaysPrior);

      const inDaysFromToday = this.nextCancelationPeriodDeadlinePipe.transform(subscription).inDaysFromToday - notifyInDaysPrior;

      return { dueDate: dueDate, inDaysFromToday: inDaysFromToday };
    } else { return null; }
  }

}
