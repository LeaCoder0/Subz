import { TestBed } from '@angular/core/testing';
import { SortSubscriptionsPipe } from './sort-subscriptions.pipe';
import { CostByBillingIntervalPipe } from './cost-by-billing-interval.pipe';
import { NextBillingPipe } from './next-billing.pipe';
import { NextCancelationPeriodDeadlinePipe } from './next-cancelation-period-deadline.pipe';
import { makeSubscription, daysFromToday } from './subscription.fixture';

describe('SortSubscriptionsPipe', () => {
  let pipe: SortSubscriptionsPipe;

  const names = (subs: { name: string }[]) => subs.map(s => s.name);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CostByBillingIntervalPipe,
        NextBillingPipe,
        NextCancelationPeriodDeadlinePipe,
        SortSubscriptionsPipe,
      ],
    });
    pipe = TestBed.inject(SortSubscriptionsPipe);
  });

  it('passes the list through when no sort is selected', () => {
    const subscriptions = [makeSubscription({ name: 'B' }), makeSubscription({ name: 'A' })];
    expect(pipe.transform(subscriptions, '')).toBe(subscriptions);
  });

  it('returns null when subscriptions are not loaded yet', () => {
    expect(pipe.transform(null, 'nameAsc')).toBeNull();
  });

  it('sorts by name ascending, ignoring case', () => {
    const subscriptions = [
      makeSubscription({ id: 1, name: 'rent' }),
      makeSubscription({ id: 2, name: 'EPF' }),
      makeSubscription({ id: 3, name: 'Salary' }),
    ];
    expect(names(pipe.transform(subscriptions, 'nameAsc'))).toEqual(['EPF', 'rent', 'Salary']);
  });

  it('sorts by name descending', () => {
    const subscriptions = [
      makeSubscription({ id: 1, name: 'EPF' }),
      makeSubscription({ id: 2, name: 'Salary' }),
    ];
    expect(names(pipe.transform(subscriptions, 'nameDesc'))).toEqual(['Salary', 'EPF']);
  });

  it('sorts by cost descending, so income comes before expenses', () => {
    const subscriptions = [
      makeSubscription({ id: 1, name: 'Rent', cost: -10000 }),
      makeSubscription({ id: 2, name: 'Salary', cost: 81000 }),
      makeSubscription({ id: 3, name: 'EPF', cost: -5400 }),
    ];
    expect(names(pipe.transform(subscriptions, 'costDesc'))).toEqual(['Salary', 'EPF', 'Rent']);
  });

  it('sorts by cost ascending', () => {
    const subscriptions = [
      makeSubscription({ id: 1, name: 'Salary', cost: 81000 }),
      makeSubscription({ id: 2, name: 'Rent', cost: -10000 }),
    ];
    expect(names(pipe.transform(subscriptions, 'costAsc'))).toEqual(['Rent', 'Salary']);
  });

  it('compares cost on a common interval, not on the raw figure', () => {
    // 120/year is 10/month, so the yearly one is the cheaper of the two.
    const subscriptions = [
      makeSubscription({ id: 1, name: 'Yearly', cost: 120, billingEvery: 1, billingInterval: 'YEARS' }),
      makeSubscription({ id: 2, name: 'Monthly', cost: 50, billingEvery: 1, billingInterval: 'MONTHS' }),
    ];
    expect(names(pipe.transform(subscriptions, 'costAsc'))).toEqual(['Yearly', 'Monthly']);
  });

  it('sorts by next billing date ascending', () => {
    const subscriptions = [
      makeSubscription({ id: 1, name: 'Later', billingStart: daysFromToday(20), billingInterval: 'MONTHS' }),
      makeSubscription({ id: 2, name: 'Sooner', billingStart: daysFromToday(3), billingInterval: 'MONTHS' }),
    ];
    expect(names(pipe.transform(subscriptions, 'nextBillingAsc'))).toEqual(['Sooner', 'Later']);
  });

  it('pushes contracts without a cancellation deadline to the end, sorted by name', () => {
    const extending = {
      contractStart: '2020-01-01',
      minimumContractDuration: 1,
      minimumContractDurationInterval: 'YEARS' as const,
      extensionAfterMinimumContractDurationEvery: 1,
      extensionAfterMinimumContractDurationInterval: 'YEARS' as const,
    };
    const subscriptions = [
      makeSubscription({ id: 1, name: 'NoDeadlineB' }),
      makeSubscription({ id: 2, name: 'HasDeadline', ...extending }),
      makeSubscription({ id: 3, name: 'NoDeadlineA' }),
    ];
    expect(names(pipe.transform(subscriptions, 'nextContractExtensionAsc')))
      .toEqual(['HasDeadline', 'NoDeadlineA', 'NoDeadlineB']);
  });
});
