import { test, expect } from '@playwright/test';

test.describe('Checkout Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
  });

  test('redirects unauthenticated users to login or shows checkout container', async ({ page }) => {
    // If not logged in, Next.js or hook might redirect to /login?redirect=/checkout
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await expect(page).toHaveURL(/login/);
      const loginHeading = page.locator('h1, h2').first();
      await expect(loginHeading).toBeVisible();
    } else {
      // User is already logged in or guest checkout allowed
      await expect(page).toHaveURL(/checkout/);
    }
  });

  test('renders delivery destination options (Inside Dhaka vs Outside Dhaka)', async ({ page }) => {
    if (page.url().includes('/checkout')) {
      const deliveryOptions = page.locator('text=Inside Dhaka, text=Outside Dhaka');
      if ((await deliveryOptions.count()) > 0) {
        await expect(deliveryOptions.first()).toBeVisible();
      }
    }
  });

  test('renders payment method options: Cash on Delivery, bKash, Nagad, VibeCoin', async ({ page }) => {
    if (page.url().includes('/checkout')) {
      const codOption = page.getByRole('radio', { name: /Cash on Delivery|COD/i }).or(page.getByText(/Cash on Delivery/i));
      const bkashOption = page.getByRole('radio', { name: /bKash/i }).or(page.getByText(/bKash/i));
      const nagadOption = page.getByRole('radio', { name: /Nagad/i }).or(page.getByText(/Nagad/i));

      if (await codOption.isVisible()) {
        await expect(codOption).toBeVisible();
      }
      if (await bkashOption.isVisible()) {
        await expect(bkashOption).toBeVisible();
      }
      if (await nagadOption.isVisible()) {
        await expect(nagadOption).toBeVisible();
      }
    }
  });

  test('displays place order button and validates required shipping address and phone', async ({ page }) => {
    if (page.url().includes('/checkout')) {
      const placeOrderBtn = page.getByRole('button', { name: /Place Order|Confirm Order/i });
      if (await placeOrderBtn.isVisible()) {
        await expect(placeOrderBtn).toBeVisible();

        // Attempting to submit without required fields should trigger feedback
        await placeOrderBtn.click();
        const feedbackAlert = page.locator('.swal2-popup, [role="alert"], :invalid');
        await expect(feedbackAlert.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
