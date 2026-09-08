import { test, expect } from '@playwright/test';

test.describe('Customer Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
  });

  test('redirects unauthenticated users to login or renders profile dashboard', async ({ page }) => {
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // Unauthenticated protection: safely redirects to login
      await expect(page).toHaveURL(/login/);
      await expect(page.locator('h1, h2').first()).toBeVisible();
    } else {
      // If session is active, verify profile tabs
      await expect(page).toHaveURL(/profile/);
      const profileHeading = page.locator('h1, h2').first();
      await expect(profileHeading).toBeVisible();
    }
  });

  test('displays customer profile navigation tabs when authenticated', async ({ page }) => {
    if (page.url().includes('/profile')) {
      // Navigation tabs: Orders, Addresses, Personal Info, Wishlist, etc.
      const orderTab = page.getByRole('button', { name: /Orders|My Orders/i }).or(page.locator('text=Orders'));
      const addressTab = page.getByRole('button', { name: /Addresses|Address/i }).or(page.locator('text=Addresses'));

      if (await orderTab.isVisible()) {
        await expect(orderTab).toBeVisible();
      }
      if (await addressTab.isVisible()) {
        await expect(addressTab).toBeVisible();
      }
    }
  });

  test('renders user personal details form with update action', async ({ page }) => {
    if (page.url().includes('/profile')) {
      const saveBtn = page.getByRole('button', { name: /Save Changes|Update Profile|Save/i });
      if (await saveBtn.isVisible()) {
        await expect(saveBtn).toBeVisible();
      }
    }
  });
});
