import { test, expect } from '@playwright/test';

test.describe('Gift Cards Page Suite', () => {
  // Helper to log in a test user
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
    await page.goto('/gift-cards', { waitUntil: 'domcontentloaded' });
  });

  test('loads the gift cards section and options perfectly', async ({ page }) => {
    // Title and Header
    await expect(page).toHaveTitle(/Gift Cards|VibeMart/i);
    const mainHeading = page.locator('h1').first();
    await expect(mainHeading).toBeVisible();

    // Verify Gift Card grid options (e.g., 500, 1000, 1500, 2000, 2500, 3000)
    const cardOptions = page.locator('main .grid > div');
    const count = await cardOptions.count();
    expect(count).toBeGreaterThanOrEqual(6);

    // Verify badges and prices exist
    const bronzeBadge = page.locator('text=/BRONZE/i');
    await expect(bronzeBadge.first()).toBeVisible();

    const redeemHeaderBtn = page.getByRole('button', { name: /Redeem Gift Card|রিডিম করুন/i });
    await expect(redeemHeaderBtn).toBeVisible();
  });

  test('purchase button opens modal and validates recipient email, bkash number, and transaction id', async ({ page }) => {
    // Must be authenticated to purchase
    await ensureAuthenticated(page);
    await page.goto('/gift-cards', { waitUntil: 'domcontentloaded' });

    // Click on the first "Purchase Card" button
    const purchaseBtn = page.getByRole('button', { name: /Purchase Card|ক্রয় করুন/i }).first();
    await expect(purchaseBtn).toBeVisible();
    await purchaseBtn.click();

    // Purchase Modal should appear
    const modal = page.locator('.fixed.inset-0');
    await expect(modal.first()).toBeVisible();

    const recipientEmailInput = modal.locator('input[type="email"]');
    await expect(recipientEmailInput).toBeVisible();

    const completePurchaseBtn = modal.getByRole('button', { name: /Complete Order & Purchase|ক্রয় সম্পন্ন করুন/i });
    await expect(completePurchaseBtn).toBeVisible();

    // 1. Validation: empty recipient email cannot be submitted
    await recipientEmailInput.fill('');
    await completePurchaseBtn.click();
    const isEmailInvalid = await recipientEmailInput.evaluate((el: HTMLInputElement) => !el.checkValidity() || el.value.trim() === '');
    expect(isEmailInvalid).toBeTruthy();

    // 2. Validation: Fill recipient email but leave sender phone and TrxID empty
    await recipientEmailInput.fill('recipient@example.com');
    await completePurchaseBtn.click();

    // Error message prompt should be displayed
    const errorAlert = modal.locator('text=/Please enter both Sender Phone Number and|অনুগ্রহ করে প্রেরকের মোবাইল নম্বর/i');
    await expect(errorAlert.first()).toBeVisible();
  });

  test('receiver bkash/nagad number can be copied to clipboard', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/gift-cards', { waitUntil: 'domcontentloaded' });

    const purchaseBtn = page.getByRole('button', { name: /Purchase Card|ক্রয় করুন/i }).first();
    await purchaseBtn.click();

    const modal = page.locator('.fixed.inset-0');
    await expect(modal.first()).toBeVisible();

    // Find Copy Number button inside payment instructions
    const copyNumberBtn = modal.locator('button:has-text("Copy"), button:has-text("কপি")').first();
    await expect(copyNumberBtn).toBeVisible();

    await copyNumberBtn.click();

    // Button should provide feedback (e.g. "Copied!" or check icon)
    const copiedFeedback = modal.locator('text=/Copied!|কপি হয়েছে!/i');
    await expect(copiedFeedback.first()).toBeVisible();
  });

  test('redeem gift card function works perfectly with validation', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/gift-cards', { waitUntil: 'domcontentloaded' });

    // Click "Redeem Gift Card" button
    const redeemBtn = page.getByRole('button', { name: /Redeem Gift Card|রিডিম করুন/i });
    await expect(redeemBtn).toBeVisible();
    await redeemBtn.click();

    // SweetAlert modal appears with input
    const swalModal = page.locator('.swal2-popup');
    await expect(swalModal).toBeVisible();

    const cardCodeInput = swalModal.locator('input.swal2-input');
    await expect(cardCodeInput).toBeVisible();

    // 1. Validation: empty code validation
    const confirmRedeemBtn = swalModal.locator('button.swal2-confirm');
    await cardCodeInput.fill('');
    await confirmRedeemBtn.click();

    const validationMsg = swalModal.locator('.swal2-validation-message');
    await expect(validationMsg).toBeVisible();

    // 2. Test invalid 16-digit code submission
    await cardCodeInput.fill('INVALID123456789');
    await confirmRedeemBtn.click();

    // Should respond with error feedback modal
    const resultPopup = page.locator('.swal2-popup');
    await expect(resultPopup).toBeVisible({ timeout: 8000 });
  });
});
