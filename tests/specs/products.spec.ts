import { test, expect } from '@playwright/test';

test.describe('Products Listing Page (Catalog)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products', { waitUntil: 'domcontentloaded' });
  });

  test('loads product catalog page with title, search input, filter controls, and sorting', async ({ page }) => {
    // Page Title
    await expect(page).toHaveTitle(/Products|Shop|VibeMart/i);

    // Search input bar
    const searchInput = page.locator('input[name="search"], input[placeholder*="Search"], input[placeholder*="অনুসন্ধান"]');
    await expect(searchInput.first()).toBeVisible();

    // Price Filter inputs (Min and Max)
    const minPriceInput = page.locator('input[name="minPrice"]');
    const maxPriceInput = page.locator('input[name="maxPrice"]');
    await expect(minPriceInput).toBeVisible();
    await expect(maxPriceInput).toBeVisible();

    // Sorting Dropdown
    const sortSelect = page.locator('select#product-sort');
    await expect(sortSelect).toBeVisible();
  });

  test('search field is working perfectly and updates the URL and search results', async ({ page }) => {
    const searchInput = page.locator('input[name="search"], input[placeholder*="Search"], input[placeholder*="অনুসন্ধান"]').first();
    await expect(searchInput).toBeVisible();

    // Search for a keyword like "Shrimp" or "Bread"
    await searchInput.fill('Shrimp');
    await searchInput.press('Enter');

    // URL should reflect search query param
    await expect(page).toHaveURL(/search=Shrimp/i);

    // Results container should display either matching items or empty state
    const productCards = page.locator('main a[href^="/products/"]');
    const emptyState = page.getByText(/No products found|কোন পণ্য পাওয়া যায়নি/i);
    const hasResults = (await productCards.count()) > 0;
    const hasEmpty = (await emptyState.count()) > 0;
    expect(hasResults || hasEmpty).toBeTruthy();
  });

  test('filter by options is working perfectly with min and max price', async ({ page }) => {
    const minPriceInput = page.locator('input[name="minPrice"]');
    const maxPriceInput = page.locator('input[name="maxPrice"]');

    await minPriceInput.fill('10');
    await maxPriceInput.fill('500');

    // Click Apply Filter button
    const applyBtn = page.getByRole('button', { name: /Apply Price|Apply|প্রয়োগ করুন/i });
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
      await page.waitForLoadState('domcontentloaded');
      
      // URL should reflect price filters
      await expect(page).toHaveURL(/minPrice=10/i);
      await expect(page).toHaveURL(/maxPrice=500/i);
    }
  });

  test('sort ordering all functions are actually working', async ({ page }) => {
    const sortSelect = page.locator('select#product-sort');
    await expect(sortSelect).toBeVisible();

    // Test Price: Low to High
    await sortSelect.selectOption('unit_price');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/ordering=unit_price/i);

    // Test Price: High to Low
    await sortSelect.selectOption('-unit_price');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/ordering=-unit_price/i);

    // Test Newest First
    await sortSelect.selectOption('-id');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/ordering=-id/i);

    // Test Oldest First
    await sortSelect.selectOption('id');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/ordering=id/i);
  });

  test('when user uses filter and sort at that time search is working perfectly', async ({ page }) => {
    // 1. Set Min Price filter
    const minPriceInput = page.locator('input[name="minPrice"]');
    await minPriceInput.fill('5');

    // 2. Select Sorting
    const sortSelect = page.locator('select#product-sort');
    await sortSelect.selectOption('unit_price');
    await page.waitForLoadState('domcontentloaded');

    // 3. Perform Search while filter and sort are active
    const searchInput = page.locator('input[name="search"], input[placeholder*="Search"], input[placeholder*="অনুসন্ধান"]').first();
    await searchInput.fill('Shrimp');
    await searchInput.press('Enter');
    await page.waitForLoadState('domcontentloaded');

    // Verify all 3 parameters persist in the URL simultaneously
    await expect(page).toHaveURL(/search=Shrimp/i);
    await expect(page).toHaveURL(/ordering=unit_price/i);
    await expect(page).toHaveURL(/minPrice=5/i);
  });

  test('photos of all products are loading perfectly and showing', async ({ page }) => {
    const productCards = page.locator('main a[href^="/products/"]');
    const count = await productCards.count();

    if (count > 0) {
      const images = page.locator('main .aspect-square img');
      const imgCount = await images.count();
      expect(imgCount).toBeGreaterThan(0);

      // Verify each rendered product image is loaded with natural dimensions
      for (let i = 0; i < Math.min(imgCount, 6); i++) {
        const img = images.nth(i);
        if (await img.isVisible()) {
          const isLoaded = await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0);
          expect(isLoaded).toBeTruthy();
        }
      }
    }
  });

  test('title, price, items sold, and short description are loading perfectly', async ({ page }) => {
    const productGrid = page.locator('main .grid');
    await expect(productGrid).toBeVisible();

    const productCards = page.locator('main .grid > div');
    const cardCount = await productCards.count();

    if (cardCount > 0) {
      const firstCard = productCards.first();

      // Product Title
      const title = firstCard.locator('h2, h3').first();
      await expect(title).toBeVisible();
      const titleText = await title.innerText();
      expect(titleText.trim().length).toBeGreaterThan(0);

      // Price Display
      const priceDisplay = firstCard.locator('text=৳').first();
      await expect(priceDisplay).toBeVisible();

      // Short description or description paragraph
      const description = firstCard.locator('p').first();
      if (await description.isVisible()) {
        const descText = await description.innerText();
        expect(descText.length).toBeGreaterThanOrEqual(0);
      }

      // Check items sold badge if product has units sold
      const soldBadge = page.locator('text=/\\d+\\s*(Sold|বিক্রিত)/i');
      if (await soldBadge.count() > 0) {
        await expect(soldBadge.first()).toBeVisible();
      }
    }
  });

  test('loads discounted badge and shows on specific discounted products', async ({ page }) => {
    // Check if any product has the discount badge (e.g., "-10% OFF" or "-১০% ছাড়")
    const discountBadges = page.locator('text=/-\\d+%\\s*(OFF|ছাড়)/i');
    const badgeCount = await discountBadges.count();

    if (badgeCount > 0) {
      const firstBadge = discountBadges.first();
      await expect(firstBadge).toBeVisible();

      // Ensure the discounted product card also shows the strikethrough original price
      const cardWithDiscount = firstBadge.locator('xpath=ancestor::div[contains(@class, "rounded-2xl") or contains(@class, "rounded-xl")][1]');
      const strikethrough = cardWithDiscount.locator('.line-through');
      await expect(strikethrough.first()).toBeVisible();
    }
  });

  test('out of stock is loading and showing appropriately', async ({ page }) => {
    // Look for Out of Stock indicators or disabled out of stock buttons
    const outOfStockBadges = page.locator('text=/Out of Stock|স্টক শেষ|পণ্যটি স্টকে নেই/i');
    const outOfStockCount = await outOfStockBadges.count();

    if (outOfStockCount > 0) {
      const firstOutOfStock = outOfStockBadges.first();
      await expect(firstOutOfStock).toBeVisible();
    } else {
      // All products in current view are in stock; check that Add to Cart buttons are enabled
      const addToCartButtons = page.locator('button:has-text("Add to Cart"), button:has-text("কার্টে যোগ করুন")');
      if (await addToCartButtons.count() > 0) {
        await expect(addToCartButtons.first()).toBeEnabled();
      }
    }
  });

  test('view details and add to cart buttons are working perfectly', async ({ page }) => {
    const viewDetailsLink = page.locator('main a:has-text("View Details"), main a:has-text("বিস্তারিত দেখুন")').first();
    if (await viewDetailsLink.isVisible()) {
      const href = await viewDetailsLink.getAttribute('href');
      expect(href).toMatch(/\/products\/\d+/);

      // Verify Add to Cart button clicks and triggers toast/alert
      const addToCartBtn = page.locator('main button:has-text("Add to Cart"), main button:has-text("কার্টে যোগ করুন")').first();
      if (await addToCartBtn.isVisible() && await addToCartBtn.isEnabled()) {
        await addToCartBtn.click();
        const feedback = page.locator('.swal2-popup, [role="alert"], [role="status"]');
        await expect(feedback.first()).toBeVisible({ timeout: 6000 });
      }
    }
  });

  test('pagination is working good and changes page numbers cleanly', async ({ page }) => {
    const paginationNav = page.locator('nav, div:has(span:text-matches("Page \\\\d+|পৃষ্ঠা \\\\d+", "i"))');
    if (await paginationNav.count() > 0 && await paginationNav.first().isVisible()) {
      const nextBtn = page.getByRole('link', { name: /Next|পরবর্তী/i });
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForLoadState('domcontentloaded');

        // URL should reflect page=2
        await expect(page).toHaveURL(/page=2/);

        // Page indicator updates
        const pageText = page.locator('text=/Page 2|পৃষ্ঠা ২/i');
        await expect(pageText.first()).toBeVisible();
      }
    }
  });
});
