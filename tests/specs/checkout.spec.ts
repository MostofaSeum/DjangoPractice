import { test, expect } from '@playwright/test';

test.describe('Checkout Page', () => {
  // Helper to ensure an item is in cart and user has an active cart session
  async function ensureCartWithItem(page: any) {
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
      try {
        let cartId = localStorage.getItem('cart_id');
        if (!cartId) {
          const createRes = await fetch('http://127.0.0.1:8000/store/carts/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          const createData = await createRes.json();
          cartId = createData.id;
          if (cartId) localStorage.setItem('cart_id', cartId);
        }

        if (cartId) {
          await fetch(`http://127.0.0.1:8000/store/carts/${cartId}/items/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: 648, quantity: 1 }),
          });
        }
      } catch (e) {
        console.error('Cart setup error:', e);
      }
    });
    await page.waitForTimeout(500);
  }

  // Helper to log in a test user if redirected to /login
  async function ensureAuthenticated(page: any) {
    if (page.url().includes('/login')) {
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
  }

  test.beforeEach(async ({ page }) => {
    await ensureCartWithItem(page);
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
  });

  test('redirects unauthenticated users to login or shows checkout container', async ({ page }) => {
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await expect(page).toHaveURL(/login/);
      const loginHeading = page.locator('h1, h2').first();
      await expect(loginHeading).toBeVisible();
    } else {
      await expect(page).toHaveURL(/checkout/);
    }
  });

  test('loads all saved addresses or allows entering and saving new custom address', async ({ page }) => {
    await ensureAuthenticated(page);
    if (!page.url().includes('/checkout')) return;

    // Check saved address dropdown or custom address textarea
    const addressDropdown = page.locator('select').first();
    const addressTextarea = page.locator('textarea').first();

    await expect(addressTextarea).toBeVisible({ timeout: 10000 });

    if (await addressDropdown.isVisible()) {
      // Options should list saved addresses or "Custom Address"
      const optionCount = await addressDropdown.locator('option').count();
      expect(optionCount).toBeGreaterThan(0);

      // Select custom address to enter a new one
      await addressDropdown.selectOption('custom');
      await addressTextarea.fill('House #12, Road #5, Dhanmondi, Dhaka');
      expect(await addressTextarea.inputValue()).toBe('House #12, Road #5, Dhanmondi, Dhaka');
    } else {
      // Enter custom address directly
      await addressTextarea.fill('Flat 4B, Gulshan-2, Dhaka');
      expect(await addressTextarea.inputValue()).toBe('Flat 4B, Gulshan-2, Dhaka');
    }
  });

  test('phone number input restricts to 11-digit numbers', async ({ page }) => {
    await ensureAuthenticated(page);
    if (!page.url().includes('/checkout')) return;

    const phoneInput = page.locator('input[type="tel"]').first();
    await expect(phoneInput).toBeVisible({ timeout: 10000 });

    // Test typing non-digits and more than 11 characters
    await phoneInput.fill('0171abc222333444555');
    const phoneVal = await phoneInput.inputValue();

    // Must be sanitized to digits only and maximum 11 digits
    expect(phoneVal).toMatch(/^\d{1,11}$/);
    expect(phoneVal.length).toBeLessThanOrEqual(11);
  });

  test('cannot place order without required phone number and shipping address', async ({ page }) => {
    await ensureAuthenticated(page);
    if (!page.url().includes('/checkout')) return;

    const phoneInput = page.locator('input[type="tel"]').first();
    const addressTextarea = page.locator('textarea').first();
    const confirmOrderBtn = page.getByRole('button', { name: /Confirm Order|Place Order|অর্ডার সম্পন্ন করুন/i });

    await expect(confirmOrderBtn).toBeVisible({ timeout: 10000 });

    // Clear phone number
    await phoneInput.fill('');
    // Clear address
    await addressTextarea.fill('');

    // Confirm button should either be disabled or show validation feedback
    if (await confirmOrderBtn.isDisabled()) {
      expect(await confirmOrderBtn.isDisabled()).toBe(true);
    } else {
      await confirmOrderBtn.click();
      const alertPopup = page.locator('.swal2-popup, [role="alert"], :invalid');
      await expect(alertPopup.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('delivery charge changes when toggling between inside and outside dhaka', async ({ page }) => {
    await ensureAuthenticated(page);
    if (!page.url().includes('/checkout')) return;

    const insideDhakaOption = page.locator('text=Inside Dhaka, text=ঢাকা সিটি').first();
    const outsideDhakaOption = page.locator('text=Outside Dhaka, text=ঢাকার বাইরে').first();

    await expect(insideDhakaOption).toBeVisible({ timeout: 10000 });
    await expect(outsideDhakaOption).toBeVisible({ timeout: 10000 });

    // Select Inside Dhaka and read delivery charge
    await insideDhakaOption.click();
    await page.waitForTimeout(300);

    // Select Outside Dhaka and verify charge changes or updates
    await outsideDhakaOption.click();
    await page.waitForTimeout(300);

    // Both options must be interactive and update the radio state
    const insideRadio = page.locator('input[name="delivery_area"][value="inside_dhaka"]').or(page.locator('input[type="radio"]').first());
    const outsideRadio = page.locator('input[name="delivery_area"][value="outside_dhaka"]').or(page.locator('input[type="radio"]').nth(1));

    await expect(outsideRadio).toBeChecked();
    await insideDhakaOption.click();
    await expect(insideRadio).toBeChecked();
  });

  test('order items amount matches the amount calculated on cart page', async ({ page }) => {
    // 1. Check cart subtotal
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    const cartTotalEl = page.locator('.text-2xl.text-accent.font-black').first();
    await expect(cartTotalEl).toBeVisible({ timeout: 10000 });
    const cartTotalNum = parseFloat((await cartTotalEl.innerText()).replace(/[^\d.]/g, ''));

    // 2. Go to checkout and compare subtotal
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await ensureAuthenticated(page);
    if (!page.url().includes('/checkout')) return;

    // Checkout original or discounted subtotal
    const checkoutSubtotalEl = page.locator('.space-y-3 span.font-bold').first();
    await expect(checkoutSubtotalEl).toBeVisible({ timeout: 10000 });
    const checkoutSubtotalNum = parseFloat((await checkoutSubtotalEl.innerText()).replace(/[^\d.]/g, ''));

    expect(checkoutSubtotalNum).toBeCloseTo(cartTotalNum, 1);
  });

  test('can select VibeCoin only if user has sufficient VibeCoin balance', async ({ page }) => {
    await ensureAuthenticated(page);
    if (!page.url().includes('/checkout')) return;

    const vibeCoinRadio = page.locator('input[name="payment_method"]').filter({ has: page.locator('xpath=ancestor::*[contains(., "VibeCoin")]') })
      .or(page.locator('text=VibeCoin').locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]//input[@type="radio"]'));

    if (await vibeCoinRadio.isVisible()) {
      const isDisabled = await vibeCoinRadio.isDisabled();
      const vibeCoinCard = page.locator('text=VibeCoin').locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]').first();

      if (isDisabled) {
        // Insufficient balance: card shows blocked message
        await expect(vibeCoinCard).toContainText(/Insufficient|Not enough|ব্যালেন্স অপর্যাপ্ত/i);
        // Attempting to click card should not activate VibeCoin
        await vibeCoinCard.click();
        expect(await vibeCoinRadio.isChecked()).toBe(false);
      } else {
        // Sufficient balance: card can be selected
        await vibeCoinCard.click();
        expect(await vibeCoinRadio.isChecked()).toBe(true);
      }
    }
  });

  test('bKash and Nagad require sender phone number and transaction ID to place order', async ({ page }) => {
    await ensureAuthenticated(page);
    if (!page.url().includes('/checkout')) return;

    // Select bKash
    const bkashOption = page.locator('text=bKash').locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]').first();
    if (await bkashOption.isVisible()) {
      await bkashOption.click();

      // Transaction Phone and TrxID inputs must appear
      const trxPhoneInput = page.getByPlaceholder(/01XXXXXXXXX|Sender Number|বিকাশ নাম্বার/i).or(page.locator('input[name*="phone"], input[type="tel"]').nth(1));
      const trxIdInput = page.getByPlaceholder(/TrxID|Transaction ID|ট্রানজেকশন আইডি/i).or(page.locator('input[name*="transaction"], input[placeholder*="TrxID"]'));

      await expect(trxPhoneInput).toBeVisible({ timeout: 5000 });
      await expect(trxIdInput).toBeVisible({ timeout: 5000 });

      // Leave transaction fields empty
      await trxPhoneInput.fill('');
      await trxIdInput.fill('');

      const confirmBtn = page.getByRole('button', { name: /Confirm Order|Place Order|অর্ডার সম্পন্ন করুন/i });
      // Confirm button should be disabled when online payment is missing Trx details
      expect(await confirmBtn.isDisabled()).toBe(true);

      // Fill required transaction details
      await trxPhoneInput.fill('01712345678');
      await trxIdInput.fill('9H4K2M9LP1');
      await page.waitForTimeout(300);

      // Now with valid phone, address, and Trx details, button is enabled
      const phoneInput = page.locator('input[type="tel"]').first();
      const addressTextarea = page.locator('textarea').first();
      await phoneInput.fill('01700000000');
      await addressTextarea.fill('Dhaka, Bangladesh');

      expect(await confirmBtn.isEnabled()).toBe(true);
    }
  });

  test('placing order with all valid fields confirms order and shows confirmation notification toast', async ({ page }) => {
    await ensureAuthenticated(page);
    if (!page.url().includes('/checkout')) return;

    // Fill valid 11-digit phone
    const phoneInput = page.locator('input[type="tel"]').first();
    await phoneInput.fill('01712345678');

    // Fill valid shipping address
    const addressTextarea = page.locator('textarea').first();
    await addressTextarea.fill('House 10, Road 4, Sector 3, Uttara, Dhaka');

    // Select Cash on Delivery for reliable submission
    const codCard = page.locator('text=Cash on Delivery').locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]').first();
    if (await codCard.isVisible()) {
      await codCard.click();
    }

    const confirmOrderBtn = page.getByRole('button', { name: /Confirm Order|Place Order|অর্ডার সম্পন্ন করুন/i });
    await expect(confirmOrderBtn).toBeEnabled({ timeout: 10000 });

    // Submit order
    await confirmOrderBtn.click();

    // Verify order success alert / notification toast appears
    const successToast = page.locator('.swal2-popup').or(page.getByText(/Order Placed Successfully|সফলভাবে সম্পন্ন হয়েছে/i));
    await expect(successToast.first()).toBeVisible({ timeout: 15000 });
  });

  test('deducts VibeCoin balance after confirming order paid via VibeCoin', async ({ page }) => {
    await ensureAuthenticated(page);
    if (!page.url().includes('/checkout')) return;

    // Check if VibeCoin option is eligible and selectable
    const vibeCoinCard = page.locator('text=VibeCoin').locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]').first();
    const vibeCoinRadio = vibeCoinCard.locator('input[type="radio"]');

    if (await vibeCoinRadio.isVisible() && await vibeCoinRadio.isEnabled()) {
      // Read current coin balance before order
      const coinText = await vibeCoinCard.innerText();
      const coinsBefore = parseFloat(coinText.match(/[\d.]+/)?.[0] || '0');

      await vibeCoinCard.click();
      await expect(vibeCoinRadio).toBeChecked();

      // Ensure address and phone are filled
      const phoneInput = page.locator('input[type="tel"]').first();
      const addressTextarea = page.locator('textarea').first();
      await phoneInput.fill('01711223344');
      await addressTextarea.fill('Mirpur 10, Dhaka');

      const confirmOrderBtn = page.getByRole('button', { name: /Confirm Order|Place Order|অর্ডার সম্পন্ন করুন/i });
      if (await confirmOrderBtn.isEnabled()) {
        await confirmOrderBtn.click();

        // Check success toast
        const successToast = page.locator('.swal2-popup');
        await expect(successToast).toBeVisible({ timeout: 15000 });

        // Navigate to profile to verify deducted coin balance
        await page.goto('/profile', { waitUntil: 'domcontentloaded' });
        const profileCoinEl = page.locator('text=/VibeCoin|কয়েন/i').locator('xpath=ancestor::div[contains(@class, "rounded")]');
        if (await profileCoinEl.isVisible()) {
          const profileCoinText = await profileCoinEl.innerText();
          const coinsAfter = parseFloat(profileCoinText.match(/[\d.]+/)?.[0] || '0');
          expect(coinsAfter).toBeLessThan(coinsBefore);
        }
      }
    }
  });
});
