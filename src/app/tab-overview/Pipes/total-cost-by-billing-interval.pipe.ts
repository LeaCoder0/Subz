import { Pipe, PipeTransform, inject } from '@angular/core';
import { ISubscription } from '../Interfaces/subscriptionInterface';
import { CostByBillingIntervalPipe } from './cost-by-billing-interval.pipe';

@Pipe({
  name: 'totalCostByBillingInterval',
  pure: false // Otherwise a new added subscription wouldn't get added to the total cost directly
})
export class TotalCostByBillingIntervalPipe implements PipeTransform {
  private costByBillingIntervalPipe = inject(CostByBillingIntervalPipe);


  transform(subscriptions: ISubscription[], selectedBillingIntervalName: string): number {
    let totalCost = 0;

    if (!subscriptions) { return totalCost; }

    for (const subscription of subscriptions) {
      totalCost += this.costByBillingIntervalPipe.transform(subscription, selectedBillingIntervalName);
    }

    return totalCost;
  }

}
