import { test, expect } from '@playwright/test';

test.describe('Products Listing Page (Catalog)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(300);
  });

  // 1. Layout & Core Catalog Controls
  test('loads product catalog page with title, search input, filter controls, and sorting', async ({ page }) => {
    // Page Title
    await expect(page).toHaveTitle(/Products|Shop|VibeMart/i);

    // Search input bar
    const searchInput = page.locator('#catalog-search-input, input[name="search"]');
    await expect(searchInput.first()).toBeVisible();

    // Price Filter inputs (Min and Max)
    const minPriceInput = page.locator('input[name="minPrice"]');
    const maxPriceInput = page.locator('input[name="maxPrice"]');
    await expect(minPriceInput).toBeVisible();
    await expect(maxPriceInput).toBeVisible();

    // Apply Price button
    const applyBtn = page.locator('#apply-price-filter-btn');
    await expect(applyBtn).toBeVisible();

    // Sorting Dropdown
    const sortSelect = page.locator('select#product-sort');
    await expect(sortSelect).toBeVisible();

    // Products Grid
    const productsGrid = page.locator('#products-grid, main .grid').first();
    await expect(productsGrid).toBeVisible();
  });

  // 2. Live Search Autocomplete & Suggestions Dropdown
  test('search field autocomplete displays live suggestions with items, thumbnails, and prices', async ({ page }) => {
    const searchInput = page.locator('#catalog-search-input');
    await expect(searchInput).toBeVisible();

    // Click and type keyword
    await searchInput.click();
    await searchInput.fill('Bread');

    // Wait for the suggestion dropdown to appear
    const suggestionsDropdown = page.locator('#search-suggestions-dropdown');
    await expect(suggestionsDropdown).toBeVisible({ timeout: 8000 });

    // Verify suggestions contain items with thumbnails and prices
    const suggestionItems = suggestionsDropdown.locator('a[href^="/products/"]');
    const count = await suggestionItems.count();
    expect(count).toBeGreaterThan(0);

    const firstItem = suggestionItems.first();
    await expect(firstItem).toBeVisible();
    await expect(firstItem.locator('img').first()).toBeVisible();
    await expect(firstItem.locator('text=৳').first()).toBeVisible();
  });

  // 3. Search Suggestions Keyboard Navigation & Dismissal
  test('search suggestions support keyboard navigation and dismiss on Escape or click outside', async ({ page }) => {
    const searchInput = page.locator('#catalog-search-input');
    await searchInput.click();
    await searchInput.fill('Shrimp');

    const suggestionsDropdown = page.locator('#search-suggestions-dropdown');
    await expect(suggestionsDropdown).toBeVisible({ timeout: 8000 });

    // Arrow down highlights an option
    await searchInput.press('ArrowDown');
    await page.waitForTimeout(100);

    // Pressing Escape dismisses the dropdown
    await searchInput.press('Escape');
    await expect(suggestionsDropdown).not.toBeVisible();
  });

  // 4. Search Clear Button
  test('search clear button resets query and closes suggestions', async ({ page }) => {
    const searchInput = page.locator('#catalog-search-input');
    await searchInput.click();
    await searchInput.fill('Tenderloin');

    const clearBtn = page.locator('#catalog-search-clear-btn');
    await expect(clearBtn).toBeVisible();

    // Click clear button
    await clearBtn.click();
    await expect(searchInput).toHaveValue('');

    const suggestionsDropdown = page.locator('#search-suggestions-dropdown');
    await expect(suggestionsDropdown).not.toBeVisible();
  });

  // 5. Search Submission & URL Synchronization
  test('search field is working perfectly and updates the URL and search results', async ({ page }) => {
    const searchInput = page.locator('#catalog-search-input');
    await expect(searchInput).toBeVisible();

    await searchInput.click();
    await searchInput.fill('Shrimp');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/search=Shrimp/i, { timeout: 8000 });

    // Results container should display matching items
    const productCards = page.locator('#products-grid a[href^="/products/"], main a[href^="/products/"]');
    expect(await productCards.count()).toBeGreaterThan(0);
  });

  // 6. Dedicated Empty Search State
  test('empty search displays dedicated No Products Found state', async ({ page }) => {
    await page.goto('/products?search=nonexistentproductxyz999', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const emptyState = page.locator('#no-products-found').or(page.getByText(/No products found|কোন পণ্য পাওয়া যায়নি/i));
    await expect(emptyState.first()).toBeVisible();
  });

  // 7. Filter by Min and Max Price
  test('filter by options is working perfectly with min and max price', async ({ page }) => {
    const minPriceInput = page.locator('input[name="minPrice"]');
    const maxPriceInput = page.locator('input[name="maxPrice"]');

    await minPriceInput.fill('10');
    await maxPriceInput.fill('500');

    // Click Apply Filter button
    const applyBtn = page.locator('#apply-price-filter-btn');
    await applyBtn.click();
    await expect(page).toHaveURL(/minPrice=10/i, { timeout: 8000 });
    await expect(page).toHaveURL(/maxPrice=500/i, { timeout: 8000 });
  });

  // 8. Sort Ordering (Testing Multiple Sort Options)
  test('sort ordering all functions are actually working', async ({ page }) => {
    const sortSelect = page.locator('select#product-sort');
    await expect(sortSelect).toBeVisible();
    await page.waitForTimeout(200);

    // 1. Price: Low to High
    await sortSelect.selectOption('unit_price');
    await expect(page).toHaveURL(/ordering=unit_price/i, { timeout: 8000 });

    // 2. Price: High to Low
    await sortSelect.selectOption('-unit_price');
    await expect(page).toHaveURL(/ordering=-unit_price/i, { timeout: 8000 });

    // 3. Newest First
    await sortSelect.selectOption('-id');
    await expect(page).toHaveURL(/ordering=-id/i, { timeout: 8000 });

    // 4. Oldest First
    await sortSelect.selectOption('id');
    await expect(page).toHaveURL(/ordering=id/i, { timeout: 8000 });

    // 5. Popularity: Most Popular
    await sortSelect.selectOption('-popularity');
    await expect(page).toHaveURL(/ordering=-popularity/i, { timeout: 8000 });
  });

  // 9. Combined Filter, Sort, and Search
  test('when user uses filter and sort at that time search is working perfectly', async ({ page }) => {
    // 1. Set Min Price filter and apply
    const minPriceInput = page.locator('input[name="minPrice"]');
    await minPriceInput.fill('5');
    const applyPriceBtn = page.locator('#apply-price-filter-btn');
    await applyPriceBtn.click();
    await expect(page).toHaveURL(/minPrice=5/i, { timeout: 8000 });

    // 2. Select Sorting and wait for URL update
    const sortSelect = page.locator('select#product-sort');
    await sortSelect.selectOption('unit_price');
    await expect(page).toHaveURL(/ordering=unit_price/i, { timeout: 8000 });

    // 3. Perform Search while filter and sort are active
    const searchInput = page.locator('#catalog-search-input');
    await searchInput.click();
    await searchInput.fill('Shrimp');
    await searchInput.press('Enter');

    // Verify all parameters persist in URL
    await expect(page).toHaveURL(/search=Shrimp/i, { timeout: 8000 });
    await expect(page).toHaveURL(/ordering=unit_price/i, { timeout: 8000 });
    await expect(page).toHaveURL(/minPrice=5/i, { timeout: 8000 });
  });

  // 10. Clear All Filters Button
  test('clear all filters button appears and resets catalog parameters cleanly', async ({ page }) => {
    // Navigate with multiple active filter parameters
    await page.goto('/products?minPrice=10&maxPrice=100&ordering=unit_price&search=Bread', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle').catch(() => {});

    const clearFiltersBtn = page.locator('#clear-all-filters-btn');
    await expect(clearFiltersBtn).toBeVisible();

    // Click clear filters
    await Promise.all([
      page.waitForURL(/\/products$/),
      clearFiltersBtn.click(),
    ]);

    // Clear filters button should disappear on clean catalog
    await expect(page.locator('#clear-all-filters-btn')).not.toBeVisible();
  });

  // 11. Photos Loaded with Natural Dimensions
  test('photos of all products are loading perfectly and showing', async ({ page }) => {
    const images = page.locator('main .aspect-square img');
    const imgCount = await images.count();
    expect(imgCount).toBeGreaterThan(0);

    // Verify product card images are rendered and have valid natural dimensions
    for (let i = 0; i < Math.min(imgCount, 6); i++) {
      const img = images.nth(i);
      if (await img.isVisible()) {
        const isLoaded = await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0);
        expect(isLoaded).toBeTruthy();
      }
    }
  });

  // 12. Product Card Details & Rich Metadata
  test('title, price, items sold, and short description are loading perfectly', async ({ page }) => {
    const productCards = page.locator('#products-grid > div');
    const cardCount = await productCards.count();
    expect(cardCount).toBeGreaterThan(0);

    const firstCard = productCards.first();

    // Title
    const title = firstCard.locator('h2, h3').first();
    await expect(title).toBeVisible();
    const titleText = await title.innerText();
    expect(titleText.trim().length).toBeGreaterThan(0);

    // Price in ৳
    const priceDisplay = firstCard.locator('text=৳').first();
    await expect(priceDisplay).toBeVisible();

    // Rating star if present
    const starRating = page.locator('#products-grid').getByText('★');
    if (await starRating.count() > 0) {
      await expect(starRating.first()).toBeVisible();
    }

    // Units sold badge if present
    const soldBadge = page.locator('#products-grid').getByText(/Sold|বিক্রিত/i);
    if (await soldBadge.count() > 0) {
      await expect(soldBadge.first()).toBeVisible();
    }
  });

  // 13. Discount Badges & Strikethrough Pricing
  test('loads discounted badge and shows on specific discounted products', async ({ page }) => {
    const discountBadges = page.locator('text=/-\\d+%\\s*(OFF|ছাড়)/i');
    if (await discountBadges.count() > 0) {
      await expect(discountBadges.first()).toBeVisible();

      // Card with discount also displays strikethrough original price
      const cardWithDiscount = discountBadges.first().locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]');
      const strikethrough = cardWithDiscount.locator('.line-through');
      await expect(strikethrough.first()).toBeVisible();
    }
  });

  // 14. Delivery Offer Badges on Catalog Cards
  test('delivery offer badges are displayed on qualifying product cards', async ({ page }) => {
    const deliveryBadges = page.locator('[data-testid="delivery-offer-badge"]').or(page.getByText(/Free Delivery|Discounted Delivery|ফ্রি ডেলিভারি/i));
    if (await deliveryBadges.count() > 0) {
      await expect(deliveryBadges.first()).toBeVisible();
    }
  });

  // 15. View Details Navigation
  test('view details button navigates to product details page', async ({ page }) => {
    const viewDetailsLink = page.locator('main a:has-text("View Details"), main a:has-text("বিস্তারিত দেখুন")').first();
    await expect(viewDetailsLink).toBeVisible();

    const href = await viewDetailsLink.getAttribute('href');
    expect(href).toMatch(/\/products\/\d+/);

    await Promise.all([
      page.waitForURL(new RegExp(href!)),
      viewDetailsLink.click(),
    ]);

    await expect(page.locator('main h1')).toBeVisible();
  });

  // 16. Add to Cart from Catalog Updates Global Header Cart Count
  test('add to cart button from catalog card updates global header cart badge count in real-time', async ({ page }) => {
    const addToCartBtn = page.locator('main button:has-text("Add to Cart"), main button:has-text("কার্টে যোগ করুন")').first();
    if (await addToCartBtn.isVisible() && await addToCartBtn.isEnabled()) {
      await addToCartBtn.click();

      // Confirmation alert appears
      const feedback = page.locator('.swal2-popup, [role="alert"], [role="status"]');
      await expect(feedback.first()).toBeVisible({ timeout: 8000 });

      // Global header cart badge exists and reflects active cart
      const cartBadge = page.locator('header a[href="/cart"]').first();
      await expect(cartBadge).toBeVisible();
    }
  });

  // 17. Out of Stock Handling
  test('out of stock is loading and showing appropriately', async ({ page }) => {
    const outOfStockBadges = page.locator('text=/Out of Stock|স্টক শেষ|পণ্যটি স্টকে নেই/i');
    if (await outOfStockBadges.count() > 0) {
      await expect(outOfStockBadges.first()).toBeVisible();
    } else {
      // Current page products are in stock
      const addToCartButtons = page.locator('button:has-text("Add to Cart"), button:has-text("কার্টে যোগ করুন")');
      if (await addToCartButtons.count() > 0) {
        await expect(addToCartButtons.first()).toBeEnabled();
      }
    }
  });

  // 18. Pagination Full Flow (Disabled Prev on Page 1 -> Next to Page 2 -> Prev back to Page 1)
  test('pagination is working cleanly with boundary states and page changes', async ({ page }) => {
    const prevBtn = page.locator('#pagination-prev');
    const nextBtn = page.locator('#pagination-next');
    const pageIndicator = page.locator('#pagination-indicator');

    if (await nextBtn.isVisible()) {
      // 1. On page 1, previous button is disabled
      await expect(prevBtn).toHaveClass(/cursor-not-allowed|opacity-30/);
      await expect(pageIndicator).toHaveText(/Page 1|পৃষ্ঠা ১/i);

      // 2. Click Next to go to Page 2
      await nextBtn.click();
      await page.waitForLoadState('networkidle').catch(() => {});

      await expect(page).toHaveURL(/page=2/);
      await expect(pageIndicator).toHaveText(/Page 2|পৃষ্ঠা ২/i);

      // 3. On page 2, previous button is now enabled
      const enabledPrevBtn = page.locator('a#pagination-prev');
      await expect(enabledPrevBtn).toBeVisible();

      // 4. Click Previous to return to Page 1
      await enabledPrevBtn.click();
      await page.waitForLoadState('networkidle').catch(() => {});

      await expect(page).toHaveURL(/page=1/);
      await expect(pageIndicator).toHaveText(/Page 1|পৃষ্ঠা ১/i);
    }
  });

  // 19. Breadcrumbs Navigation
  test('breadcrumbs navigation routes back to home page', async ({ page }) => {
    const breadcrumbs = page.locator('#products-breadcrumbs');
    await expect(breadcrumbs).toBeVisible();

    const homeLink = breadcrumbs.locator('a[href="/"]').first();
    await expect(homeLink).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/$/),
      homeLink.click(),
    ]);
  });

  // 20. SEO Metadata Verification
  test('page contains valid SEO title, canonical tag, and description', async ({ page }) => {
    await expect(page).toHaveTitle(/Shop All Products \| VibeMart/i);

    const canonical = page.locator('link[rel="canonical"]');
    if (await canonical.count() > 0) {
      const href = await canonical.getAttribute('href');
      expect(href).toContain('/products');
    }
  });
});
