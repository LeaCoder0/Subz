import { SearchSubscriptionsPipe } from './search-subscriptions.pipe';
import { makeSubscription } from './subscription.fixture';

describe('SearchSubscriptionsPipe', () => {
  const pipe = new SearchSubscriptionsPipe();
  const netflix = makeSubscription({ id: 1, name: 'Netflix', description: 'Streaming' });
  const rent = makeSubscription({ id: 2, name: 'Rent', description: 'Flat' });
  const noDescription = makeSubscription({ id: 3, name: 'EPF', description: undefined });
  const subscriptions = [netflix, rent, noDescription];

  it('returns everything when the filter is empty', () => {
    expect(pipe.transform(subscriptions, '')).toBe(subscriptions);
  });

  it('matches on name, case-insensitively', () => {
    expect(pipe.transform(subscriptions, 'netflix')).toEqual([netflix]);
    expect(pipe.transform(subscriptions, 'NETFLIX')).toEqual([netflix]);
  });

  it('matches on description too', () => {
    expect(pipe.transform(subscriptions, 'streaming')).toEqual([netflix]);
  });

  it('matches partial words', () => {
    expect(pipe.transform(subscriptions, 'fli')).toEqual([netflix]);
  });

  it('does not blow up on a subscription without a description', () => {
    expect(pipe.transform(subscriptions, 'epf')).toEqual([noDescription]);
  });

  it('returns an empty list when nothing matches', () => {
    expect(pipe.transform(subscriptions, 'zzz')).toEqual([]);
  });
});
