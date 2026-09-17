import { NextCancelationPeriodDeadlinePipe } from './next-cancelation-period-deadline.pipe';
import { makeSubscription } from './subscription.fixture';

describe('NextCancelationPeriodDeadlinePipe', () => {
  const pipe = new NextCancelationPeriodDeadlinePipe();

  it('returns null when the contract never auto-extends', () => {
    const sub = makeSubscription({ extensionAfterMinimumContractDurationEvery: 0 });
    expect(pipe.transform(sub)).toBeNull();
  });

  it('subtracts the cancellation period from the next contract extension', () => {
    const sub = makeSubscription({
      contractStart: '2020-01-01',
      minimumContractDuration: 1,
      minimumContractDurationInterval: 'YEARS',
      extensionAfterMinimumContractDurationEvery: 1,
      extensionAfterMinimumContractDurationInterval: 'YEARS',
      cancelationPeriodEvery: 3,
      cancelationPeriodInterval: 'MONTHS',
    });
    const result = pipe.transform(sub);

    // Extensions land on 1 January; the deadline is three months earlier.
    expect(result.dueDate.getMonth()).toBe(9);   // October
    expect(result.dueDate.getDate()).toBe(1);
    expect(result.inDaysFromToday).toBeGreaterThan(0);
  });

  it('keeps extending until the deadline is in the future', () => {
    const sub = makeSubscription({
      contractStart: '2020-01-01',
      minimumContractDuration: 1,
      minimumContractDurationInterval: 'MONTHS',
      extensionAfterMinimumContractDurationEvery: 1,
      extensionAfterMinimumContractDurationInterval: 'MONTHS',
      cancelationPeriodEvery: 0,
      cancelationPeriodInterval: 'MONTHS',
    });
    expect(pipe.transform(sub).inDaysFromToday).toBeGreaterThan(0);
  });

  describe('calculateDates', () => {
    it('adds and subtracts each supported interval', () => {
      const base = new Date('2020-01-15T00:00:00');

      expect(pipe.calculateDates(base, '+', 10, 'DAYS').getDate()).toBe(25);
      expect(pipe.calculateDates(base, '-', 10, 'DAYS').getDate()).toBe(5);
      expect(pipe.calculateDates(base, '+', 1, 'WEEKS').getDate()).toBe(22);
      expect(pipe.calculateDates(base, '+', 2, 'MONTHS').getMonth()).toBe(2);
      expect(pipe.calculateDates(base, '+', 1, 'YEARS').getFullYear()).toBe(2021);
    });

    it('does not mutate the date it is given', () => {
      const base = new Date('2020-01-15T00:00:00');
      pipe.calculateDates(base, '+', 10, 'DAYS');
      expect(base.getDate()).toBe(15);
    });

    it('returns null for an unknown interval', () => {
      expect(pipe.calculateDates(new Date(), '+', 1, 'DECADES')).toBeNull();
    });

    it('rejects an unsupported operator instead of silently returning NaN', () => {
      expect(() => pipe.calculateDates(new Date(), '*', 1, 'DAYS')).toThrow();
    });
  });
});
