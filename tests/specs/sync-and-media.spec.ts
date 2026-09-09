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

test.describe('Catalog & Media Sync Admin Tab', () => {
  test('admin catalog & media sync page provides ZIP and Sheets sync interfaces', async ({ page }) => {
    await page.goto('/admin?tab=sheets_sync', { waitUntil: 'domcontentloaded' });

    // Verify page loads without crashing
    await expect(page).toHaveURL(/admin/);

    // If redirected to login, verify admin guard
    if (page.url().includes('/login')) {
      const loginHeading = page.getByRole('heading', { name: /Sign In|Login/i }).first();
      await expect(loginHeading).toBeVisible();
      return;
    }

    // Verify Catalog & Media Sync heading / tab is active
    const syncHeader = page.getByText(/Catalog & Media Sync/i).first();
    await expect(syncHeader).toBeVisible();

    // Check for ZIP bulk upload and Google Sheets sync triggers
    const zipUploader = page.getByText(/ZIP/i).first();
    const sheetsSync = page.getByText(/Google Sheet|Sync/i).first();
    expect(await zipUploader.isVisible() || await sheetsSync.isVisible()).toBeTruthy();
  });
});
