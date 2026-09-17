import { NextBillingPipe } from './next-billing.pipe';
import { makeSubscription, daysFromToday } from './subscription.fixture';

describe('NextBillingPipe', () => {
  const pipe = new NextBillingPipe();

  it('rolls a long-past monthly start forward to a future date', () => {
    const sub = makeSubscription({ billingStart: '2020-01-01', billingEvery: 1, billingInterval: 'MONTHS' });
    const result = pipe.transform(sub);

    expect(result.inDaysFromToday).toBeGreaterThan(0);
    expect(result.dueDate.getDate()).toBe(1);   // monthly billing keeps the day of month
  });

  it('reports the number of days until the next billing', () => {
    const sub = makeSubscription({ billingStart: daysFromToday(-20), billingEvery: 1, billingInterval: 'MONTHS' });
    const result = pipe.transform(sub);

    expect(result.inDaysFromToday).toBeGreaterThan(0);
    expect(result.inDaysFromToday).toBeLessThanOrEqual(31);
  });

  it('treats a start date already in the future as the next billing', () => {
    const sub = makeSubscription({ billingStart: daysFromToday(10), billingEvery: 1, billingInterval: 'MONTHS' });
    expect(pipe.transform(sub).inDaysFromToday).toBe(10);
  });

  it('steps by the billing frequency for daily billing', () => {
    const sub = makeSubscription({ billingStart: daysFromToday(-10), billingEvery: 7, billingInterval: 'DAYS' });
    expect(pipe.transform(sub).inDaysFromToday).toBe(4);   // -10 +7 +7 = +4
  });

  it('steps a week at a time for weekly billing', () => {
    const sub = makeSubscription({ billingStart: daysFromToday(-10), billingEvery: 1, billingInterval: 'WEEKS' });
    expect(pipe.transform(sub).inDaysFromToday).toBe(4);
  });

  it('returns null when billingEvery is 0, rather than looping forever', () => {
    const sub = makeSubscription({ billingEvery: 0 });
    expect(pipe.transform(sub)).toBeNull();
  });

  it('returns null for an unknown interval', () => {
    const sub = makeSubscription({ billingInterval: 'FORTNIGHTS' as never });
    expect(pipe.transform(sub)).toBeNull();
  });
});
