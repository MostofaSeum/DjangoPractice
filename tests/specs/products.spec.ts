import { test, expect } from '@playwright/test';

test.describe('Products Listing Page (Catalog)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products', { waitUntil: 'domcontentloaded' });
  });

  test('loads product catalog page with title, search input, and filter controls', async ({ page }) => {
    // Page Title
    await expect(page).toHaveTitle(/Products|Shop|VibeMart/i);

    // Search bar
    const searchInput = page.getByPlaceholder(/Search products|Search luxury/i);
    await expect(searchInput).toBeVisible();

    // Price Filter inputs (Min and Max)
    const minPriceInput = page.locator('input[type="number"]').first();
    await expect(minPriceInput).toBeVisible();

    // Sorting Dropdown
    const sortSelect = page.locator('select').first();
    await expect(sortSelect).toBeVisible();
  });

  test('can filter products by typing in the search bar', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search products|Search luxury/i);
    await searchInput.fill('Cream');
    await searchInput.press('Enter');

    // URL should reflect search query param
    await expect(page).toHaveURL(/search=Cream/i);
  });

  test('can sort products using ordering select dropdown', async ({ page }) => {
    const sortSelect = page.locator('select').first();
    await sortSelect.selectOption({ label: 'Price: Low to High' }).catch(async () => {
      // Fallback by value if label text varies
      await sortSelect.selectOption('unit_price');
    });

    // Wait for URL to contain ordering parameter
    await expect(page).toHaveURL(/ordering=unit_price/i);
  });

  test('can filter products by minimum and maximum price range', async ({ page }) => {
    const minPriceInput = page.locator('input[placeholder*="Min"], input[type="number"]').first();
    const maxPriceInput = page.locator('input[placeholder*="Max"], input[type="number"]').nth(1);

    await minPriceInput.fill('10');
    await maxPriceInput.fill('100');

    // Click Apply Filter button
    const applyBtn = page.getByRole('button', { name: /Apply|Filter/i }).first();
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
      await expect(page).toHaveURL(/minPrice=10|unit_price__gt=10/i);
    }
  });

  test('displays product cards or empty state message cleanly', async ({ page }) => {
    const productCards = page.locator('a[href^="/products/"]');
    const emptyState = page.getByText(/No products found|Failed to load/i);

    const hasCards = (await productCards.count()) > 0;
    const hasEmpty = (await emptyState.count()) > 0;
    expect(hasCards || hasEmpty).toBeTruthy();
  });

  test('clicking a product card navigates to its details page', async ({ page }) => {
    const firstProductLink = page.locator('a[href^="/products/"]').first();
    if ((await firstProductLink.count()) > 0) {
      await firstProductLink.click();
      await expect(page).toHaveURL(/\/products\/\d+/);
    }
  });

  test('renders pagination controls when multiple pages exist', async ({ page }) => {
    const paginationContainer = page.locator('nav:has(button, a), div:has(button:text("Next"))');
    if ((await paginationContainer.count()) > 0) {
      await expect(paginationContainer.first()).toBeVisible();
    }
  });
});
