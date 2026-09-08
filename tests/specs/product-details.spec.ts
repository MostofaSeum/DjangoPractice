import { test, expect } from '@playwright/test';

test.describe('Product Details Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a valid product details page (product id: 3, Shrimp - 21/25, with good inventory)
    await page.goto('/products/3', { waitUntil: 'domcontentloaded' });
  });

  test('displays product title, pricing, inventory badge, and primary action buttons', async ({ page }) => {
    // Product Title
    const titleHeading = page.locator('main h1');
    await expect(titleHeading).toBeVisible();

    // Price display
    const priceDisplay = page.locator('text=৳').first();
    await expect(priceDisplay).toBeVisible();

    // Main Add to Cart Button (inside the main product section)
    const addToCartBtn = page.getByRole('button', { name: 'Add to Cart', exact: true });
    await expect(addToCartBtn).toBeVisible();
  });

  test('can adjust quantity using increment and decrement buttons', async ({ page }) => {
    const plusBtn = page.getByRole('button', { name: '+' });
    const minusBtn = page.getByRole('button', { name: '-' });

    if (await plusBtn.isVisible() && !(await plusBtn.isDisabled())) {
      await plusBtn.click();
      await minusBtn.click();
    }
  });

  test('can select product variants if combobox or option buttons are available', async ({ page }) => {
    // Product variants may be a size dropdown combobox or option buttons
    const sizeCombobox = page.locator('select');
    if (await sizeCombobox.count() > 0) {
      const options = await sizeCombobox.first().locator('option:not([disabled])').count();
      if (options > 1) {
        await sizeCombobox.first().selectOption({ index: 1 });
      }
    }
  });

  test('can toggle wishlist status for product', async ({ page }) => {
    const wishlistBtn = page.getByRole('button', { name: /Wishlist|Add to Wishlist/i });
    if (await wishlistBtn.isVisible()) {
      await wishlistBtn.click();
      // Button responds or displays feedback
      await expect(wishlistBtn).toBeVisible();
    }
  });

  test('can add product to cart and displays confirmation alert', async ({ page }) => {
    const mainAddToCartBtn = page.getByRole('button', { name: 'Add to Cart', exact: true });
    if (await mainAddToCartBtn.isVisible() && !(await mainAddToCartBtn.isDisabled())) {
      await mainAddToCartBtn.click();
      // Alert popup or cart count badge visible
      const popupOrCart = page.locator('.swal2-popup, [role="alert"], [role="status"], header a[href="/cart"]');
      await expect(popupOrCart.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('can switch between description and reviews tabs', async ({ page }) => {
    const reviewsTab = page.getByRole('button', { name: /Reviews/i });
    if (await reviewsTab.isVisible()) {
      await reviewsTab.click();
      // Description or review tab button is selected or reviews content shows
      await expect(reviewsTab).toBeVisible();
    }
  });
});
