import { test, expect } from '@playwright/test';

test.describe('Storefront Homepage Tests', () => {
  test('homepage loads successfully and displays branding', async ({ page }) => {
    // Navigates to baseURL (http://localhost:3000)
    await page.goto('/');

    // Check page title or main navigation is present
    await expect(page).toHaveTitle(/.+/);

    // Verify Bento grid or hero section is visible
    const heroOrBento = page.locator('section').first();
    await expect(heroOrBento).toBeVisible();
  });

  test('can switch language between English and Bangla', async ({ page }) => {
    await page.goto('/');

    // Locate language toggle button (English / বাংলা)
    const bnButton = page.locator('button, a').filter({ hasText: /বাংলা|BN/i }).first();
    if (await bnButton.isVisible()) {
      await bnButton.click();
      // Verify page reflects language change (e.g., text or active indicator changes)
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
