import { CostByBillingIntervalPipe } from './cost-by-billing-interval.pipe';
import { makeSubscription } from './subscription.fixture';

describe('CostByBillingIntervalPipe', () => {
  const pipe = new CostByBillingIntervalPipe();

  it('leaves a cost alone when the intervals match', () => {
    const sub = makeSubscription({ cost: 30, billingEvery: 1, billingInterval: 'MONTHS' });
    expect(pipe.transform(sub, 'MONTHS')).toBe(30);
  });

  it('converts monthly to yearly by multiplying by 12, not by 365/30', () => {
    const sub = makeSubscription({ cost: 10, billingEvery: 1, billingInterval: 'MONTHS' });
    expect(pipe.transform(sub, 'YEARS')).toBe(120);
  });

  it('converts yearly to monthly by dividing by 12', () => {
    const sub = makeSubscription({ cost: 120, billingEvery: 1, billingInterval: 'YEARS' });
    expect(pipe.transform(sub, 'MONTHS')).toBe(10);
  });

  it('divides by the billing frequency', () => {
    const sub = makeSubscription({ cost: 90, billingEvery: 3, billingInterval: 'MONTHS' });
    expect(pipe.transform(sub, 'MONTHS')).toBe(30);
  });

  it('converts weekly to daily', () => {
    const sub = makeSubscription({ cost: 70, billingEvery: 1, billingInterval: 'WEEKS' });
    expect(pipe.transform(sub, 'DAYS')).toBe(10);
  });

  it('keeps negative costs negative', () => {
    const sub = makeSubscription({ cost: -5400, billingEvery: 1, billingInterval: 'MONTHS' });
    expect(pipe.transform(sub, 'YEARS')).toBe(-64800);
  });

  it('returns 0 rather than dividing by zero when billingEvery is 0', () => {
    const sub = makeSubscription({ cost: 100, billingEvery: 0 });
    expect(pipe.transform(sub, 'MONTHS')).toBe(0);
  });

  it('returns null for an unknown target interval', () => {
    const sub = makeSubscription({ billingInterval: 'MONTHS' });
    expect(pipe.transform(sub, 'DECADES')).toBeNull();
  });
});
