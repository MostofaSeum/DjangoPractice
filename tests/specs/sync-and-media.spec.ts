import { test, expect } from '@playwright/test';

test.describe('Collection Detail Showcase & Product Listings', () => {
  test('collection hero renders full-bleed banner with wave design and header badge', async ({ page }) => {
    // Navigate to collections listing first to pick a valid collection ID
    await page.goto('/collections', { waitUntil: 'domcontentloaded' });
    const firstCollectionLink = page.locator('a[href^="/collections/"]').first();

    if (await firstCollectionLink.isVisible()) {
      await firstCollectionLink.click();
    } else {
      await page.goto('/collections/1', { waitUntil: 'domcontentloaded' });
    }

    // Skip if not found
    const notFound = page.getByText(/Collection not found/i);
    if (await notFound.isVisible()) {
      return;
    }

    // Verify Collection Detail Badge (English or Bengali)
    const badge = page.getByText(/Collection Detail|কালেকশন বিবরণ/i);
    await expect(badge).toBeVisible();

    // Verify Hero title
    const heroTitle = page.locator('h1').first();
    await expect(heroTitle).toBeVisible();

    // Verify Wave SVG divider exists in hero
    const waveSvg = page.locator('svg[preserveAspectRatio="none"]');
    await expect(waveSvg.first()).toBeVisible();

    // Verify "Products in this Collection" section heading
    const sectionHeading = page.getByRole('heading', { name: /Products in this Collection|পণ্যসমূহ/i });
    await expect(sectionHeading).toBeVisible();
  });
});

test.describe('Catalog & Media Sync Admin Route Guard', () => {
  test('unauthenticated users visiting admin are redirected to login', async ({ page }) => {
    // Clear tokens
    await page.addInitScript(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('jwt');
    });

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    // Verify redirected to login
    await expect(page).toHaveURL(/\/login/);
    const loginHeading = page.locator('h1, h2').first();
    await expect(loginHeading).toBeVisible();
  });
});
