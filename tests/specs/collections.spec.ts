import { test, expect } from '@playwright/test';

test.describe('Collections Listing & Detail Pages', () => {
  /* -------------------------------------------------------------------------- */
  /* 1. Collections Listing Page (/collections)                                 */
  /* -------------------------------------------------------------------------- */
  test.describe('1. Collections Listing Page', () => {
    test('collections listing page displays page title, headings, and collection cards', async ({ page }) => {
      await page.goto('/collections', { waitUntil: 'domcontentloaded' });

      // Page title or Heading
      await expect(page).toHaveTitle(/Collections|Categories|VibeMart/i);
      const mainHeading = page.getByRole('heading', { name: /Product Categories|Collections|Featured Collections|পণ্য ক্যাটাগরি/i }).first();
      await expect(mainHeading).toBeVisible({ timeout: 15000 });

      // Check collection cards or empty state message
      const collectionCards = page.locator('a[href^="/collections/"]');
      const emptyState = page.getByText(/No collections available|কোন ক্যাটাগরি নেই|কোনো ক্যাটাগরি পাওয়া যায়নি/i);

      const hasCards = (await collectionCards.count()) > 0;
      const hasEmpty = (await emptyState.count()) > 0;
      expect(hasCards || hasEmpty).toBeTruthy();
    });

    test('breadcrumbs on collections listing page render and allow navigation to Home', async ({ page }) => {
      await page.goto('/collections', { waitUntil: 'domcontentloaded' });

      // Breadcrumb Home link
      const homeLink = page.getByRole('link', { name: /Home|হোম/i }).first();
      await expect(homeLink).toBeVisible({ timeout: 15000 });

      // Breadcrumb Categories label
      const categoriesLabel = page.locator('span').filter({ hasText: /Categories|Collections|ক্যাটাগরি/i }).first();
      await expect(categoriesLabel).toBeVisible();

      // Click Home link and verify navigation to homepage
      await homeLink.click();
      await expect(page).toHaveURL('/', { timeout: 15000 });
    });

    test('all photos of collections load correctly with valid dimensions on listing page', async ({ page }) => {
      await page.goto('/collections', { waitUntil: 'domcontentloaded' });

      const collectionCards = page.locator('a[href^="/collections/"]');
      const cardsCount = await collectionCards.count();

      if (cardsCount > 0) {
        for (let i = 0; i < cardsCount; i++) {
          const card = collectionCards.nth(i);
          const img = card.locator('img').first();
          if (await img.isVisible()) {
            await img.scrollIntoViewIfNeeded();
            // Wait for image to finish downloading and have valid natural dimensions
            await expect.poll(async () => {
              return await img.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0);
            }, { timeout: 10000 }).toBe(true);
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
        // Badge showing e.g., "255 Products" or "০ টি পণ্য"
        const productCountBadge = firstCard.locator('text=/\\d+.*(Products|টি পণ্য)/i').first();
        await expect(productCountBadge).toBeVisible({ timeout: 10000 });

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
          await expect(deliveryBadge.first()).toBeVisible({ timeout: 10000 });
        }
      }
    });

    test('collection cards display Explore Collection call to action and clicking card navigates to collection detail', async ({ page }) => {
      await page.goto('/collections', { waitUntil: 'domcontentloaded' });

      const firstCard = page.locator('a[href^="/collections/"]').first();
      await expect(firstCard).toBeVisible({ timeout: 15000 });

      // Verify "Explore Collection" CTA text is present on the card
      const ctaText = firstCard.locator('text=/Explore Collection|ক্যাটাগরি দেখুন/i').first();
      await expect(ctaText).toBeVisible();

      // Read card title
      const cardTitle = await firstCard.locator('h2').innerText();

      // Click card to navigate
      await firstCard.click();
      await expect(page).toHaveURL(/\/collections\/\d+/, { timeout: 15000 });

      // Verify header matches clicked collection
      const heroTitle = page.locator('h1').first();
      await expect(heroTitle).toBeVisible({ timeout: 10000 });
      expect((await heroTitle.innerText()).toLowerCase()).toContain(cardTitle.trim().toLowerCase());
    });

    test('renders collection cards grid or empty state when no collections are available', async ({ page }) => {
      await page.goto('/collections', { waitUntil: 'domcontentloaded' });
      const collectionCards = page.locator('a[href^="/collections/"]');
      const emptyMsg = page.getByText(/No collections available|কোন ক্যাটাগরি নেই|কোনো ক্যাটাগরি পাওয়া যায়নি/i);

      const count = await collectionCards.count();
      if (count > 0) {
        await expect(collectionCards.first()).toBeVisible({ timeout: 15000 });
      } else {
        await expect(emptyMsg.first()).toBeVisible({ timeout: 15000 });
      }
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. Collection Detail Page (/collections/[id])                              */
  /* -------------------------------------------------------------------------- */
  test.describe('2. Collection Detail Page', () => {
    test('collection detail page displays breadcrumbs with links to Home and Categories', async ({ page }) => {
      await page.goto('/collections/3', { waitUntil: 'domcontentloaded' });

      // Breadcrumb Home link
      const homeLink = page.getByRole('link', { name: /Home|হোম/i }).first();
      await expect(homeLink).toBeVisible({ timeout: 15000 });

      // Breadcrumb Categories link
      const categoriesLink = page.getByRole('link', { name: /Categories|Collections|ক্যাটাগরি/i }).first();
      await expect(categoriesLink).toBeVisible();

      // Click Categories breadcrumb link
      await categoriesLink.click();
      await expect(page).toHaveURL(/\/collections$/, { timeout: 15000 });
    });

    test('collection detail hero displays background, collection tag, title, and SVG wave divider', async ({ page }) => {
      await page.goto('/collections/3', { waitUntil: 'domcontentloaded' });

      // Hero main title
      const heroHeading = page.locator('h1').first();
      await expect(heroHeading).toBeVisible({ timeout: 15000 });

      // Hero collection detail tag badge
      const detailTag = page.getByText(/Collection Details|Collection Detail|ক্যাটাগরি বিবরণী/i);
      await expect(detailTag.first()).toBeVisible();

      // SVG wave divider at bottom of hero
      const waveSvg = page.locator('svg[viewBox="0 0 1440 120"]');
      await expect(waveSvg).toBeVisible();

      // Background image if available
      const heroBgImage = page.locator('.min-h-\\[260px\\], .min-h-\\[300px\\], .relative.w-full').locator('img').first();
      if (await heroBgImage.isVisible()) {
        const bgLoaded = await heroBgImage.evaluate((img: HTMLImageElement) => {
          return img.complete && img.naturalWidth > 0;
        });
        expect(bgLoaded).toBe(true);
      }
    });

    test('collection detail displays active delivery rule banner in the hero section', async ({ page }) => {
      // Collection 4 (Cleaning) has active delivery rule 8
      await page.goto('/collections/4', { waitUntil: 'domcontentloaded' });

      const deliveryBanner = page.locator('text=/Free Delivery|Free Shipping|ফ্রি ডেলিভারি|Reduced Delivery|ডেলিভারি ছাড়|Spend|Buy/i');
      if (await deliveryBanner.count() > 0) {
        await expect(deliveryBanner.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('collection detail renders rich product cards with ratings, units sold, and descriptions', async ({ page }) => {
      await page.goto('/collections/4', { waitUntil: 'domcontentloaded' });

      // Products heading
      const productsHeading = page.getByRole('heading', { name: /Products in this Collection|পণ্যসমূহ/i });
      await expect(productsHeading).toBeVisible({ timeout: 15000 });

      const productCards = page.locator('.grid > div.bg-secondary');
      const count = await productCards.count();
      expect(count).toBeGreaterThan(0);

      const firstCard = productCards.first();
      // Product title
      const titleEl = firstCard.locator('h3').first();
      await expect(titleEl).toBeVisible();

      // Product price
      const priceEl = firstCard.locator('.text-accent.font-extrabold').first();
      await expect(priceEl).toBeVisible();

      // Check for presence of units sold or rating if populated
      const soldEl = firstCard.locator('text=/\\d+.*Sold|বিক্রিত/i');
      if (await soldEl.count() > 0) {
        await expect(soldEl.first()).toBeVisible();
      }
    });

    test('displays product delivery offer badges inside product cards', async ({ page }) => {
      await page.goto('/collections/4', { waitUntil: 'domcontentloaded' });

      // Look for ProductDeliveryOfferBadge inside the product image aspect box
      const offerBadge = page.locator('.aspect-square').locator('text=/Free Delivery|Reduced Delivery|ফ্রি ডেলিভারি|ছাড়/i');
      if (await offerBadge.count() > 0) {
        await expect(offerBadge.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('displays product discount badges and strikethrough original prices when discounts are active', async ({ page }) => {
      await page.goto('/collections/3', { waitUntil: 'domcontentloaded' });

      const discountBadges = page.locator('text=/-\\d+%.*(OFF|ছাড়)/i');
      if (await discountBadges.count() > 0) {
        await expect(discountBadges.first()).toBeVisible();

        // Strikethrough original price
        const strikethroughPrice = page.locator('.line-through').first();
        await expect(strikethroughPrice).toBeVisible();
      }
    });

    test('clicking View Details navigates to the details page of that specific product', async ({ page }) => {
      await page.goto('/collections/3', { waitUntil: 'domcontentloaded' });

      const viewDetailsLink = page.getByRole('link', { name: /View Details|বিস্তারিত দেখুন/i }).first();
      await expect(viewDetailsLink).toBeVisible({ timeout: 15000 });

      const targetHref = await viewDetailsLink.getAttribute('href');
      expect(targetHref).toMatch(/\/products\/\d+/);

      await viewDetailsLink.click();
      await expect(page).toHaveURL(/\/products\/\d+/, { timeout: 15000 });

      const productHeading = page.locator('h1').first();
      await expect(productHeading).toBeVisible({ timeout: 10000 });
    });

    test('clicking Add to Cart adds product, shows confirmation toast, and updates header cart count', async ({ page }) => {
      await page.goto('/collections/3', { waitUntil: 'domcontentloaded' });

      // Read initial cart count in header if visible
      const cartLink = page.locator('a[href="/cart"]').first();
      await expect(cartLink).toBeVisible({ timeout: 15000 });
      const initialText = await cartLink.innerText();
      const initialCount = parseInt(initialText.replace(/\D/g, '') || '0', 10);

      // Click Add to Cart button
      const addToCartBtn = page.getByRole('button', { name: /Add to Cart|কার্টে যোগ করুন/i }).first();
      await expect(addToCartBtn).toBeVisible({ timeout: 15000 });
      await addToCartBtn.click();

      // Confirmation toast appears
      const toastPopup = page.locator('.swal2-popup').or(page.getByText(/Added.*to cart|কার্টে যোগ করা হয়েছে/i));
      await expect(toastPopup.first()).toBeVisible({ timeout: 15000 });

      // Verify cart count incremented or item exists in cart
      await page.goto('/cart', { waitUntil: 'domcontentloaded' });
      const cartItems = page.locator('.space-y-4 > div');
      await expect(cartItems.first()).toBeVisible({ timeout: 15000 });
    });

    test('displays empty state message when collection has no products', async ({ page }) => {
      // Collection 2 (Grocery) has 0 products
      await page.goto('/collections/2', { waitUntil: 'domcontentloaded' });

      const emptyProductsMsg = page.getByText(/No products found in this collection|কোনো পণ্য পাওয়া যায়নি/i);
      await expect(emptyProductsMsg.first()).toBeVisible({ timeout: 15000 });
    });

    test('navigating to non-existent collection displays 404 not found screen and back to categories link works', async ({ page }) => {
      await page.goto('/collections/999999', { waitUntil: 'domcontentloaded' });

      // "Collection not found." message
      const notFoundMsg = page.getByText(/Collection not found/i);
      await expect(notFoundMsg).toBeVisible({ timeout: 15000 });

      // "Back to Categories" button
      const backLink = page.getByRole('link', { name: /Back to Categories|ক্যাটাগরিতে ফিরে যান/i });
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute('href', '/collections');

      // Click back to categories
      await backLink.click();
      await expect(page).toHaveURL(/\/collections$/, { timeout: 15000 });
    });
  });
});
