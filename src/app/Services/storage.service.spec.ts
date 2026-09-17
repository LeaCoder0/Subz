import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Preferences } from '@capacitor/preferences';
import { StorageService } from './storage.service';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { makeSubscription } from '../tab-overview/Pipes/subscription.fixture';

/**
 * Capacitor exposes Preferences as a proxy, so its methods are not own
 * properties and cannot be spied on -- the whole module is replaced instead.
 */
vi.mock('@capacitor/preferences', () => {
  const store = new Map<string, string>();
  // A real bridge call yields to the task queue, so the stub does too --
  // otherwise concurrent callers never interleave and races stay hidden.
  const yieldToQueue = () => new Promise(resolve => setTimeout(resolve, 0));

  return {
    Preferences: {
      get: async ({ key }: { key: string }) => {
        await yieldToQueue();
        return { value: store.has(key) ? store.get(key) : null };
      },
      set: async ({ key, value }: { key: string; value: string }) => {
        await yieldToQueue();
        store.set(key, value);
      },
      remove: async ({ key }: { key: string }) => { store.delete(key); },
      clear: async () => { store.clear(); },
      __store: store,
    },
  };
});

describe('StorageService books', () => {
  let service: StorageService;
  const store = (Preferences as unknown as { __store: Map<string, string> }).__store;

  const read = <T>(key: string): T => JSON.parse(store.get(key));

  beforeEach(() => {
    store.clear();
    TestBed.configureTestingModule({
      providers: [
        StorageService,
        { provide: ToastController, useValue: { create: async () => ({ present: async () => undefined }) } },
        { provide: TranslateService, useValue: { get: () => of(''), instant: (k: string) => k } },
      ],
    });
    service = TestBed.inject(StorageService);
  });

  describe('migration from pre-books data', () => {
    it('moves existing entries into a single default book', async () => {
      store.set('subscriptions', JSON.stringify([
        makeSubscription({ id: 1, name: 'Rent' }),
        makeSubscription({ id: 2, name: 'Salary' }),
      ]));

      const books = await service.retrieveBooksFromStorage();

      expect(books).toHaveLength(1);
      expect(books[0].name).toBe('Book No. 1');
      expect(read<{ bookId: number }[]>('subscriptions').every(s => s.bookId === books[0].id)).toBe(true);
    });

    it('is a no-op the second time', async () => {
      store.set('subscriptions', JSON.stringify([makeSubscription({ id: 1 })]));

      const first = await service.retrieveBooksFromStorage();
      const second = await service.retrieveBooksFromStorage();

      expect(second).toHaveLength(1);
      expect(second[0].id).toBe(first[0].id);
    });

    it('makes a caller that arrives mid-migration wait for it', async () => {
      // The real sequence: NotificationService starts the migration on app start,
      // then BooksPage reads a moment later. Guarding with a boolean set before
      // the subscriptions were written let BooksPage read the un-migrated array,
      // so the books screen showed a total of 0 against real data.
      store.set('subscriptions', JSON.stringify([
        makeSubscription({ id: 1, name: 'Rent' }),
        makeSubscription({ id: 2, name: 'Salary' }),
      ]));

      const firstReader = service.retrieveSubscriptionsFromStorage();
      await new Promise(resolve => setTimeout(resolve, 0));   // let it get under way

      const lateReader = await service.retrieveSubscriptionsFromStorage();
      await firstReader;

      expect(lateReader).toHaveLength(2);
      expect(lateReader.every(entry => entry.bookId !== undefined)).toBe(true);
    });

    it('creates an empty default book when there is no data at all', async () => {
      expect(await service.retrieveBooksFromStorage()).toHaveLength(1);
      expect(await service.retrieveSubscriptionsFromStorage()).toEqual([]);
    });
  });

  describe('book CRUD', () => {
    it('names new books one past the highest number already used', async () => {
      const first = await service.retrieveBooksFromStorage();   // Book No. 1
      const second = await service.createBook();
      expect(second.name).toBe('Book No. 2');

      // deleting the middle book must not let the next one reuse its name
      await service.deleteBook(first[0].id);
      expect((await service.createBook()).name).toBe('Book No. 3');
    });

    it('accepts an explicit name', async () => {
      expect((await service.createBook('Household')).name).toBe('Household');
    });

    it('renames a book, ignoring blank input', async () => {
      const book = (await service.retrieveBooksFromStorage())[0];

      await service.renameBook(book.id, '  Personal  ');
      expect((await service.retrieveBooksFromStorage())[0].name).toBe('Personal');

      await service.renameBook(book.id, '   ');
      expect((await service.retrieveBooksFromStorage())[0].name).toBe('Personal');
    });

    it('deletes a book together with its entries, leaving other books alone', async () => {
      const bookOne = (await service.retrieveBooksFromStorage())[0];
      const bookTwo = await service.createBook();

      await service.saveBookSubscriptionsToStorage(bookOne.id, [makeSubscription({ id: 1, name: 'Rent' })]);
      await service.saveBookSubscriptionsToStorage(bookTwo.id, [makeSubscription({ id: 2, name: 'Netflix' })]);

      await service.deleteBook(bookOne.id);

      expect(await service.retrieveBooksFromStorage()).toHaveLength(1);
      expect(await service.retrieveSubscriptionsFromStorage(bookTwo.id)).toHaveLength(1);
      expect(await service.retrieveSubscriptionsFromStorage()).toHaveLength(1);
    });

    it('persists the new positions on reorder', async () => {
      const first = (await service.retrieveBooksFromStorage())[0];
      const second = await service.createBook();

      await service.reorderBooks([second, first]);

      expect((await service.retrieveBooksFromStorage()).map(b => b.id)).toEqual([second.id, first.id]);
    });
  });

  describe('book scoping', () => {
    it('returns only the requested book, or everything when unscoped', async () => {
      const bookOne = (await service.retrieveBooksFromStorage())[0];
      const bookTwo = await service.createBook();

      await service.saveBookSubscriptionsToStorage(bookOne.id, [makeSubscription({ id: 1, name: 'Rent' })]);
      await service.saveBookSubscriptionsToStorage(bookTwo.id, [makeSubscription({ id: 2, name: 'Netflix' })]);

      expect((await service.retrieveSubscriptionsFromStorage(bookOne.id)).map(s => s.name)).toEqual(['Rent']);
      expect((await service.retrieveSubscriptionsFromStorage(bookTwo.id)).map(s => s.name)).toEqual(['Netflix']);
      expect(await service.retrieveSubscriptionsFromStorage()).toHaveLength(2);
    });

    it('saving one book does not disturb another', async () => {
      const bookOne = (await service.retrieveBooksFromStorage())[0];
      const bookTwo = await service.createBook();

      await service.saveBookSubscriptionsToStorage(bookOne.id, [makeSubscription({ id: 1, name: 'Rent' })]);
      await service.saveBookSubscriptionsToStorage(bookTwo.id, [makeSubscription({ id: 2, name: 'Netflix' })]);
      await service.saveBookSubscriptionsToStorage(bookTwo.id, []);

      expect(await service.retrieveSubscriptionsFromStorage(bookOne.id)).toHaveLength(1);
      expect(await service.retrieveSubscriptionsFromStorage(bookTwo.id)).toHaveLength(0);
    });
  });

  describe('backup', () => {
    it('exports every book in one file', async () => {
      const bookOne = (await service.retrieveBooksFromStorage())[0];
      const bookTwo = await service.createBook('Household');
      await service.saveBookSubscriptionsToStorage(bookOne.id, [makeSubscription({ id: 1, name: 'Rent' })]);
      await service.saveBookSubscriptionsToStorage(bookTwo.id, [makeSubscription({ id: 2, name: 'Netflix' })]);

      const backup = JSON.parse(await service.getAllData());

      expect(backup.books).toHaveLength(2);
      expect(backup.subscriptions).toHaveLength(2);
      expect(backup).toHaveProperty('settings');
    });

    it('imports a v1 backup (no books) as a single book', async () => {
      const v1 = JSON.stringify({
        subscriptions: [makeSubscription({ id: 1, name: 'Rent' }), makeSubscription({ id: 2, name: 'Salary' })],
        settings: { currency: '₹' },
      });

      await service.restoreAllData(v1);

      const books = await service.retrieveBooksFromStorage();
      expect(books).toHaveLength(1);
      expect((await service.retrieveSubscriptionsFromStorage(books[0].id))).toHaveLength(2);
    });

    it('merging a v1 backup leaves existing entries in their current book', async () => {
      const bookOne = (await service.retrieveBooksFromStorage())[0];
      const bookTwo = await service.createBook('Household');
      await service.saveBookSubscriptionsToStorage(bookOne.id, [makeSubscription({ id: 1, name: 'Rent' })]);
      await service.saveBookSubscriptionsToStorage(bookTwo.id, [makeSubscription({ id: 2, name: 'Netflix' })]);

      // a v1 backup holding one entry the app already has, plus one it does not
      const v1 = JSON.stringify({
        subscriptions: [makeSubscription({ id: 1, name: 'Rent' }), makeSubscription({ id: 3, name: 'Gym' })],
        settings: {},
      });

      await service.restoreAllData(v1, true);

      const byName = new Map((await service.retrieveSubscriptionsFromStorage()).map(s2 => [s2.name, s2.bookId]));
      expect(byName.get('Rent')).toBe(bookOne.id);        // not relocated
      expect(byName.get('Netflix')).toBe(bookTwo.id);     // untouched
      expect(byName.get('Gym')).not.toBe(bookOne.id);     // genuinely new -> imported book
      expect(await service.retrieveSubscriptionsFromStorage(bookOne.id)).toHaveLength(1);
    });

    it('does not leave an empty imported book behind', async () => {
      const bookOne = (await service.retrieveBooksFromStorage())[0];
      await service.saveBookSubscriptionsToStorage(bookOne.id, [makeSubscription({ id: 1, name: 'Rent' })]);

      // every entry in this backup already exists, so nothing needs a new book
      const v1 = JSON.stringify({ subscriptions: [makeSubscription({ id: 1, name: 'Rent' })], settings: {} });
      await service.restoreAllData(v1, true);

      expect(await service.retrieveBooksFromStorage()).toHaveLength(1);
    });

    it('round-trips a custom hex colour', async () => {
      const book = (await service.retrieveBooksFromStorage())[0];
      await service.saveBookSubscriptionsToStorage(book.id, [
        makeSubscription({ id: 1, name: 'Netflix', color: '#8a2be2' }),
      ]);

      const backup = await service.getAllData();
      store.clear();
      await service.restoreAllData(backup);

      expect((await service.retrieveSubscriptionsFromStorage())[0].color).toBe('#8a2be2');
    });

    it('rejects a backup whose entry has an empty colour', async () => {
      const broken = JSON.stringify({
        subscriptions: [makeSubscription({ id: 1, color: '' })],
        settings: {},
      });

      await service.restoreAllData(broken);

      // nothing imported; the default book stays empty
      expect(await service.retrieveSubscriptionsFromStorage()).toHaveLength(0);
    });

    it('round-trips a v2 backup', async () => {
      const bookOne = (await service.retrieveBooksFromStorage())[0];
      const bookTwo = await service.createBook('Household');
      await service.saveBookSubscriptionsToStorage(bookOne.id, [makeSubscription({ id: 1, name: 'Rent' })]);
      await service.saveBookSubscriptionsToStorage(bookTwo.id, [makeSubscription({ id: 2, name: 'Netflix' })]);

      const backup = await service.getAllData();
      store.clear();
      await service.restoreAllData(backup);

      const books = await service.retrieveBooksFromStorage();
      expect(books.map(b => b.name).sort()).toEqual(['Book No. 1', 'Household']);
      expect(await service.retrieveSubscriptionsFromStorage()).toHaveLength(2);
    });
  });
});
