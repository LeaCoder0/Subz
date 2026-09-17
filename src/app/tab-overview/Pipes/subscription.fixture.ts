import { ISubscription } from '../Interfaces/subscriptionInterface';

/**
 * A subscription with every mandatory field filled in, so a test only has to
 * state the fields it actually cares about.
 */
export function makeSubscription(overrides: Partial<ISubscription> = {}): ISubscription {
  return {
    id: 1,
    name: 'Test',
    description: '',
    cost: 100,
    color: 'BLUE',
    billingStart: '2020-01-01',
    billingEvery: 1,
    billingInterval: 'MONTHS',
    contractStart: '2020-01-01',
    minimumContractDuration: 0,
    minimumContractDurationInterval: 'YEARS',
    extensionAfterMinimumContractDurationEvery: 0,
    extensionAfterMinimumContractDurationInterval: 'MONTHS',
    cancelationPeriodEvery: 0,
    cancelationPeriodInterval: 'MONTHS',
    ...overrides,
  };
}

/** `YYYY-MM-DD` for a date the given number of days from today. */
export function daysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
