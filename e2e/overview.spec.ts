import { test, expect, Page } from '@playwright/test';

/**
 * Each test gets its own browser context, so localStorage -- which is where
 * Capacitor Preferences lands on the web -- already starts empty. Clearing it
 * via addInitScript would re-run on every navigation and wipe state under any
 * test that reloads.
 */
async function openApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('ion-tab-bar')).toBeVisible();
}

async function addSubscription(page: Page, name: string, cost: string) {
  await page.locator('ion-buttons[slot="end"] ion-button').last().click();
  const modal = page.locator('app-modal-add-subscription');
  await expect(modal).toBeVisible();

  await modal.locator('ion-input[formControlName="name"] input').fill(name);
  await modal.locator('ion-input[formControlName="cost"] input').fill(cost);
  await modal.locator('ion-buttons[slot="end"] ion-button').click();   // save
  await expect(modal).toBeHidden();
}

test.describe('Overview', () => {
  test('shows the tab bar with both tabs', async ({ page }) => {
    await openApp(page);
    await expect(page.locator('ion-tab-button[tab="overview"]')).toBeVisible();
    await expect(page.locator('ion-tab-button[tab="settings"]')).toBeVisible();
  });

  test('starts empty and titles the page Overview', async ({ page }) => {
    await openApp(page);
    await expect(page.locator('app-subscription-card')).toHaveCount(0);
    await expect(page.locator('app-tab-overview ion-title')).toContainText('Overview');
  });

  test('adds a subscription and shows it in the list', async ({ page }) => {
    await openApp(page);
    await addSubscription(page, 'Netflix', '10');

    await expect(page.locator('app-subscription-card')).toHaveCount(1);
    await expect(page.locator('app-subscription-card')).toContainText('Netflix');
  });

  test('adds up costs into the header total', async ({ page }) => {
    await openApp(page);
    await addSubscription(page, 'Rent', '-1000');
    await addSubscription(page, 'Salary', '3000');

    await expect(page.locator('app-subscription-card')).toHaveCount(2);
    await expect(page.locator('app-tab-overview ion-title')).toContainText('2,000');
  });

  test('keeps subscriptions across a reload', async ({ page }) => {
    await openApp(page);
    await addSubscription(page, 'Spotify', '5');

    await page.reload();
    await expect(page.locator('app-subscription-card')).toContainText('Spotify');
  });
});

test.describe('Settings', () => {
  test('navigates into data management and back', async ({ page }) => {
    await openApp(page);
    await page.locator('ion-tab-button[tab="settings"]').click();

    await page.locator('app-tab-settings ion-item').filter({ hasText: /data/i }).click();
    await expect(page.locator('app-data-management')).toBeVisible();
    await expect(page.locator('app-data-management ion-item')).toHaveCount(2);   // backup + restore
  });
});
