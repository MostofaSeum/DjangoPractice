import { test, expect } from '@playwright/test';

test.describe('Collections Listing & Detail Pages', () => {
  test('collections listing page displays page title, headings, and collection cards', async ({ page }) => {
    await page.goto('/collections', { waitUntil: 'domcontentloaded' });

    // Page title or Heading
    await expect(page).toHaveTitle(/Collections|Categories|VibeMart/i);
    const mainHeading = page.getByRole('heading', { name: /Product Categories|Collections/i }).first();
    await expect(mainHeading).toBeVisible();

    // Check collection cards or empty state message
    const collectionCards = page.locator('a[href^="/collections/"]');
    const emptyState = page.getByText(/No collections available/i);

    const hasCards = (await collectionCards.count()) > 0;
    const hasEmpty = (await emptyState.count()) > 0;
    expect(hasCards || hasEmpty).toBeTruthy();
  });

  test('clicking a collection card navigates to its detail page', async ({ page }) => {
    await page.goto('/collections', { waitUntil: 'domcontentloaded' });

    const firstCard = page.locator('a[href^="/collections/"]').first();
    if ((await firstCard.count()) > 0) {
      await firstCard.click();
      await expect(page).toHaveURL(/\/collections\/\d+/);
    }
  });

  test('collection detail page renders collection title and its products grid', async ({ page }) => {
    // Navigate directly to collection 1 (or fallback)
    await page.goto('/collections/1', { waitUntil: 'domcontentloaded' });

    const notFound = page.getByText(/Collection not found/i);
    if (await notFound.isVisible()) {
      await expect(notFound).toBeVisible();
      const backLink = page.getByRole('link', { name: /Back to Categories|Collections/i });
      await expect(backLink).toBeVisible();
      return;
    }

    // Collection title
    const collectionTitle = page.locator('h1, h2').first();
    await expect(collectionTitle).toBeVisible();

    // Back to collections link
    const backBtn = page.getByRole('link', { name: /Categories|Collections/i }).first();
    await expect(backBtn).toBeVisible();

    // Product cards or empty message
    const productCards = page.locator('a[href^="/products/"]');
    const noProductsMsg = page.getByText(/No products found in this collection/i);
    const hasProducts = (await productCards.count()) > 0;
    const hasNoProd = (await noProductsMsg.count()) > 0;
    expect(hasProducts || hasNoProd).toBeTruthy();
  });
});
