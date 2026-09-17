import { Pipe, PipeTransform } from '@angular/core';
import { ISubscription } from '../Interfaces/subscriptionInterface';

@Pipe({
  name: 'nextCancelationPeriodDeadline'
})
export class NextCancelationPeriodDeadlinePipe implements PipeTransform {
  MS_PER_DAY = 1000 * 60 * 60 * 24;

  constructor() {}

  transform(subscription: ISubscription): {dueDate: Date, inDaysFromToday: number} {
    // The task is to nofity the user for upcoming contract extensions, if there isn't any, there is no point in showing something
    if (!subscription.extensionAfterMinimumContractDurationEvery) { return null; }

    const today = new Date();
    const contractStart = new Date(subscription.contractStart);

    // Calculate at first: contractStart + minimumContractDuration
    let nextContractExtension = this.calculateDates(contractStart, '+', subscription.minimumContractDuration, subscription.minimumContractDurationInterval);

    // If nextContractExtension - cancelationPeriod < today : Then we have found our date!
    if (this.dateDiffInDays(today, this.calculateDates(nextContractExtension, '-', subscription.cancelationPeriodEvery, subscription.cancelationPeriodInterval)) > 0) {
      const lastPossibleCancelationDate = this.calculateDates(nextContractExtension, '-', subscription.cancelationPeriodEvery, subscription.cancelationPeriodInterval);
      return { dueDate: lastPossibleCancelationDate, inDaysFromToday: this.dateDiffInDays(today, lastPossibleCancelationDate) };
    }
    else {
      do {
        // Add contract extension to date
        nextContractExtension = this.calculateDates(nextContractExtension, '+', subscription.extensionAfterMinimumContractDurationEvery, subscription.extensionAfterMinimumContractDurationInterval);
      } while (this.dateDiffInDays(today, this.calculateDates(nextContractExtension, '-', subscription.cancelationPeriodEvery, subscription.cancelationPeriodInterval)) < 0);
    }

    // Substract cancellation period from the next contract extension
    const lastPossibleCancelationDate = this.calculateDates(nextContractExtension, '-', subscription.cancelationPeriodEvery, subscription.cancelationPeriodInterval);

    return { dueDate: lastPossibleCancelationDate, inDaysFromToday: this.dateDiffInDays(today, lastPossibleCancelationDate) };
  }

  dateDiffInDays(a: Date, b: Date): number {
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 - utc1) / this.MS_PER_DAY);
  }

  /**
   * Adds or substracts days/weeks/months/years to/from a specified date
   * @param startDate The base date from which the calculation begins
   * @param operation Whether you want to add ("+") or substract ("-") the time
   * @param value How much of the intervalType you want to add or substract
   * @param intervalType "DAYS" || "WEEKS" || "MONTHS" || "YEARS"
   * @returns startDate + / - value of intervalType
   */
  calculateDates(startDate: Date, operation: string, value: number, intervalType: string): Date {
    let date = new Date(startDate);

    function calculate(a: number, operator: string, b: number): number {
      if (operator === '+') { return a + b; }
      else if (operator === '-') { return a - b; }
      throw new Error(`Unsupported operator: ${operator}`);
    }

    switch (intervalType) {
      case 'DAYS': {
        date.setDate(calculate(date.getDate(), operation, Number(value)));
        break;
      }
      case 'WEEKS': {
        date.setDate(calculate(date.getDate(), operation, Number(value * 7)));
        break;
      }
      case 'MONTHS': {
        date.setMonth(calculate(date.getMonth(), operation, Number(value)));
        break;
      }
      case 'YEARS': {
        date.setFullYear(calculate(date.getFullYear(), operation, Number(value)));
        break;
      }
      default: {
        return null;
      }
    }

    return date;
  }
}
