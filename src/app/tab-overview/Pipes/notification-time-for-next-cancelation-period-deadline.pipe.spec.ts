import { TestBed } from '@angular/core/testing';
import { NotificationTimeForNextCancelationPeriodDeadlinePipe } from './notification-time-for-next-cancelation-period-deadline.pipe';
import { NextCancelationPeriodDeadlinePipe } from './next-cancelation-period-deadline.pipe';
import { makeSubscription } from './subscription.fixture';

describe('NotificationTimeForNextCancelationPeriodDeadlinePipe', () => {
  let pipe: NotificationTimeForNextCancelationPeriodDeadlinePipe;
  let deadlinePipe: NextCancelationPeriodDeadlinePipe;

  const extending = {
    contractStart: '2020-01-01',
    minimumContractDuration: 1,
    minimumContractDurationInterval: 'YEARS' as const,
    extensionAfterMinimumContractDurationEvery: 1,
    extensionAfterMinimumContractDurationInterval: 'YEARS' as const,
    cancelationPeriodEvery: 3,
    cancelationPeriodInterval: 'MONTHS' as const,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NextCancelationPeriodDeadlinePipe, NotificationTimeForNextCancelationPeriodDeadlinePipe],
    });
    pipe = TestBed.inject(NotificationTimeForNextCancelationPeriodDeadlinePipe);
    deadlinePipe = TestBed.inject(NextCancelationPeriodDeadlinePipe);
  });

  it('returns null when no notification lead time is set', () => {
    const sub = makeSubscription({ ...extending, notificationBeforeCancelationPeriodInDays: undefined });
    expect(pipe.transform(sub)).toBeNull();
  });

  it('returns null when the contract has no cancellation deadline at all', () => {
    const sub = makeSubscription({
      extensionAfterMinimumContractDurationEvery: 0,
      notificationBeforeCancelationPeriodInDays: 14,
    });
    expect(pipe.transform(sub)).toBeNull();
  });

  it('fires the given number of days before the cancellation deadline', () => {
    const sub = makeSubscription({ ...extending, notificationBeforeCancelationPeriodInDays: 14 });
    const deadline = deadlinePipe.transform(sub);
    const result = pipe.transform(sub);

    expect(result.inDaysFromToday).toBe(deadline.inDaysFromToday - 14);
  });
});
