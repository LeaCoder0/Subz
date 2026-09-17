import { Provider } from '@angular/core';

import { CostByBillingIntervalPipe } from './cost-by-billing-interval.pipe';
import { NextBillingPipe } from './next-billing.pipe';
import { NextCancelationPeriodDeadlinePipe } from './next-cancelation-period-deadline.pipe';
import { NotificationTimeForNextCancelationPeriodDeadlinePipe } from './notification-time-for-next-cancelation-period-deadline.pipe';
import { SearchSubscriptionsPipe } from './search-subscriptions.pipe';
import { SortSubscriptionsPipe } from './sort-subscriptions.pipe';
import { TotalCostByBillingIntervalPipe } from './total-cost-by-billing-interval.pipe';

/**
 * These pipes are used as template pipes *and* as injected collaborators:
 * SortSubscriptionsPipe and TotalCostByBillingIntervalPipe depend on
 * CostByBillingIntervalPipe, NotificationService injects two of them, and
 * SubscriptionCardComponent injects three. Listing a pipe in a standalone
 * component's `imports` only makes it usable in that template -- it does not
 * make it resolvable through DI, so they are registered here as well.
 */
export const SUBSCRIPTION_PIPE_PROVIDERS: Provider[] = [
  CostByBillingIntervalPipe,
  NextBillingPipe,
  NextCancelationPeriodDeadlinePipe,
  NotificationTimeForNextCancelationPeriodDeadlinePipe,
  SearchSubscriptionsPipe,
  SortSubscriptionsPipe,
  TotalCostByBillingIntervalPipe,
];
