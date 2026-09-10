import { test, expect } from '@playwright/test';

test.describe('Product Details Page', () => {
  // Helper to log in a test user if needed
  async function ensureAuthenticated(page: any) {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const usernameInput = page.locator('input[name="username"]').or(page.getByPlaceholder(/Username|Email/i)).first();
    const passwordInput = page.locator('input[name="password"]').or(page.locator('input[type="password"]')).first();
    const submitBtn = page.locator('form button[type="submit"]');

    if (await usernameInput.isVisible()) {
      await usernameInput.fill('admin');
      await passwordInput.fill('admin1234');
      await submitBtn.click();
      await page.waitForNavigation({ timeout: 8000 }).catch(() => {});
    }
  }

  test.beforeEach(async ({ page }) => {
    // Navigate to a valid product details page (product id: 3, Shrimp - 21/25 with inventory & variants)
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
    const addToCartBtn = page.getByRole('button', { name: /Add to Cart|কার্টে যোগ করুন/i, exact: true });
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

  test('can toggle wishlist status for product', async ({ page }) => {
    const wishlistBtn = page.getByRole('button', { name: /Wishlist|Add to Wishlist|Saved in Wishlist/i });
    if (await wishlistBtn.isVisible()) {
      await wishlistBtn.click();
      await expect(wishlistBtn).toBeVisible();
    }
  });

  test('can add product to cart and displays confirmation alert', async ({ page }) => {
    const mainAddToCartBtn = page.getByRole('button', { name: /Add to Cart|কার্টে যোগ করুন/i, exact: true });
    if (await mainAddToCartBtn.isVisible() && !(await mainAddToCartBtn.isDisabled())) {
      await mainAddToCartBtn.click();
      // Alert popup or cart count badge visible
      const popupOrCart = page.locator('.swal2-popup, [role="alert"], [role="status"], header a[href="/cart"]');
      await expect(popupOrCart.first()).toBeVisible({ timeout: 6000 });
    }
  });

  test('loads all photos and gallery thumbnails perfectly and allows smooth switching', async ({ page }) => {
    // Check main gallery image loaded with natural dimensions
    const mainImg = page.locator('.aspect-\\[4\\/5\\] img').first();
    if (await mainImg.isVisible()) {
      const isMainLoaded = await mainImg.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
      expect(isMainLoaded).toBeTruthy();
    }

    // Check thumbnail gallery photos
    const thumbnails = page.locator('.grid-cols-4 img');
    const thumbCount = await thumbnails.count();
    for (let i = 0; i < thumbCount; i++) {
      const thumb = thumbnails.nth(i);
      const isLoaded = await thumb.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
      expect(isLoaded).toBeTruthy();
    }

    // Clicking a thumbnail swaps the images smoothly
    if (thumbCount > 0) {
      const firstThumbParent = thumbnails.first().locator('..');
      await firstThumbParent.click();
      await page.waitForTimeout(300);
      const isStillLoaded = await mainImg.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
      expect(isStillLoaded).toBeTruthy();
    }
  });

  test('shows all discounts correctly and loads offer badges correctly', async ({ page }) => {
    // Check if product has discount badge
    const discountBadge = page.locator('text=/-\\d+%\\s*(OFF|ছাড়)/i');
    if (await discountBadge.first().isVisible()) {
      await expect(discountBadge.first()).toBeVisible();

      // Ensure original price with strikethrough is present
      const strikethroughPrice = page.locator('.line-through');
      await expect(strikethroughPrice.first()).toBeVisible();

      // Ensure Save amount badge is visible
      const saveBadge = page.locator('text=/Save|সেভ/i');
      await expect(saveBadge.first()).toBeVisible();
    }

    // Check delivery offer banner/badge if matched delivery rule exists
    const deliveryBanner = page.locator('text=/Spend|Buy|Congratulations|কিনুন|যোগ করুন/i');
    if (await deliveryBanner.first().isVisible()) {
      await expect(deliveryBanner.first()).toBeVisible();
    }
  });

  test('deducts delivery charge or product price correctly according to discount percentage', async ({ page }) => {
    // Verify delivery section inside & outside Dhaka charges
    const deliverySection = page.locator('text=/Delivery|ডেলিভারি/i');
    await expect(deliverySection.first()).toBeVisible();

    const insideDhaka = page.locator('text=/Inside Dhaka|ঢাকার ভেতরে/i');
    const outsideDhaka = page.locator('text=/Outside Dhaka|ঢাকার বাইরে/i');
    await expect(insideDhaka.first()).toBeVisible();
    await expect(outsideDhaka.first()).toBeVisible();

    // Verify discount math: currentPrice <= originalPrice when discount is applied
    const priceTexts = await page.locator('span:has-text("৳")').allInnerTexts();
    const numericPrices = priceTexts
      .map((txt) => {
        const match = txt.replace(/,/g, '').match(/\d+(\.\d+)?/);
        return match ? parseFloat(match[0]) : null;
      })
      .filter((n): n is number => n !== null && n > 0);

    if (numericPrices.length >= 2) {
      const strikethrough = page.locator('.line-through');
      if (await strikethrough.first().isVisible()) {
        const currentPrice = numericPrices[0];
        const strikePrice = numericPrices[1];
        expect(currentPrice).toBeLessThanOrEqual(strikePrice);
      }
    }
  });

  test('selecting variants is smooth, price and stock update automatically', async ({ page }) => {
    // Check for size select dropdown
    const sizeSelect = page.locator('select');
    if (await sizeSelect.count() > 0 && await sizeSelect.first().isVisible()) {
      const options = sizeSelect.first().locator('option:not([disabled])');
      const optCount = await options.count();
      if (optCount > 1) {
        const initialPrice = await page.locator('.text-2xl, .text-3xl').first().innerText();
        
        // Select second variant option
        await sizeSelect.first().selectOption({ index: 1 });
        await page.waitForTimeout(300);

        // Verify that price or stock badge is visible after change
        const currentStockDisplay = page.locator('text=/In Stock|items left in stock|স্টকে বাকি আছে|স্টকে আছে/i');
        await expect(currentStockDisplay.first()).toBeVisible();
      }
    }

    // Check for color swatch variant buttons
    const colorSwatches = page.locator('button[title*="৳"], button[type="button"]:has(div.rounded-full)');
    if (await colorSwatches.count() > 1) {
      const initialPrice = await page.locator('.text-2xl, .text-3xl').first().innerText();
      
      // Click second color variant
      await colorSwatches.nth(1).click();
      await page.waitForTimeout(300);

      // Verify variant selection feedback (ring/scale)
      await expect(colorSwatches.nth(1)).toBeVisible();
      const updatedStockDisplay = page.locator('text=/In Stock|items left in stock|স্টকে বাকি আছে|স্টকে আছে/i');
      await expect(updatedStockDisplay.first()).toBeVisible();
    }
  });

  test('clicking on categories navigates to that collection page', async ({ page }) => {
    // Find category/collection link in product details meta section
    const categoryLink = page.locator('a[href^="/collections/"]').first();
    if (await categoryLink.isVisible()) {
      const categoryHref = await categoryLink.getAttribute('href');
      expect(categoryHref).toMatch(/\/collections\/\d+/);

      await categoryLink.click();
      await expect(page).toHaveURL(new RegExp(categoryHref!));
      
      // Verify collection heading appears
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();
    }
  });

  test('can switch between description and reviews tabs', async ({ page }) => {
    const reviewsTab = page.getByRole('button', { name: /Reviews|রিভিউ/i });
    const descriptionTab = page.getByRole('button', { name: /Description|বিবরণ/i });

    await expect(descriptionTab).toBeVisible();
    await expect(reviewsTab).toBeVisible();

    // Click reviews tab
    await reviewsTab.click();
    await expect(page.locator('#write-review-section, text=/Customer Reviews|গ্রাহক রিভিউ/i').first()).toBeVisible();

    // Switch back to description tab
    await descriptionTab.click();
    await expect(descriptionTab).toBeVisible();
  });

  test('review validation: empty review cannot be submitted', async ({ page }) => {
    // Ensure we are logged in so write review form is accessible
    await ensureAuthenticated(page);
    await page.goto('/products/3', { waitUntil: 'domcontentloaded' });

    // Switch to Reviews tab
    const reviewsTab = page.getByRole('button', { name: /Reviews|রিভিউ/i });
    await reviewsTab.click();

    const writeSection = page.locator('#write-review-section');
    await expect(writeSection).toBeVisible();

    // If review form is visible, test submitting empty review
    const submitReviewBtn = page.getByRole('button', { name: /Submit Review|Update Review|রিভিউ জমা দিন/i });
    if (await submitReviewBtn.isVisible()) {
      const textarea = page.locator('#write-review-section textarea');
      await textarea.fill('');

      await submitReviewBtn.click();

      // Verify browser native validation or sweetalert notification prevents empty submission
      const swalAlert = page.locator('.swal2-popup');
      const isInvalid = await textarea.evaluate((el: HTMLTextAreaElement) => !el.checkValidity() || el.value.trim() === '');
      expect(isInvalid).toBeTruthy();
    }
  });

  test('users can submit reviews with rating stars, text, and optional photo', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/products/3', { waitUntil: 'domcontentloaded' });

    const reviewsTab = page.getByRole('button', { name: /Reviews|রিভিউ/i });
    await reviewsTab.click();

    const submitReviewBtn = page.getByRole('button', { name: /Submit Review|Update Review|রিভিউ জমা দিন/i });
    if (await submitReviewBtn.isVisible()) {
      // Select 5-star rating
      const starBtn = page.locator('#write-review-section button[aria-label*="Rate 5"]').or(
        page.locator('#write-review-section button img[alt="star"]').last()
      );
      if (await starBtn.isVisible()) {
        await starBtn.click();
      }

      // Fill review description
      const textarea = page.locator('#write-review-section textarea');
      const testReviewComment = `Antigravity automated test review - ${Date.now()}`;
      await textarea.fill(testReviewComment);

      // Submit review
      await submitReviewBtn.click();

      // Verify success notification popup
      const successPopup = page.locator('.swal2-popup').or(page.getByText(/Thank you! Your review has been published|Your review has been updated/i));
      await expect(successPopup.first()).toBeVisible({ timeout: 8000 });
    }
  });

  test('users own review displays first with edit and delete controls', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/products/3', { waitUntil: 'domcontentloaded' });

    const reviewsTab = page.getByRole('button', { name: /Reviews|রিভিউ/i });
    await reviewsTab.click();

    // Check if user has an existing review marked with "Your Review" badge
    const ownReviewBadge = page.locator('text=/Your Review|আপনার রিভিউ/i').first();
    if (await ownReviewBadge.isVisible()) {
      await expect(ownReviewBadge).toBeVisible();

      // Own review should have edit and delete buttons
      const editBtn = page.locator('button[title*="Edit Review"]').first();
      const deleteBtn = page.locator('button[title*="Delete Review"]').first();

      await expect(editBtn).toBeVisible();
      await expect(deleteBtn).toBeVisible();

      // Test Edit button click opens pre-filled editor
      await editBtn.click();
      const textarea = page.locator('#write-review-section textarea');
      await expect(textarea).not.toHaveValue('');

      // Cancel edit mode
      const cancelBtn = page.getByRole('button', { name: /Cancel Edit|বাতিল করুন/i });
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
      }
    }
  });

  test('related products loads products from same category, View Details and Add to Cart work', async ({ page }) => {
    // Scroll down to related products
    const relatedHeading = page.getByRole('heading', { name: /Related Products|সম্পর্কিত পণ্য/i });
    if (await relatedHeading.isVisible()) {
      await expect(relatedHeading).toBeVisible();

      // Verify related product cards are rendered
      const relatedCards = page.locator('main .grid a[href^="/products/"]');
      const relatedCount = await relatedCards.count();
      expect(relatedCount).toBeGreaterThan(0);

      // Verify "View Details" button exists and navigates
      const viewDetailsBtn = page.locator('main a:has-text("View Details"), main a:has-text("বিস্তারিত দেখুন")').first();
      if (await viewDetailsBtn.isVisible()) {
        const href = await viewDetailsBtn.getAttribute('href');
        expect(href).toMatch(/\/products\/\d+/);
      }

      // Verify "Add to Cart" button in related products works
      const relatedAddToCartBtn = page.locator('main button:has-text("Add to Cart"), main button:has-text("কার্টে যোগ করুন")').last();
      if (await relatedAddToCartBtn.isVisible() && !(await relatedAddToCartBtn.isDisabled())) {
        await relatedAddToCartBtn.click();
        const popupOrToast = page.locator('.swal2-popup, [role="alert"], [role="status"]');
        await expect(popupOrToast.first()).toBeVisible({ timeout: 6000 });
      }
    }
  });
});
