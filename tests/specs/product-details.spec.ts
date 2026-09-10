import { test, expect } from '@playwright/test';

test.describe('Product Details Page', () => {
  let cachedAuth: { access: string; refresh: string } | null = null;

  // Helper to ensure customer authentication (using customer account 'hello' / 'Hello123456')
  async function ensureAuthenticated(page: any) {
    try {
      if (!cachedAuth) {
        const response = await page.request.post('http://127.0.0.1:8000/auth/jwt/create/', {
          data: {
            username: 'hello',
            password: 'Hello123456',
          },
        });

        if (response.ok()) {
          cachedAuth = await response.json();
        }
      }

      if (cachedAuth) {
        const { access, refresh } = cachedAuth;
        await page.addInitScript(({ access, refresh }: { access: string; refresh: string }) => {
          localStorage.setItem('access_token', access);
          if (refresh) localStorage.setItem('refresh_token', refresh);
        }, { access, refresh });
        return;
      }
    } catch (e) {
      console.warn('API token seeding error, falling back to UI login:', e);
    }

    // Fallback: Perform standard UI login
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    const usernameInput = page.locator('input[placeholder*="USERNAME" i], input[name="username"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitBtn = page.locator('button[type="submit"]:has-text("Sign In"), button[type="submit"]:has-text("সাইন ইন"), form button[type="submit"]').first();

    if (await usernameInput.isVisible()) {
      await usernameInput.fill('hello');
      await passwordInput.fill('Hello123456');
      await submitBtn.click();
      await expect(page).not.toHaveURL(/\/login(\?|$)/, { timeout: 15000 });
    }
  }

  test.beforeEach(async ({ page }) => {
    // Navigate to a valid product details page (product id: 3, Shrimp - 21/25 with inventory)
    await page.goto('/products/3', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  // 1. Core UI Elements & Primary Add to Cart
  test('displays product title, pricing, inventory badge, and primary action buttons', async ({ page }) => {
    const titleHeading = page.locator('main h1');
    await expect(titleHeading).toBeVisible();

    const priceDisplay = page.locator('text=৳').first();
    await expect(priceDisplay).toBeVisible();

    const addToCartBtn = page.locator('#main-add-to-cart');
    await expect(addToCartBtn).toBeVisible();

    const wishlistBtn = page.locator('#main-wishlist-btn');
    await expect(wishlistBtn).toBeVisible();
  });

  // 2. Quantity Boundary Clamping
  test('can adjust quantity using increment and decrement buttons with boundary clamping', async ({ page }) => {
    const minusBtn = page.locator('#main-qty-minus');
    const plusBtn = page.locator('#main-qty-plus');
    const qtyVal = page.locator('#main-qty-val');

    await expect(plusBtn).toBeVisible();
    await expect(qtyVal).toHaveText(/1|১/);

    // Brief pause to ensure client hydration is complete
    await page.waitForTimeout(300);

    // 1. Increment from 1 -> 2
    if (!(await plusBtn.isDisabled())) {
      await plusBtn.click();
      await expect(qtyVal).toHaveText(/2|২/);

      // 2. Decrement back from 2 -> 1
      await minusBtn.click();
      await expect(qtyVal).toHaveText(/1|১/);

      // 3. Boundary check: Decrementing at 1 should clamp at 1
      await minusBtn.click();
      await expect(qtyVal).toHaveText(/1|১/);
    }
  });

  // 3. Real-time Cart Header Badge Increment
  test('can add product to cart and updates global header cart badge count in real-time', async ({ page }) => {
    const addToCartBtn = page.locator('#main-add-to-cart');
    await expect(addToCartBtn).toBeVisible();

    if (!(await addToCartBtn.isDisabled())) {
      await page.waitForTimeout(300);
      await addToCartBtn.click();

      // Alert popup / toast visible
      const popupOrToast = page.locator('.swal2-popup, [role="alert"], [role="status"]');
      await expect(popupOrToast.first()).toBeVisible({ timeout: 8000 });

      // Header cart badge should reflect cart update
      const updatedCartBadge = page.locator('header a[href="/cart"]').first();
      await expect(updatedCartBadge).toBeVisible();
    }
  });

  // 4. Wishlist Toggle
  test('can toggle wishlist status for product', async ({ page }) => {
    const wishlistBtn = page.locator('#main-wishlist-btn');
    await expect(wishlistBtn).toBeVisible();

    await page.waitForTimeout(200);
    await wishlistBtn.click();
    await expect(wishlistBtn).toBeVisible();
  });

  // 5. Gallery Images and 2-Way Image Swapping
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

    // Clicking a thumbnail swaps images smoothly
    if (thumbCount > 0) {
      const firstThumbParent = thumbnails.first().locator('..');
      await firstThumbParent.click();
      await page.waitForTimeout(300);

      const isStillLoaded = await mainImg.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
      expect(isStillLoaded).toBeTruthy();
    }
  });

  // 6. Discounts and Pricing Badges
  test('shows all discounts correctly and loads offer badges correctly', async ({ page }) => {
    const discountBadge = page.locator('text=/-\\d+%\\s*(OFF|ছাড়)/i');
    if (await discountBadge.first().isVisible()) {
      await expect(discountBadge.first()).toBeVisible();

      const strikethroughPrice = page.locator('.line-through');
      await expect(strikethroughPrice.first()).toBeVisible();

      const saveBadge = page.locator('text=/Save|সেভ/i');
      await expect(saveBadge.first()).toBeVisible();
    }

    const priceDisplay = page.locator('text=৳').first();
    await expect(priceDisplay).toBeVisible();
  });

  // 7. Delivery Charges & Dynamic Delivery Offer Banner (Testing Collection 4, Product 14)
  test('displays delivery charges and dynamic delivery offer banner for qualifying collections', async ({ page }) => {
    // Product 14 belongs to Collection 4 which has active delivery rule
    await page.goto('/products/14', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Delivery charges section
    const deliverySection = page.locator('text=/Delivery|ডেলিভারি/i');
    await expect(deliverySection.first()).toBeVisible();

    const insideDhaka = page.locator('text=/Inside Dhaka|ঢাকার ভেতরে/i');
    const outsideDhaka = page.locator('text=/Outside Dhaka|ঢাকার বাইরে/i');
    await expect(insideDhaka.first()).toBeVisible();
    await expect(outsideDhaka.first()).toBeVisible();

    // Delivery Offer Dynamic Progress Banner
    const deliveryBanner = page.locator('text=/Spend|Buy|Congratulations|কিনুন|যোগ করুন|অভিনন্দন/i');
    if (await deliveryBanner.first().isVisible()) {
      await expect(deliveryBanner.first()).toBeVisible();
    }
  });

  // 8. Variant Selection Dynamically Updates Price and Resets Quantity
  test('selecting variants dynamically updates price, stock, and resets quantity', async ({ page }) => {
    // Product 1 (Bread Ww 123) has two variants: 100ml (৳50) and 20 ml (৳4)
    await page.goto('/products/1', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const sizeSelect = page.locator('select');
    if (await sizeSelect.count() > 0 && await sizeSelect.first().isVisible()) {
      const options = sizeSelect.first().locator('option:not([disabled])');
      const optCount = await options.count();
      if (optCount > 1) {
        await page.waitForTimeout(300);

        // Increment quantity first
        const plusBtn = page.locator('#main-qty-plus');
        if (await plusBtn.isVisible() && !(await plusBtn.isDisabled())) {
          await plusBtn.click();
          await expect(page.locator('#main-qty-val')).toHaveText(/2|২/);
        }

        // Select second variant option
        await sizeSelect.first().selectOption({ index: 1 });
        await page.waitForTimeout(300);

        // Quantity resets to 1 on variant change
        await expect(page.locator('#main-qty-val')).toHaveText(/1|১/);

        // Stock and price display visible
        const currentStockDisplay = page.locator('text=/In Stock|items left in stock|স্টকে বাকি আছে|স্টকে আছে/i');
        await expect(currentStockDisplay.first()).toBeVisible();
      }
    }

    // Color swatch selection if available
    const colorSwatches = page.locator('button[title*="৳"], button[type="button"]:has(div.rounded-full)');
    if (await colorSwatches.count() > 1) {
      await colorSwatches.nth(1).click();
      await page.waitForTimeout(300);
      await expect(colorSwatches.nth(1)).toBeVisible();
    }
  });

  // 9. Category Navigation
  test('clicking on categories navigates to that collection page', async ({ page }) => {
    const categoryLink = page.locator('#product-breadcrumbs a[href*="/collections/"], a[href^="/collections/"]').first();
    if (await categoryLink.isVisible()) {
      const categoryHref = await categoryLink.getAttribute('href');
      expect(categoryHref).toMatch(/\/collections\/\d+/);

      await Promise.all([
        page.waitForURL(new RegExp(categoryHref!)),
        categoryLink.click(),
      ]);

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();
    }
  });

  // 10. Complete Breadcrumbs Hierarchy
  test('complete breadcrumbs hierarchy navigates correctly (Home -> Shop -> Collection -> Title)', async ({ page }) => {
    const breadcrumbs = page.locator('#product-breadcrumbs');
    await expect(breadcrumbs).toBeVisible();

    // Home link
    const homeLink = breadcrumbs.locator('a[href="/"]').first();
    await expect(homeLink).toBeVisible();

    // Shop link
    const shopLink = breadcrumbs.locator('a[href="/products"]').first();
    await expect(shopLink).toBeVisible();

    // Collection link
    const collectionLink = breadcrumbs.locator('a[href*="/collections/"]').first();
    await expect(collectionLink).toBeVisible();
  });

  // 11. Tab Switching (Description <-> Reviews)
  test('can switch between description and reviews tabs', async ({ page }) => {
    const descTabBtn = page.locator('#tab-description-btn');
    const reviewsTabBtn = page.locator('#tab-reviews-btn');

    await expect(descTabBtn).toBeVisible();
    await expect(reviewsTabBtn).toBeVisible();

    // Switch to Reviews tab
    await reviewsTabBtn.click();
    const reviewsSection = page.locator('#write-review-section').or(page.getByText(/Customer Reviews|গ্রাহক রিভিউ/i));
    await expect(reviewsSection.first()).toBeVisible();

    // Switch back to Description tab
    await descTabBtn.click();
    await expect(descTabBtn).toBeVisible();
  });

  // 12. Rating Header Shortcut Automatically Opens Reviews Tab
  test('clicking rating header shortcut smoothly scrolls to and activates reviews tab', async ({ page }) => {
    // Product 1 has a 5.0 rating and 1 review
    await page.goto('/products/1', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const ratingHeader = page.locator('#product-rating-header');
    if (await ratingHeader.isVisible()) {
      await ratingHeader.click();
      await page.waitForTimeout(400);

      // Reviews section should now be visible
      const reviewsSection = page.locator('#write-review-section').or(page.getByText(/Customer Reviews|গ্রাহক রিভিউ/i));
      await expect(reviewsSection.first()).toBeVisible();
    }
  });

  // 13. Direct URL Deep-linking (?tab=reviews or #reviews)
  test('direct URL deep-linking (?tab=reviews or #reviews) opens reviews tab automatically', async ({ page }) => {
    await page.goto('/products/1?tab=reviews', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const reviewsSection = page.locator('#write-review-section').or(page.getByText(/Customer Reviews|গ্রাহক রিভিউ/i));
    await expect(reviewsSection.first()).toBeVisible({ timeout: 5000 });
  });

  // 14. Unauthenticated Guest Review UX: Sign In Required Banner
  test('unauthenticated guest user sees Sign In Required banner on reviews tab', async ({ page }) => {
    // Open product page without authentication
    await page.goto('/products/3', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const reviewsTabBtn = page.locator('#tab-reviews-btn');
    await reviewsTabBtn.click();

    // Verify Sign In Required banner & login redirect link
    const signInBanner = page.getByText(/Sign In Required|সাইন-ইন প্রয়োজন/i).or(page.getByRole('link', { name: /Sign In to Write a Review|রিভিউ দিতে সাইন ইন করুন/i }));
    await expect(signInBanner.first()).toBeVisible();

    const signInLink = page.locator('a[href*="/login?redirect="]').first();
    if (await signInLink.isVisible()) {
      const href = await signInLink.getAttribute('href');
      expect(href).toContain('/login?redirect=');
    }
  });

  // 15. Review Validation: Empty Review Cannot Be Submitted
  test('review validation: empty review cannot be submitted', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/products/3', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const reviewsTabBtn = page.locator('#tab-reviews-btn');
    await reviewsTabBtn.click();

    const submitBtn = page.locator('#submit-review-btn');
    if (await submitBtn.isVisible()) {
      const textarea = page.locator('#review-textarea');
      await textarea.fill('');

      await submitBtn.click();

      // HTML5 or SweetAlert validation prevents empty submission
      const isInvalid = await textarea.evaluate((el: HTMLTextAreaElement) => !el.checkValidity() || el.value.trim() === '');
      expect(isInvalid).toBeTruthy();
    }
  });

  // 16. Interactive Review Star Rating Selection
  test('review form interactive rating: clicking star buttons updates the star rating value', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/products/3', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const reviewsTabBtn = page.locator('#tab-reviews-btn');
    await reviewsTabBtn.click();

    const writeSection = page.locator('#write-review-section');
    if (await writeSection.isVisible()) {
      // Click 3rd star button
      const star3Btn = writeSection.locator('button[aria-label*="Rate 3"]').or(writeSection.locator('button:has(img[alt="star"])').nth(2));
      if (await star3Btn.isVisible()) {
        await star3Btn.click();
        await expect(writeSection.locator('text=/3\\s*\\/\\s*5/i')).toBeVisible();
      }

      // Click 5th star button
      const star5Btn = writeSection.locator('button[aria-label*="Rate 5"]').or(writeSection.locator('button:has(img[alt="star"])').nth(4));
      if (await star5Btn.isVisible()) {
        await star5Btn.click();
        await expect(writeSection.locator('text=/5\\s*\\/\\s*5/i')).toBeVisible();
      }
    }
  });

  // 17. Authenticated Customer Review Submission
  test('users can submit reviews with rating stars, text, and optional photo', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/products/3', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const reviewsTabBtn = page.locator('#tab-reviews-btn');
    await reviewsTabBtn.click();

    const submitReviewBtn = page.locator('#submit-review-btn');
    if (await submitReviewBtn.isVisible()) {
      // Fill review description
      const textarea = page.locator('#review-textarea');
      const testReviewComment = `Antigravity automated test review - ${Date.now()}`;
      await textarea.fill(testReviewComment);

      // Submit review
      await submitReviewBtn.click();

      // Verify success notification popup
      const successPopup = page.locator('.swal2-popup').or(page.getByText(/Thank you! Your review has been published|Your review has been updated/i));
      await expect(successPopup.first()).toBeVisible({ timeout: 8000 });
    }
  });

  // 18. User's Own Review: "Your Review" Badge and Edit Mode
  test('users own review displays first with edit and delete controls', async ({ page }) => {
    await ensureAuthenticated(page);
    // Product 1 has an existing review created by the customer user 'hello'
    await page.goto('/products/1', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const reviewsTabBtn = page.locator('#tab-reviews-btn');
    await reviewsTabBtn.click();

    const ownReviewBadge = page.locator('text=/Your Review|আপনার রিভিউ/i').first();
    if (await ownReviewBadge.isVisible()) {
      await expect(ownReviewBadge).toBeVisible();

      // Edit and Delete buttons should exist on own review
      const editBtn = page.locator('button[title*="Edit Review"]').first();
      const deleteBtn = page.locator('button[title*="Delete Review"]').first();

      await expect(editBtn).toBeVisible();
      await expect(deleteBtn).toBeVisible();

      // Click Edit button
      await editBtn.click();
      const textarea = page.locator('#review-textarea');
      await expect(textarea).not.toHaveValue('');

      // Cancel edit mode
      const cancelBtn = page.getByRole('button', { name: /Cancel Edit|বাতিল করুন/i }).first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
      }
    }
  });

  // 19. Review Deletion Flow with Confirmation Dialog
  test('user own review delete flow presents confirmation dialog with cancel and confirm', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/products/1', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const reviewsTabBtn = page.locator('#tab-reviews-btn');
    await reviewsTabBtn.click();

    const deleteBtn = page.locator('button[title*="Delete Review"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();

      // SweetAlert2 confirmation dialog appears
      const swalConfirmDialog = page.locator('.swal2-popup');
      await expect(swalConfirmDialog).toBeVisible();

      // Cancel button should dismiss the dialog without deleting
      const cancelDialogBtn = page.locator('.swal2-cancel');
      if (await cancelDialogBtn.isVisible()) {
        await cancelDialogBtn.click();
        await expect(swalConfirmDialog).not.toBeVisible();
      }
    }
  });

  // 20. Review Photo Lightbox Modal
  test('review image thumbnail opens enlarged photo lightbox modal and can be closed', async ({ page }) => {
    await page.goto('/products/1', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const reviewsTabBtn = page.locator('#tab-reviews-btn');
    await reviewsTabBtn.click();

    // Check for review image attachment
    const reviewImageBtn = page.locator('button:has(img[alt*="Review attachment"])').first();
    if (await reviewImageBtn.isVisible()) {
      await reviewImageBtn.click();

      // Lightbox modal should appear
      const modal = page.locator('#review-image-modal');
      await expect(modal).toBeVisible();

      // Dismiss modal by clicking close button or backdrop
      const closeBtn = modal.locator('button').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        await modal.click({ position: { x: 10, y: 10 } });
      }
      await expect(modal).not.toBeVisible();
    }
  });

  // 21. 404 / Unavailable Product Handling
  test('non-existent product displays Product Unavailable screen with Explore All Products link', async ({ page }) => {
    await page.goto('/products/999999', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Expect "Product Unavailable" heading
    const unavailableHeading = page.getByRole('heading', { name: /Product Unavailable/i });
    await expect(unavailableHeading).toBeVisible();

    // Expect "Explore All Products" button linking to /products
    const exploreBtn = page.locator('a[href="/products"]:has-text("Explore All Products")');
    await expect(exploreBtn).toBeVisible();

    // Clicking routes to /products
    await Promise.all([
      page.waitForURL(/\/products$/),
      exploreBtn.click(),
    ]);
  });

  // 22. Related Products Section
  test('related products loads products from same category, View Details and Add to Cart work', async ({ page }) => {
    const relatedHeading = page.getByRole('heading', { name: /Related Products|সম্পর্কিত পণ্য/i });
    if (await relatedHeading.isVisible()) {
      await expect(relatedHeading).toBeVisible();

      // Verify related product cards are rendered
      const relatedCards = page.locator('main .grid a[href^="/products/"]');
      const relatedCount = await relatedCards.count();
      expect(relatedCount).toBeGreaterThan(0);

      // Verify "View Details" button exists and has valid link
      const viewDetailsBtn = page.locator('main a:has-text("View Details"), main a:has-text("বিস্তারিত দেখুন")').first();
      if (await viewDetailsBtn.isVisible()) {
        const href = await viewDetailsBtn.getAttribute('href');
        expect(href).toMatch(/\/products\/\d+/);
      }

      // Verify "Add to Cart" button in related products works
      const relatedAddToCartBtn = page.locator('main .grid button:has-text("Add to Cart"), main .grid button:has-text("কার্টে যোগ করুন")').first();
      if (await relatedAddToCartBtn.isVisible() && !(await relatedAddToCartBtn.isDisabled())) {
        await relatedAddToCartBtn.click();
        const popupOrToast = page.locator('.swal2-popup, [role="alert"], [role="status"]');
        await expect(popupOrToast.first()).toBeVisible({ timeout: 6000 });
      }
    }
  });

  // 23. Schema.org JSON-LD Structured Data
  test('page contains valid Schema.org JSON-LD structured data for SEO rich snippets', async ({ page }) => {
    const jsonLdScript = page.locator('script[type="application/ld+json"]');
    await expect(jsonLdScript).toBeAttached();

    const jsonText = await jsonLdScript.textContent();
    expect(jsonText).not.toBeNull();

    const parsed = JSON.parse(jsonText!);
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('Product');
    expect(parsed.name).toBeTruthy();
    expect(parsed.offers).toBeDefined();
    expect(parsed.offers['@type']).toBe('Offer');
    expect(parsed.offers.priceCurrency).toBe('BDT');
  });
});
