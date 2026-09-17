import { TestBed } from '@angular/core/testing';
import { TotalCostByBillingIntervalPipe } from './total-cost-by-billing-interval.pipe';
import { CostByBillingIntervalPipe } from './cost-by-billing-interval.pipe';
import { makeSubscription } from './subscription.fixture';

describe('TotalCostByBillingIntervalPipe', () => {
  let pipe: TotalCostByBillingIntervalPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CostByBillingIntervalPipe, TotalCostByBillingIntervalPipe],
    });
    pipe = TestBed.inject(TotalCostByBillingIntervalPipe);
  });

  it('returns 0 for an empty list', () => {
    expect(pipe.transform([], 'MONTHS')).toBe(0);
  });

  it('returns 0 rather than throwing when subscriptions are not loaded yet', () => {
    expect(pipe.transform(null, 'MONTHS')).toBe(0);
  });

  it('nets income against expenses', () => {
    const subscriptions = [
      makeSubscription({ id: 1, name: 'Salary', cost: 81000 }),
      makeSubscription({ id: 2, name: 'Rent', cost: -10000 }),
      makeSubscription({ id: 3, name: 'EPF', cost: -5400 }),
    ];
    expect(pipe.transform(subscriptions, 'MONTHS')).toBe(65600);
  });

  it('normalises mixed billing intervals to the selected one', () => {
    const subscriptions = [
      makeSubscription({ id: 1, cost: 120, billingEvery: 1, billingInterval: 'YEARS' }),
      makeSubscription({ id: 2, cost: 10, billingEvery: 1, billingInterval: 'MONTHS' }),
    ];
    expect(pipe.transform(subscriptions, 'MONTHS')).toBe(20);
  });

  it('is impure, so the total refreshes when the array is mutated', () => {
    expect(TotalCostByBillingIntervalPipe['ɵpipe'].pure).toBe(false);
  });
});
