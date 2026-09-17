import { Pipe, PipeTransform, inject } from '@angular/core';
import { ISubscription } from '../Interfaces/subscriptionInterface';
import { NextBillingPipe } from './next-billing.pipe';
import { NextCancelationPeriodDeadlinePipe } from './next-cancelation-period-deadline.pipe';
import { CostByBillingIntervalPipe } from './cost-by-billing-interval.pipe';
import { billingIntervals } from '../BILLING_INTERVALS';

@Pipe({
  name: 'sortSubscriptions'
})
export class SortSubscriptionsPipe implements PipeTransform {
  private costByBillingIntervalPipe = inject(CostByBillingIntervalPipe);
  private nextBillingPipe = inject(NextBillingPipe);
  private nextCancelationPeriodDeadlinePipe = inject(NextCancelationPeriodDeadlinePipe);

  availableBillingIntervals = billingIntervals;

  transform(subscriptions: ISubscription[], filterBy: string): ISubscription[] {
    if (!subscriptions) { return null; }
    if (!filterBy) { return subscriptions; }

    switch (filterBy) {
      case 'nameAsc': {
        return subscriptions.sort(this.sortByNameAsc);
      }
      case 'nameDesc': {
        return subscriptions.sort(this.sortByNameDesc);
      }
      case 'costAsc': {
        return subscriptions.sort((a, b) => {
          if (this.costByBillingIntervalPipe.transform(a, this.availableBillingIntervals[0]) <
          this.costByBillingIntervalPipe.transform(b, this.availableBillingIntervals[0])){
            return -1;
          }
          if (this.costByBillingIntervalPipe.transform(a, this.availableBillingIntervals[0]) >
          this.costByBillingIntervalPipe.transform(b, this.availableBillingIntervals[0])){
            return 1;
          }
          return 0;
        });
      }
      case 'costDesc': {
        return subscriptions.sort((a, b) => {
          if (this.costByBillingIntervalPipe.transform(a, this.availableBillingIntervals[0]) >
          this.costByBillingIntervalPipe.transform(b, this.availableBillingIntervals[0])){
            return -1;
          }
          if (this.costByBillingIntervalPipe.transform(a, this.availableBillingIntervals[0]) <
          this.costByBillingIntervalPipe.transform(b, this.availableBillingIntervals[0])){
            return 1;
          }
          return 0;
        });
      }
      case 'nextBillingAsc': {
        return subscriptions.sort((a, b) => {
          if (this.nextBillingPipe.transform(a).inDaysFromToday < this.nextBillingPipe.transform(b).inDaysFromToday){
            return -1;
          }
          if (this.nextBillingPipe.transform(a).inDaysFromToday > this.nextBillingPipe.transform(b).inDaysFromToday){
            return 1;
          }
          return 0;
        });
      }
      case 'nextBillingDesc': {
        return subscriptions.sort((a, b) => {
          if (this.nextBillingPipe.transform(a).inDaysFromToday > this.nextBillingPipe.transform(b).inDaysFromToday){
            return -1;
          }
          if (this.nextBillingPipe.transform(a).inDaysFromToday < this.nextBillingPipe.transform(b).inDaysFromToday){
            return 1;
          }
          return 0;
        });
      }
      case 'nextContractExtensionAsc': {
        let subscriptionsWithoutProperty = subscriptions.filter(sub => this.nextCancelationPeriodDeadlinePipe.transform(sub) === null);
        subscriptionsWithoutProperty = subscriptionsWithoutProperty.sort(this.sortByNameAsc);

        subscriptions = subscriptions.filter(sub => this.nextCancelationPeriodDeadlinePipe.transform(sub) !== null);

        subscriptions = subscriptions.sort((a, b) => {
          if (!this.nextCancelationPeriodDeadlinePipe.transform(a) || !this.nextCancelationPeriodDeadlinePipe.transform(b)) {
            return this.sortByNameAsc(a, b);
          }

          if (this.nextCancelationPeriodDeadlinePipe.transform(a).inDaysFromToday
            < this.nextCancelationPeriodDeadlinePipe.transform(b).inDaysFromToday){
            return -1;
          }
          if (this.nextCancelationPeriodDeadlinePipe.transform(a).inDaysFromToday
            > this.nextCancelationPeriodDeadlinePipe.transform(b).inDaysFromToday){
            return 1;
          }
          return 0;
        });

        return subscriptions.concat(subscriptionsWithoutProperty);
      }
      case 'nextContractExtensionDesc': {
        let subscriptionsWithoutProperty = subscriptions.filter(sub => this.nextCancelationPeriodDeadlinePipe.transform(sub) === null);
        subscriptionsWithoutProperty = subscriptionsWithoutProperty.sort(this.sortByNameAsc);

        subscriptions = subscriptions.filter(sub => this.nextCancelationPeriodDeadlinePipe.transform(sub) !== null);

        subscriptions = subscriptions.sort((a, b) => {
          if (!this.nextCancelationPeriodDeadlinePipe.transform(a) || !this.nextCancelationPeriodDeadlinePipe.transform(b)) {
            return this.sortByNameAsc(a, b);
          }

          if (this.nextCancelationPeriodDeadlinePipe.transform(a).inDaysFromToday
            > this.nextCancelationPeriodDeadlinePipe.transform(b).inDaysFromToday){
            return -1;
          }
          if (this.nextCancelationPeriodDeadlinePipe.transform(a).inDaysFromToday
            < this.nextCancelationPeriodDeadlinePipe.transform(b).inDaysFromToday){
            return 1;
          }
          return 0;
        });

        return subscriptions.concat(subscriptionsWithoutProperty);
      }
      default: {
        return subscriptions;
      }
    }
  }

  sortByNameAsc(a: ISubscription, b: ISubscription) {
    if (a.name.toLowerCase() < b.name.toLowerCase()){
      return -1;
    }
    if (a.name.toLowerCase() > b.name.toLowerCase()){
      return 1;
    }
    return 0;
  }

  sortByNameDesc(a: ISubscription, b: ISubscription) {
    if (a.name.toLowerCase() < b.name.toLowerCase()){
      return 1;
    }
    if (a.name.toLowerCase() > b.name.toLowerCase()){
      return -1;
    }
    return 0;
  }

}
