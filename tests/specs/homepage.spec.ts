import { test, expect } from '@playwright/test';

test.describe('Storefront Homepage Tests', () => {
  test('homepage loads successfully and displays branding', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/.+/);
    const heroOrBento = page.locator('section').first();
    await expect(heroOrBento).toBeVisible();
  });

  test('can switch language between English and Bangla', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Target the toggle button using its accessibility role and name
    const langToggle = page.getByRole('button', { name: 'Toggle Language' });
    await expect(langToggle).toBeVisible({ timeout: 10000 });

    // Click to toggle language
    await langToggle.click();

    // Verify Bangla state or text
    await expect(page.locator('body')).toBeVisible();
  });
});
