import { Injectable, inject } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Share } from '@capacitor/share';
import { ISubscription } from '../tab-overview/Interfaces/subscriptionInterface';
import { IBook } from '../books/Interfaces/bookInterface';
import { ISettings } from '../tab-settings/Interfaces/settingsInterface';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

const BACKUP_FILE_NAME = 'subz-backup.json';

/** Name given to the book that pre-books data is migrated into. */
const DEFAULT_BOOK_NAME_PREFIX = 'Book No. ';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private toastController = inject(ToastController);
  private translateService = inject(TranslateService);

  /**
   * The in-flight (or completed) migration. Cached as a promise rather than a
   * boolean because several callers race at startup -- BooksPage and
   * NotificationService both read subscriptions immediately -- and a boolean
   * flag lets the second caller read before the first has finished writing.
   */
  private migration?: Promise<void>;

  defaultSettings: ISettings = {
    hideOverviewHelperTextGeneral: false,
    hideOverviewHelperTextMenuBar: false
  }

  /**
   * All subscriptions, or only one book's when `bookId` is given.
   * NotificationService deliberately calls this without a bookId, because
   * reminders are device-level and should not depend on the open book.
   */
  async retrieveSubscriptionsFromStorage(bookId?: number): Promise<ISubscription[]> {
    await this.migrateToBooks();

    const entries = await Preferences.get({ key: 'subscriptions' });
    const all: ISubscription[] = entries.value ? JSON.parse(entries.value) : [];

    return bookId === undefined ? all : all.filter(entry => entry.bookId === bookId);
  }

  /**
   * Persists one book's subscriptions without disturbing the other books'.
   * The overview only ever holds the entries of the book it is showing.
   */
  async saveBookSubscriptionsToStorage(bookId: number, entries: ISubscription[]) {
    const all = await this.retrieveSubscriptionsFromStorage();
    const others = all.filter(entry => entry.bookId !== bookId);

    await this.saveSubscriptionsToStorage(others.concat(entries.map(entry => ({ ...entry, bookId }))));
  }

  async saveSubscriptionsToStorage(entries: ISubscription[]) {
    await Preferences.set({
      key: 'subscriptions',
      value: JSON.stringify(entries)
    });
  }

  async retrieveSettingsFromStorage(): Promise<ISettings> {
    const settingsString = await Preferences.get({ key: 'settings' });
    if (settingsString.value) {
      return JSON.parse(settingsString.value);
    } else {
      return this.defaultSettings;
    }
  }

  async saveSettingsToStorage(settings: ISettings) {
    await Preferences.set({
      key: 'settings',
      value: JSON.stringify(settings)
    });
  }

  // ---------------------------------------------------------------- books ----

  async retrieveBooksFromStorage(): Promise<IBook[]> {
    await this.migrateToBooks();

    const books = await Preferences.get({ key: 'books' });
    const parsed: IBook[] = books.value ? JSON.parse(books.value) : [];

    return parsed.sort((a, b) => a.order - b.order);
  }

  async saveBooksToStorage(books: IBook[]) {
    await Preferences.set({ key: 'books', value: JSON.stringify(books) });
  }

  /**
   * Default name is one past the highest `Book No. N` already used, rather than
   * `count + 1`, so deleting a book in the middle cannot produce a duplicate name.
   */
  async createBook(name?: string): Promise<IBook> {
    const books = await this.retrieveBooksFromStorage();
    const now = Date.now();

    const book: IBook = {
      id: this.generateId(books.map(existing => existing.id)),
      name: name?.trim() || this.nextDefaultBookName(books),
      order: books.length,
      created: now,
      lastEdited: now,
    };

    await this.saveBooksToStorage(books.concat(book));
    return book;
  }

  async renameBook(bookId: number, name: string) {
    const books = await this.retrieveBooksFromStorage();
    const book = books.find(candidate => candidate.id === bookId);

    if (!book || !name.trim()) { return; }

    book.name = name.trim();
    book.lastEdited = Date.now();
    await this.saveBooksToStorage(books);
  }

  /** Deleting a book takes its subscriptions with it. */
  async deleteBook(bookId: number) {
    const books = (await this.retrieveBooksFromStorage()).filter(book => book.id !== bookId);
    books.forEach((book, index) => book.order = index);
    await this.saveBooksToStorage(books);

    const remaining = (await this.retrieveSubscriptionsFromStorage()).filter(entry => entry.bookId !== bookId);
    await this.saveSubscriptionsToStorage(remaining);
  }

  /** Persists the given order; the array's position becomes each book's `order`. */
  async reorderBooks(books: IBook[]) {
    books.forEach((book, index) => book.order = index);
    await this.saveBooksToStorage(books);
  }

  private nextDefaultBookName(books: IBook[]): string {
    const used = books
      .map(book => new RegExp(`^${DEFAULT_BOOK_NAME_PREFIX}(\\d+)$`).exec(book.name))
      .filter(match => match !== null)
      .map(match => Number(match[1]));

    return DEFAULT_BOOK_NAME_PREFIX + (used.length ? Math.max(...used) + 1 : 1);
  }

  /** Same scheme as the overview uses for subscription ids. */
  private generateId(taken: number[]): number {
    let id: number;
    do { id = Math.floor((Math.random() * 999999999999) + 1); } while (taken.includes(id));
    return id;
  }

  /**
   * Moves pre-books data into a single default book. Guarded on the `books` key,
   * so it runs once and every later call is a no-op.
   */
  private migrateToBooks(): Promise<void> {
    this.migration ??= this.runBooksMigration();
    return this.migration;
  }

  private async runBooksMigration(): Promise<void> {
    const existing = await Preferences.get({ key: 'books' });
    if (existing.value) { return; }

    const now = Date.now();
    const book: IBook = {
      id: this.generateId([]),
      name: DEFAULT_BOOK_NAME_PREFIX + '1',
      order: 0,
      created: now,
      lastEdited: now,
    };
    await this.saveBooksToStorage([book]);

    const entries = await Preferences.get({ key: 'subscriptions' });
    const all: ISubscription[] = entries.value ? JSON.parse(entries.value) : [];

    await this.saveSubscriptionsToStorage(
      all.map(entry => entry.bookId === undefined ? { ...entry, bookId: book.id } : entry));
  }

  // ------------------------------------------------------------- backups ----

  /**
   * Backup format v2: every book in one file. A v1 backup (no `books` key, as
   * written by the upstream F-Droid app) is still accepted on restore.
   */
  async getAllData(): Promise<string> {
    const books = await this.retrieveBooksFromStorage();
    const entries = await this.retrieveSubscriptionsFromStorage();
    const set = await this.retrieveSettingsFromStorage();

    const backup = {
      books,
      subscriptions: entries,
      settings: set
    };

    return JSON.stringify(backup);
  }

  /**
   * Writes the backup to the app's own cache -- which needs no storage
   * permission -- and hands it to the system share sheet, so the user chooses
   * where it ends up. Writing straight to /Documents stopped being possible at
   * targetSdk 30.
   */
  async backupAllDataAndroid() {
    const backup = await this.getAllData();

    try {
      const { uri } = await Filesystem.writeFile({
        path: BACKUP_FILE_NAME,
        data: backup,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      await Share.share({ title: BACKUP_FILE_NAME, files: [uri] });
    } catch (e) {
      if (this.isUserCancellation(e)) { return; }

      this.translateService.get('TABS.SETTINGS.BACKUP_ERROR').subscribe(BACKUP_ERROR => {
        this.toastMessage(BACKUP_ERROR);
      });
    }
  }

  /**
   * Imports a backup through the system file picker. Since targetSdk 30 the app
   * can no longer read shared storage directly, so the user grants access to the
   * single file they pick -- which is also what makes importing a backup written
   * by a different app (such as an older install) work.
   */
  async restoreAllDataAndroid(mergeWithCurrent?: boolean) {
    let backup: string;

    try {
      // Deliberately unfiltered: file managers report .json as anything from
      // application/json to application/octet-stream, and a type filter that
      // hides the user's own backup is a worse failure than a longer list.
      const { files } = await FilePicker.pickFiles({ limit: 1, readData: true });
      const file = files[0];

      if (!file?.data) { return; }

      backup = this.decodeBase64(file.data);
    } catch (e) {
      if (this.isUserCancellation(e)) { return; }

      this.translateService.get('TABS.SETTINGS.RESTORE_BACKUP_ERROR_ANDROID').subscribe(RESTORE_BACKUP_ERROR_ANDROID => {
        this.toastMessage(RESTORE_BACKUP_ERROR_ANDROID);
      });
      return;
    }

    // restoreAllData reports its own success and failure
    await this.restoreAllData(backup, mergeWithCurrent);
  }

  /** The picker returns file contents base64-encoded; decode as UTF-8. */
  private decodeBase64(data: string): string {
    return new TextDecoder().decode(Uint8Array.from(atob(data), character => character.charCodeAt(0)));
  }

  /** Backing out of the share sheet or the file picker is not an error. */
  private isUserCancellation(e: unknown): boolean {
    const message = (e instanceof Error ? e.message : String(e)).toLowerCase();
    return message.includes('cancel') || message.includes('abort');
  }

  /**
   * Restores passed data
   * @param backup Backup data which shall be restored like { subscriptions: ISubscription[], settings: ISettings }
   * @param mergeWithCurrent If true, backup and current subscriptions will be merged by their id, keeps newer
   * subscription if lastEdited property is present, else keeps the backup subscription
   */
  async restoreAllData(backup: string, mergeWithCurrent?: boolean) {
    let backupObject: { books?: IBook[], subscriptions: ISubscription[], settings: ISettings };
    try {
      backupObject = JSON.parse(backup);

      if (!backupObject.hasOwnProperty('subscriptions') && !backupObject.hasOwnProperty('settings')) {
        throw Error;
      }

      // BOOKS
      let books: IBook[] = backupObject.books ?? [];
      const importedBookIds = new Set<number>();

      for (const book of books) {
        const isValid = 'id' in book && typeof book.id === 'number' &&
                        'name' in book && typeof book.name === 'string' &&
                        'order' in book && typeof book.order === 'number';
        if (!isValid) { throw Error; }
      }

      // SUBSCRIPTIONS
      let subscriptions: ISubscription[] = backupObject.subscriptions;
      let isValid = true;

      for (const subscription of subscriptions) {
        // Mandatory fields
        isValid = 'id' in subscription && typeof subscription.id === 'number' &&
                  'name' in subscription && typeof subscription.name === 'string' &&
                  'cost' in subscription && typeof subscription.cost === 'number' &&
                  'color' in subscription && typeof subscription.color === 'string' &&
                  'billingStart' in subscription && typeof subscription.billingStart === 'string' &&
                  'billingEvery' in subscription && typeof subscription.billingEvery === 'number' &&
                  'billingInterval' in subscription && typeof subscription.billingInterval === 'string' &&
                  'contractStart' in subscription && typeof subscription.contractStart === 'string' &&
                  'minimumContractDuration' in subscription && typeof subscription.minimumContractDuration === 'number' &&
                  'minimumContractDurationInterval' in subscription && typeof subscription.minimumContractDurationInterval === 'string' &&
                  'extensionAfterMinimumContractDurationEvery' in subscription
                    && typeof subscription.extensionAfterMinimumContractDurationEvery === 'number' &&
                  'extensionAfterMinimumContractDurationInterval' in subscription
                    && typeof subscription.extensionAfterMinimumContractDurationInterval === 'string' &&
                  'cancelationPeriodEvery' in subscription && typeof subscription.cancelationPeriodEvery === 'number' &&
                  'cancelationPeriodInterval' in subscription && typeof subscription.cancelationPeriodInterval === 'string';
        if (!isValid) { throw Error; }

        // Optional fields
        if ('description' in subscription) { this.throwErrorHelper(typeof subscription.description !== 'string'); }
        if ('notificationBeforeCancelationPeriodInDays' in subscription) {
          this.throwErrorHelper(typeof subscription.notificationBeforeCancelationPeriodInDays !== 'number'
            && typeof subscription.notificationBeforeCancelationPeriodInDays !== 'object');
        }
        if ('lastEdited' in subscription) {
          this.throwErrorHelper(typeof subscription.lastEdited !== 'number' && typeof subscription.lastEdited !== 'object'); }
        if ('created' in subscription) {
          this.throwErrorHelper(typeof subscription.created !== 'number' && typeof subscription.created !== 'object'); }
      }

      // SETTINGS
      const settings: ISettings = backupObject.settings;

      if ('forceDarkMode' in settings) { this.throwErrorHelper(typeof settings.forceDarkMode !== 'boolean'); }
      if ('currency' in settings) { this.throwErrorHelper(typeof settings.currency !== 'string'); }
      if ('dateFormat' in settings) { this.throwErrorHelper(typeof settings.dateFormat !== 'string'); }
      if ('notificationBeforeCancelationPeriodInDays' in settings) {
        // Can be null, so it can be an object
        this.throwErrorHelper(typeof settings.notificationBeforeCancelationPeriodInDays !== 'number'
          && typeof settings.notificationBeforeCancelationPeriodInDays !== 'object');
      }
      if ('defaultBillingInterval' in settings) { this.throwErrorHelper(typeof settings.defaultBillingInterval !== 'string'); }
      if ('defaultSortBy' in settings) { this.throwErrorHelper(typeof settings.defaultSortBy !== 'string'); }
      if ('hideOverviewHelperTextGeneral' in settings) {
        this.throwErrorHelper(typeof settings.hideOverviewHelperTextGeneral !== 'boolean'); }
      if ('hideOverviewHelperTextMenuBar' in settings) {
        this.throwErrorHelper(typeof settings.hideOverviewHelperTextMenuBar !== 'boolean'); }

      // A v1 backup carries no books, so everything it holds becomes one book.
      // Its name follows the same rule as a manually created book, which keeps
      // it distinct from any book already present when merging.
      if (books.length === 0) {
        const existingBooks = mergeWithCurrent ? await this.retrieveBooksFromStorage() : [];
        const now = Date.now();
        const importedBook: IBook = {
          id: this.generateId(existingBooks.map(book => book.id)),
          name: this.nextDefaultBookName(existingBooks),
          order: existingBooks.length,
          created: now,
          lastEdited: now,
        };
        books = existingBooks.concat(importedBook);
        importedBookIds.add(importedBook.id);

        // When merging, an entry the app already has keeps the book it is in --
        // importing a backup should not silently relocate existing entries and
        // leave their original book empty. Only genuinely new entries land in
        // the imported book.
        const currentBookIdByEntryId = new Map<number, number>(
          (mergeWithCurrent ? await this.retrieveSubscriptionsFromStorage() : [])
            .map(current => [current.id, current.bookId]));

        subscriptions = subscriptions.map(sub => ({
          ...sub,
          bookId: currentBookIdByEntryId.get(sub.id) ?? importedBook.id,
        }));
      } else if (mergeWithCurrent) {
        const currentBooks = await this.retrieveBooksFromStorage();
        const restoredIds = new Set(books.map(book => book.id));
        books = books.concat(currentBooks.filter(book => !restoredIds.has(book.id)));
        books.forEach((book, index) => book.order = index);
      }

      // Merge current subscriptions with backup based on id
      if (mergeWithCurrent) {
        const currentSubscriptions = await this.retrieveSubscriptionsFromStorage();

        for (let currentSubscription of currentSubscriptions) {
          // Check if subscription with same id is present in backup and current subscriptions
          let backupSubscriptionIndex = subscriptions.findIndex(sub => sub.id === currentSubscription.id);

          if (backupSubscriptionIndex !== -1) {
            // Check which subscription will be kept based on lastEdited date (4 cases)

            // 1. Case: Both have lastEdited, so use the one with newer date
            if (currentSubscription.lastEdited && subscriptions[backupSubscriptionIndex].lastEdited) {

              if (currentSubscription.lastEdited > subscriptions[backupSubscriptionIndex].lastEdited) {
                subscriptions[backupSubscriptionIndex] = currentSubscription;
              }
              // Otherwise nothing todo, as backup subscription is used

            }
            // 2. Case: Only current subscription has lastEdited (= is newer)
            else if (currentSubscription.lastEdited && !subscriptions[backupSubscriptionIndex].lastEdited) {
              subscriptions[backupSubscriptionIndex] = currentSubscription;
            }
            // 3. Case: Only backup subscription has lastEdited (= is newer)
            else if (!currentSubscription.lastEdited && subscriptions[backupSubscriptionIndex].lastEdited) {
              // Nothing todo, as backup subscription is used
            }
            // 4. Case: Both don't have lastEdited, use the backup one
            else if (!currentSubscription.lastEdited && !subscriptions[backupSubscriptionIndex].lastEdited) {
              // Nothing todo, as backup subscription is used
            }
            else {
              // Invalid case
              throw Error;
            }
          } else {
            // Current subscription can just be appended
            subscriptions.push(currentSubscription);
          }
        }
      }

      // An imported book that nothing landed in would just be clutter
      const usedBookIds = new Set(subscriptions.map(sub => sub.bookId));
      books = books.filter(book => usedBookIds.has(book.id) || !importedBookIds.has(book.id));
      books.forEach((book, index) => book.order = index);

      await this.saveBooksToStorage(books);
      await this.saveSubscriptionsToStorage(subscriptions);
      await this.saveSettingsToStorage(settings);

      this.translateService.get('TABS.SETTINGS.RESTORE_BACKUP_SUCCESS').subscribe(RESTORE_BACKUP_SUCCESS => {
        this.toastMessage(RESTORE_BACKUP_SUCCESS);
      });
    } catch (exception) {
      this.translateService.get('TABS.SETTINGS.RESTORE_BACKUP_ERROR').subscribe(RESTORE_BACKUP_ERROR => {
        this.toastMessage(RESTORE_BACKUP_ERROR);
      });
    }
  }

  throwErrorHelper(boolVar: boolean) {
    if (boolVar) { throw Error; }
  }

  async toastMessage(toastMessage: string) {
    const toast = await this.toastController.create({
      cssClass: 'toast-center-text',
      message: toastMessage,
      duration: 3000
    });
    toast.present();
  }
}
