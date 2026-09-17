import { test, expect, Page } from '@playwright/test';

/**
 * Each test gets its own browser context, so localStorage -- which is where
 * Capacitor Preferences lands on the web -- already starts empty.
 */
async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('app-books')).toBeVisible();
}

/** Opens the first book, which the migration creates as "Book No. 1". */
async function openFirstBook(page: Page) {
  await page.locator('app-books ion-item').first().click();
  await expect(page.locator('app-tab-overview')).toBeVisible();
}

async function addSubscription(page: Page, name: string, cost: string) {
  await page.locator('app-tab-overview ion-buttons[slot="end"] ion-button').last().click();
  const modal = page.locator('app-modal-add-subscription');
  await expect(modal).toBeVisible();

  await modal.locator('ion-input[formControlName="name"] input').fill(name);
  await modal.locator('ion-input[formControlName="cost"] input').fill(cost);
  await modal.locator('ion-buttons[slot="end"] ion-button').click();   // save
  await expect(modal).toBeHidden();
}

async function confirmAlert(page: Page, buttonText: RegExp) {
  const alert = page.locator('ion-alert');
  await expect(alert).toBeVisible();
  await alert.locator('button').filter({ hasText: buttonText }).click();
  await expect(alert).toBeHidden();
}

test.describe('Books', () => {
  test('lands on the books list with a default book', async ({ page }) => {
    await openApp(page);
    await expect(page.locator('app-books ion-item')).toHaveCount(1);
    await expect(page.locator('app-books ion-item').first()).toContainText('Book No. 1');
  });

  test('creates a second book named one past the last', async ({ page }) => {
    await openApp(page);
    await page.locator('app-books ion-buttons[slot="end"] ion-button').last().click();

    await expect(page.locator('app-tab-overview')).toBeVisible();   // opens the new book
    await page.locator('app-tab-overview ion-buttons[slot="start"] ion-button').click();

    await expect(page.locator('app-books ion-item')).toHaveCount(2);
    await expect(page.locator('app-books ion-item').nth(1)).toContainText('Book No. 2');
  });

  test('renames a book', async ({ page }) => {
    await openApp(page);
    await page.locator('app-books ion-item').first().locator('ion-button').first().click();

    const alert = page.locator('ion-alert');
    await expect(alert).toBeVisible();
    await alert.locator('input').fill('Household');
    await alert.locator('button').filter({ hasText: /ok/i }).click();

    await expect(page.locator('app-books ion-item').first()).toContainText('Household');
  });

  test('deletes a book', async ({ page }) => {
    await openApp(page);
    await page.locator('app-books ion-buttons[slot="end"] ion-button').last().click();
    await page.locator('app-tab-overview ion-buttons[slot="start"] ion-button').click();
    await expect(page.locator('app-books ion-item')).toHaveCount(2);

    await page.locator('app-books ion-item').nth(1).locator('ion-button').nth(1).click();
    await confirmAlert(page, /delete/i);

    await expect(page.locator('app-books ion-item')).toHaveCount(1);
  });

  test('keeps each book\'s entries separate', async ({ page }) => {
    await openApp(page);
    await openFirstBook(page);
    await addSubscription(page, 'Rent', '-1000');
    await expect(page.locator('app-subscription-card')).toHaveCount(1);

    // back to books, into a fresh book
    await page.locator('app-tab-overview ion-buttons[slot="start"] ion-button').click();
    await page.locator('app-books ion-buttons[slot="end"] ion-button').last().click();
    await expect(page.locator('app-tab-overview')).toBeVisible();

    await expect(page.locator('app-subscription-card')).toHaveCount(0);
    await addSubscription(page, 'Netflix', '-10');
    await expect(page.locator('app-subscription-card')).toHaveCount(1);
    await expect(page.locator('app-subscription-card')).toContainText('Netflix');

    // the first book still has only its own entry
    await page.locator('app-tab-overview ion-buttons[slot="start"] ion-button').click();
    await openFirstBook(page);
    await expect(page.locator('app-subscription-card')).toHaveCount(1);
    await expect(page.locator('app-subscription-card')).toContainText('Rent');
  });
});

test.describe('Overview', () => {
  test('starts empty and titles the page Overview', async ({ page }) => {
    await openApp(page);
    await openFirstBook(page);
    await expect(page.locator('app-subscription-card')).toHaveCount(0);
    await expect(page.locator('app-tab-overview ion-title')).toContainText('Overview');
  });

  test('adds a subscription and shows it in the list', async ({ page }) => {
    await openApp(page);
    await openFirstBook(page);
    await addSubscription(page, 'Netflix', '10');

    await expect(page.locator('app-subscription-card')).toHaveCount(1);
    await expect(page.locator('app-subscription-card')).toContainText('Netflix');
  });

  test('adds up costs into the header total', async ({ page }) => {
    await openApp(page);
    await openFirstBook(page);
    await addSubscription(page, 'Rent', '-1000');
    await addSubscription(page, 'Salary', '3000');

    await expect(page.locator('app-subscription-card')).toHaveCount(2);
    await expect(page.locator('app-tab-overview ion-title')).toContainText('2,000');
  });

  test('keeps subscriptions across a reload', async ({ page }) => {
    await openApp(page);
    await openFirstBook(page);
    await addSubscription(page, 'Spotify', '5');

    await page.reload();
    await expect(page.locator('app-subscription-card')).toContainText('Spotify');
  });
});

test.describe('Settings', () => {
  test('is reachable from the books screen, not from inside a book', async ({ page }) => {
    await openApp(page);
    await page.locator('app-books ion-buttons[slot="end"] ion-button').first().click();

    await expect(page.locator('app-tab-settings')).toBeVisible();
    await page.locator('app-tab-settings ion-item').filter({ hasText: /data/i }).click();
    await expect(page.locator('app-data-management')).toBeVisible();
    await expect(page.locator('app-data-management ion-item')).toHaveCount(2);
  });
});
