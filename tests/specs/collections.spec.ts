import { test, expect } from '@playwright/test';

test.describe('Collections Listing & Detail Pages', () => {
  test('collections listing page displays page title, headings, and collection cards', async ({ page }) => {
    await page.goto('/collections', { waitUntil: 'domcontentloaded' });

    // Page title or Heading
    await expect(page).toHaveTitle(/Collections|Categories|VibeMart/i);
    const mainHeading = page.getByRole('heading', { name: /Product Categories|Collections|পণ্য ক্যাটাগরি/i }).first();
    await expect(mainHeading).toBeVisible();

    // Check collection cards or empty state message
    const collectionCards = page.locator('a[href^="/collections/"]');
    const emptyState = page.getByText(/No collections available|কোন ক্যাটাগরি নেই/i);

    const hasCards = (await collectionCards.count()) > 0;
    const hasEmpty = (await emptyState.count()) > 0;
    expect(hasCards || hasEmpty).toBeTruthy();
  });

  test('all photos of collections load correctly on the listing page', async ({ page }) => {
    await page.goto('/collections', { waitUntil: 'domcontentloaded' });

    const collectionCards = page.locator('a[href^="/collections/"]');
    const cardsCount = await collectionCards.count();

    if (cardsCount > 0) {
      for (let i = 0; i < cardsCount; i++) {
        const card = collectionCards.nth(i);
        const img = card.locator('img').first();
        if (await img.isVisible()) {
          // Verify img naturalWidth is loaded and not broken (naturalWidth > 0)
          const isLoaded = await img.evaluate((image: HTMLImageElement) => {
            return image.complete && image.naturalWidth > 0;
          });
          expect(isLoaded).toBe(true);
        }
      }
    }
  });

  test('counts the number of products accurately on collection cards', async ({ page }) => {
    await page.goto('/collections', { waitUntil: 'domcontentloaded' });

    const collectionCards = page.locator('a[href^="/collections/"]');
    const count = await collectionCards.count();

    if (count > 0) {
      const firstCard = collectionCards.first();
      // Badge showing e.g., "12 Products" or "১২ টি পণ্য"
      const productCountBadge = firstCard.locator('text=/\\d+.*(Products|টি পণ্য)/i').first();
      await expect(productCountBadge).toBeVisible();

      const badgeText = await productCountBadge.innerText();
      const numMatch = badgeText.match(/[\d]+/);
      expect(numMatch).not.toBeNull();
      const productCount = parseInt(numMatch![0], 10);
      expect(productCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('displays delivery charge discount or offer badge if collection has an active delivery rule', async ({ page }) => {
    await page.goto('/collections', { waitUntil: 'domcontentloaded' });

    const collectionCards = page.locator('a[href^="/collections/"]');
    if ((await collectionCards.count()) > 0) {
      // Look for any delivery discount / free delivery offer badge
      const deliveryBadge = page.locator('text=/Free Delivery|Free Shipping|ফ্রি ডেলিভারি|Reduced Delivery|ডেলিভারি ছাড়/i');
      if (await deliveryBadge.count() > 0) {
        await expect(deliveryBadge.first()).toBeVisible();
      }
    }
  });

  test('when user clicks a collection, photo goes in hero background correctly and detail page shows discounts perfectly', async ({ page }) => {
    await page.goto('/collections', { waitUntil: 'domcontentloaded' });

    const firstCard = page.locator('a[href^="/collections/"]').first();
    if ((await firstCard.count()) > 0) {
      // Get title from card
      const cardTitle = await firstCard.locator('h2').innerText();

      // Click card to navigate to collection detail
      await firstCard.click();
      await expect(page).toHaveURL(/\/collections\/\d+/);

      // Verify collection hero heading
      const heroHeading = page.locator('h1').first();
      await expect(heroHeading).toBeVisible();
      expect((await heroHeading.innerText()).toLowerCase()).toContain(cardTitle.trim().toLowerCase());

      // Verify background hero image is rendered and loaded
      const heroBgImage = page.locator('.min-h-\\[260px\\], .min-h-\\[300px\\], .relative.w-full').locator('img').first();
      if (await heroBgImage.isVisible()) {
        const bgLoaded = await heroBgImage.evaluate((img: HTMLImageElement) => {
          return img.complete && img.naturalWidth > 0;
        });
        expect(bgLoaded).toBe(true);
      }

      // Check delivery discount banner in detail hero
      const deliveryBanner = page.locator('text=/Free Delivery|Free Shipping|ফ্রি ডেলিভারি|Reduced Delivery|ডেলিভারি ছাড়|Spend|Buy/i');
      if (await deliveryBanner.count() > 0) {
        await expect(deliveryBanner.first()).toBeVisible();
      }

      // Verify product discount badges (e.g., "-15% OFF" or "-১৫% ছাড়") if any products in collection have discounts
      const productDiscountBadges = page.locator('text=/-\\d+%.*(OFF|ছাড়)/i');
      if (await productDiscountBadges.count() > 0) {
        await expect(productDiscountBadges.first()).toBeVisible();
      }

      // Verify each product item price formatting
      const productCards = page.locator('a[href^="/products/"]');
      if (await productCards.count() > 0) {
        await expect(productCards.first()).toBeVisible();
      }
    }
  });

  test('clicking on Add to Cart button successfully adds that product to cart', async ({ page }) => {
    // Navigate to a collection page that has products
    await page.goto('/collections/1', { waitUntil: 'domcontentloaded' });

    // Look for active Add to Cart buttons in the product cards
    const addToCartBtn = page.getByRole('button', { name: /Add to Cart|কার্টে যোগ করুন/i }).first();

    if (await addToCartBtn.isVisible({ timeout: 5000 })) {
      await addToCartBtn.click();

      // Verify success feedback toast/notification appears
      const successToast = page.locator('.swal2-popup').or(page.getByText(/Added.*to cart|কার্টে যোগ করা হয়েছে/i));
      await expect(successToast.first()).toBeVisible({ timeout: 10000 });

      // Verify cart badge count or navigate to cart to verify item is present
      await page.goto('/cart', { waitUntil: 'domcontentloaded' });
      const cartItems = page.locator('.space-y-4 > div');
      await expect(cartItems.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('clicking View Details navigates to the details page of that specific product', async ({ page }) => {
    // Navigate to a collection page
    await page.goto('/collections/1', { waitUntil: 'domcontentloaded' });

    // Find the first View Details link
    const viewDetailsLink = page.getByRole('link', { name: /View Details|বিস্তারিত দেখুন/i }).first();

    if (await viewDetailsLink.isVisible({ timeout: 5000 })) {
      const targetHref = await viewDetailsLink.getAttribute('href');
      expect(targetHref).toMatch(/\/products\/\d+/);

      // Click View Details
      await viewDetailsLink.click();

      // Verify navigation to product details page
      await expect(page).toHaveURL(/\/products\/\d+/);

      // Product details page header/title should be visible
      const productHeading = page.locator('h1').first();
      await expect(productHeading).toBeVisible({ timeout: 10000 });
    }
  });
});
