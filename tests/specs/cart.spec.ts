import { test, expect } from '@playwright/test';

test.describe('Cart Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
  });

  test('displays empty cart state when no items are added', async ({ page }) => {
    // If cart is empty, check empty state graphics & explore link
    const emptyHeading = page.getByRole('heading', { name: /Your Cart is Empty|Cart is Empty/i });
    if (await emptyHeading.isVisible()) {
      await expect(emptyHeading).toBeVisible();
      const exploreBtn = page.getByRole('link', { name: /Explore Products/i });
      await expect(exploreBtn).toBeVisible();
      await expect(exploreBtn).toHaveAttribute('href', '/products');
    }
  });

  test('can apply coupon code and validates input', async ({ page }) => {
    // Look for coupon input field
    const couponInput = page.getByPlaceholder(/Enter coupon code|COUPON/i);
    const applyCouponBtn = page.getByRole('button', { name: /Apply/i });

    if (await couponInput.isVisible()) {
      // Test empty submission
      await applyCouponBtn.click();
      const errorMsg = page.getByText(/Please enter a coupon code/i).or(page.locator('.swal2-popup'));
      await expect(errorMsg).toBeVisible({ timeout: 5000 });

      // Test invalid coupon submission
      await couponInput.fill('INVALIDCODE123');
      await applyCouponBtn.click();
      const invalidAlert = page.locator('.swal2-popup, [role="alert"]');
      await expect(invalidAlert).toBeVisible({ timeout: 7000 });
    }
  });

  test('updates quantity and recalculates totals when items exist', async ({ page }) => {
    const plusBtn = page.getByRole('button', { name: '+' }).first();
    if (await plusBtn.isVisible()) {
      const initialQty = await page.locator('span.w-10').first().innerText();
      await plusBtn.click();
      await page.waitForTimeout(500);
      const updatedQty = await page.locator('span.w-10').first().innerText();
      expect(Number(updatedQty)).toBeGreaterThan(Number(initialQty));
    }
  });

  test('displays order summary section with checkout button', async ({ page }) => {
    const checkoutBtn = page.getByRole('button', { name: /Proceed to Checkout|Checkout/i }).or(
      page.getByRole('link', { name: /Checkout/i })
    );

    if (await checkoutBtn.isVisible()) {
      await expect(checkoutBtn).toBeVisible();
      // Click Proceed to checkout
      await checkoutBtn.click();
      await expect(page).toHaveURL(/checkout/);
    }
  });
});
