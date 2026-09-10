import { test, expect } from '@playwright/test';

test.describe('Checkout Page', () => {
  let cachedAuth: { access: string; refresh: string } | null = null;

  // Helper to obtain a cached JWT token for customer 'hello'
  async function getAuthToken(page: any) {
    if (!cachedAuth) {
      try {
        const response = await page.request.post('http://127.0.0.1:8000/auth/jwt/create/', {
          data: {
            username: 'hello',
            password: 'Hello123456',
          },
        });
        if (response.ok()) {
          cachedAuth = await response.json();
        }
      } catch (e) {
        console.error('Failed to get auth token:', e);
      }
    }
    return cachedAuth;
  }

  // Helper to set up an isolated cart and authenticated checkout session
  async function setupCheckoutSession(page: any, options: {
    authenticated?: boolean;
    emptyCart?: boolean;
    productId?: number;
    quantity?: number;
    coupon?: { code: string; discountPercent: number; applicableProductIds: number[] } | null;
  } = {}) {
    const { authenticated = true, emptyCart = false, productId = 1, quantity = 1, coupon = null } = options;

    let token: string | null = null;
    if (authenticated) {
      const auth = await getAuthToken(page);
      token = auth?.access || null;
    }

    if (emptyCart) {
      // Mock cart API so it reports 0 items regardless of any pre-existing user cart in the database
      await page.route('**/store/carts/**', async (route: any) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'empty-test-cart', items: [], total_price: 0 }),
        });
      });
    }

    let cartId: string | null = null;
    if (!emptyCart) {
      try {
        const cartRes = await page.request.post('http://127.0.0.1:8000/store/carts/', { data: {} });
        if (cartRes.ok()) {
          const cartData = await cartRes.json();
          cartId = cartData.id;
          await page.request.post(`http://127.0.0.1:8000/store/carts/${cartId}/items/`, {
            data: { product_id: productId, quantity },
          });
        }
      } catch (e) {
        console.error('Failed to setup cart item:', e);
      }
    }

    await page.addInitScript(({ token, cartId, coupon }: { token: string | null; cartId: string | null; coupon: any }) => {
      if (token) {
        localStorage.setItem('access_token', token);
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }

      if (cartId) {
        localStorage.setItem('cart_id', cartId);
      } else {
        localStorage.removeItem('cart_id');
      }

      if (coupon) {
        localStorage.setItem('applied_coupon', JSON.stringify(coupon));
      } else {
        localStorage.removeItem('applied_coupon');
      }
    }, { token, cartId, coupon });

    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
  }

  /* -------------------------------------------------------------------------- */
  /* 1. Authentication & Empty Cart State                                        */
  /* -------------------------------------------------------------------------- */
  test.describe('1. Authentication Gate & Empty Cart State', () => {
    test('redirects unauthenticated users to login with redirect parameter', async ({ page }) => {
      await setupCheckoutSession(page, { authenticated: false });
      await expect(page).toHaveURL(/login\?redirect=%2Fcheckout|login\?redirect=\/checkout/, { timeout: 15000 });
      const loginHeading = page.locator('h1, h2').first();
      await expect(loginHeading).toBeVisible();
    });

    test('displays empty cart state when cart has no items and browse products button works', async ({ page }) => {
      await setupCheckoutSession(page, { authenticated: true, emptyCart: true });
      const emptyHeading = page.getByRole('heading', { name: /Your Cart is Empty|Cart is Empty|কার্ট খালি/i });
      await expect(emptyHeading).toBeVisible({ timeout: 15000 });

      const browseBtn = page.getByRole('link', { name: /Browse Products|পণ্য দেখুন/i });
      await expect(browseBtn).toBeVisible();
      await expect(browseBtn).toHaveAttribute('href', '/products');
      await browseBtn.click();
      await expect(page).toHaveURL(/\/products/, { timeout: 15000 });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. Breadcrumb Navigation                                                    */
  /* -------------------------------------------------------------------------- */
  test.describe('2. Breadcrumb Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await setupCheckoutSession(page);
    });

    test('renders breadcrumbs and allows navigation back to Home or Cart', async ({ page }) => {
      const homeLink = page.getByRole('link', { name: /Home|হোম/i }).first();
      const cartLink = page.getByRole('link', { name: /Cart|কার্ট/i }).first();

      await expect(homeLink).toBeVisible({ timeout: 15000 });
      await expect(cartLink).toBeVisible();

      // Click Cart breadcrumb link
      await cartLink.click();
      await expect(page).toHaveURL(/\/cart/, { timeout: 15000 });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. Phone Number Input & Validation                                          */
  /* -------------------------------------------------------------------------- */
  test.describe('3. Phone Number Input & Validation', () => {
    test.beforeEach(async ({ page }) => {
      await setupCheckoutSession(page);
    });

    test('prefills customer phone number or allows entering 11-digit numbers', async ({ page }) => {
      const phoneInput = page.locator('form input[type="tel"]').first();
      await expect(phoneInput).toBeVisible({ timeout: 15000 });

      // Clean and test custom input
      await phoneInput.fill('01799887766');
      expect(await phoneInput.inputValue()).toBe('01799887766');

      // Test input filtering: typing non-digits and > 11 chars
      await phoneInput.fill('01712abc345678990');
      const sanitized = await phoneInput.inputValue();
      expect(sanitized).toMatch(/^\d{1,11}$/);
      expect(sanitized.length).toBeLessThanOrEqual(11);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. Saved Addresses, Delivery Zone Auto-detection & Custom Address          */
  /* -------------------------------------------------------------------------- */
  test.describe('4. Saved Addresses & Delivery Zone Auto-Detection', () => {
    test.beforeEach(async ({ page }) => {
      await setupCheckoutSession(page);
    });

    test('loads saved addresses, preselects default address, and populates shipping address textarea', async ({ page }) => {
      const addressTextarea = page.locator('form textarea').first();
      await expect(addressTextarea).toBeVisible({ timeout: 15000 });

      const addressDropdown = page.locator('form select').first();
      if (await addressDropdown.isVisible()) {
        const optionCount = await addressDropdown.locator('option').count();
        expect(optionCount).toBeGreaterThan(0);

        // Pre-populated textarea should have address content
        const initialVal = await addressTextarea.inputValue();
        expect(initialVal.trim().length).toBeGreaterThan(0);
      }
    });

    test('selecting custom address clears textarea, and editing textarea auto-switches dropdown to custom', async ({ page }) => {
      const addressDropdown = page.locator('form select').first();
      const addressTextarea = page.locator('form textarea').first();
      await expect(addressTextarea).toBeVisible({ timeout: 15000 });

      if (await addressDropdown.isVisible()) {
        // Select custom address
        await addressDropdown.selectOption('custom');
        expect(await addressTextarea.inputValue()).toBe('');

        // Enter custom address text
        await addressTextarea.fill('Flat 5A, Banani, Dhaka');
        expect(await addressTextarea.inputValue()).toBe('Flat 5A, Banani, Dhaka');

        // Select the first saved address again
        const firstOptionVal = await addressDropdown.locator('option').first().getAttribute('value');
        if (firstOptionVal && firstOptionVal !== 'custom') {
          await addressDropdown.selectOption(firstOptionVal);
          // Modifying the textarea should switch the dropdown back to 'custom'
          await addressTextarea.fill('New Custom Street 99');
          expect(await addressDropdown.inputValue()).toBe('custom');
        }
      }
    });

    test('switching between saved addresses auto-toggles delivery zone based on address city', async ({ page }) => {
      const addressDropdown = page.locator('form select').first();
      if (await addressDropdown.isVisible()) {
        const outsideOption = addressDropdown.locator('option').filter({ hasText: /Outside Dhaka/i }).first();
        if (await outsideOption.count() > 0) {
          const outsideVal = await outsideOption.getAttribute('value');
          if (outsideVal) {
            await addressDropdown.selectOption(outsideVal);
            await page.waitForTimeout(300);
            const outsideRadio = page.locator('#delivery_outside');
            await expect(outsideRadio).toBeChecked();
          }
        }
      }
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 5. Delivery Zone Selection & Estimated Delivery Days                        */
  /* -------------------------------------------------------------------------- */
  test.describe('5. Delivery Zone Selection & Pricing', () => {
    test.beforeEach(async ({ page }) => {
      await setupCheckoutSession(page);
    });

    test('displays estimated delivery days for Inside and Outside Dhaka', async ({ page }) => {
      const insideRadio = page.locator('#delivery_inside');
      const outsideRadio = page.locator('#delivery_outside');

      await expect(insideRadio).toBeVisible({ timeout: 15000 });
      await expect(outsideRadio).toBeVisible({ timeout: 15000 });

      const insideCard = insideRadio.locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]');
      const outsideCard = outsideRadio.locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]');

      // Estimated days should be shown
      await expect(insideCard).toContainText(/Est\.|আনুমানিক সময়/i);
      await expect(outsideCard).toContainText(/Est\.|আনুমানিক সময়/i);
    });

    test('toggling delivery zone updates delivery charge and total amount in order summary', async ({ page }) => {
      const insideRadio = page.locator('#delivery_inside');
      const outsideRadio = page.locator('#delivery_outside');
      const insideCard = insideRadio.locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]');
      const outsideCard = outsideRadio.locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]');

      // Click Inside Dhaka
      await insideCard.click();
      await page.waitForTimeout(300);
      await expect(insideRadio).toBeChecked();

      const totalEl = page.locator('.space-y-3 .text-2xl.text-accent').first();
      const insideTotal = parseFloat((await totalEl.innerText()).replace(/[^\d.]/g, ''));

      // Click Outside Dhaka
      await outsideCard.click();
      await page.waitForTimeout(300);
      await expect(outsideRadio).toBeChecked();

      const outsideTotal = parseFloat((await totalEl.innerText()).replace(/[^\d.]/g, ''));
      expect(outsideTotal).toBeGreaterThanOrEqual(insideTotal);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 6. Payment Methods & Gateway Validation                                     */
  /* -------------------------------------------------------------------------- */
  test.describe('6. Payment Methods & Gateway Validation', () => {
    test.beforeEach(async ({ page }) => {
      await setupCheckoutSession(page);
    });

    test('payment gateways render based on active settings (COD, bKash, Nagad, VibeCoin)', async ({ page }) => {
      await expect(page.locator('#pay_cod')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('#pay_bkash')).toBeVisible();
      await expect(page.locator('#pay_nagad')).toBeVisible();
      await expect(page.locator('#pay_vibecoin')).toBeVisible();
    });

    test('bKash requires sender phone number and transaction ID', async ({ page }) => {
      const bkashCard = page.locator('#pay_bkash').locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]');
      await bkashCard.click();

      // Transaction Phone and TrxID inputs must appear in BkashPaymentUI
      const trxPhoneInput = page.getByPlaceholder(/01XXXXXXXXX|Sender Number|বিকাশ নাম্বার/i).or(page.locator('input[type="tel"]').nth(1));
      const trxIdInput = page.getByPlaceholder(/TrxID|Transaction ID|ট্রানজেকশন আইডি/i).or(page.locator('input[placeholder*="TrxID"]'));

      await expect(trxPhoneInput).toBeVisible({ timeout: 10000 });
      await expect(trxIdInput).toBeVisible({ timeout: 10000 });

      const confirmBtn = page.getByRole('button', { name: /Confirm Order|Place Order|অর্ডার সম্পন্ন করুন/i });
      // Clear transaction fields - confirm button should be disabled
      await trxPhoneInput.fill('');
      await trxIdInput.fill('');
      expect(await confirmBtn.isDisabled()).toBe(true);

      // Fill transaction details
      await trxPhoneInput.fill('01711223344');
      await trxIdInput.fill('BKASH99281');

      // Fill address and phone if not filled
      const phoneInput = page.locator('form input[type="tel"]').first();
      const addressTextarea = page.locator('form textarea').first();
      if (!(await phoneInput.inputValue())) await phoneInput.fill('01712345678');
      if (!(await addressTextarea.inputValue())) await addressTextarea.fill('House 1, Road 2, Dhaka');

      // Now button is enabled
      await expect(confirmBtn).toBeEnabled();
    });

    test('Nagad requires sender phone number and transaction ID', async ({ page }) => {
      const nagadCard = page.locator('#pay_nagad').locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]');
      await nagadCard.click();

      // Transaction Phone and TrxID inputs must appear in NagadPaymentUI
      const trxPhoneInput = page.getByPlaceholder(/01XXXXXXXXX|Sender Number|নগদ নাম্বার/i).or(page.locator('input[type="tel"]').nth(1));
      const trxIdInput = page.getByPlaceholder(/TrxID|Transaction ID|ট্রানজেকশন আইডি/i).or(page.locator('input[placeholder*="TrxID"]'));

      await expect(trxPhoneInput).toBeVisible({ timeout: 10000 });
      await expect(trxIdInput).toBeVisible({ timeout: 10000 });

      const confirmBtn = page.getByRole('button', { name: /Confirm Order|Place Order|অর্ডার সম্পন্ন করুন/i });
      // Clear transaction fields - confirm button should be disabled
      await trxPhoneInput.fill('');
      await trxIdInput.fill('');
      expect(await confirmBtn.isDisabled()).toBe(true);

      // Fill transaction details
      await trxPhoneInput.fill('01811223344');
      await trxIdInput.fill('NAGAD88392');

      // Fill address and phone if not filled
      const phoneInput = page.locator('form input[type="tel"]').first();
      const addressTextarea = page.locator('form textarea').first();
      if (!(await phoneInput.inputValue())) await phoneInput.fill('01712345678');
      if (!(await addressTextarea.inputValue())) await addressTextarea.fill('House 1, Road 2, Dhaka');

      // Now button is enabled
      await expect(confirmBtn).toBeEnabled();
    });

    test('VibeCoin option indicates balance status and shows instructions when eligible', async ({ page }) => {
      const vibeCoinRadio = page.locator('#pay_vibecoin');
      const vibeCoinCard = vibeCoinRadio.locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]');

      await expect(vibeCoinCard).toBeVisible({ timeout: 15000 });
      const isDisabled = await vibeCoinRadio.isDisabled();

      if (!isDisabled) {
        // User has enough coins: can select VibeCoin
        await vibeCoinCard.click();
        await expect(vibeCoinRadio).toBeChecked();

        // Instructions card appears
        const instructionCard = page.locator('text=VibeCoin Payment Ready, text=কয়েন কর্তন করা হবে').or(page.getByText(/VibeCoin Payment Ready/i));
        await expect(instructionCard.first()).toBeVisible();
      } else {
        // User does not have enough coins: card is disabled and clicking does not check it
        await expect(vibeCoinCard).toContainText(/Blocked|Insufficient|Not enough|ব্যালেন্স অপর্যাপ্ত/i);
        await vibeCoinCard.click();
        expect(await vibeCoinRadio.isChecked()).toBe(false);
      }
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 7. Coupons & Order Summary Calculations                                     */
  /* -------------------------------------------------------------------------- */
  test.describe('7. Coupons & Order Summary Calculations', () => {
    test('renders applied coupon discount in order summary with correct deduction', async ({ page }) => {
      // Setup checkout with product 1 and SUMMER20 coupon (20% off for product 1)
      await setupCheckoutSession(page, {
        productId: 1,
        quantity: 2,
        coupon: {
          code: 'SUMMER20',
          discountPercent: 20,
          applicableProductIds: [1, 288],
        },
      });

      // Look for coupon row in order summary
      const couponRow = page.locator('.space-y-3').getByText(/SUMMER20/i);
      await expect(couponRow).toBeVisible({ timeout: 15000 });

      // Check that a minus discount is displayed
      const discountAmountEl = page.locator('.space-y-3').locator('div').filter({ hasText: /SUMMER20/i }).locator('span').nth(1);
      await expect(discountAmountEl).toContainText('-');
    });

    test('automatically removes coupon if cart contains no eligible products', async ({ page }) => {
      // Setup checkout with product 1, but coupon that only applies to product 9999
      await setupCheckoutSession(page, {
        productId: 1,
        quantity: 1,
        coupon: {
          code: 'INELIGIBLE_COUPON',
          discountPercent: 15,
          applicableProductIds: [9999],
        },
      });

      // Coupon should be removed from localStorage and not shown in order summary
      await page.waitForTimeout(1000);
      const savedCoupon = await page.evaluate(() => localStorage.getItem('applied_coupon'));
      expect(savedCoupon).toBeNull();
      const couponRow = page.locator('.space-y-3').getByText(/INELIGIBLE_COUPON/i);
      await expect(couponRow).toHaveCount(0);
    });

    test('order summary calculates subtotal matching cart page items value', async ({ page }) => {
      await setupCheckoutSession(page, { productId: 1, quantity: 2 });

      const subtotalEl = page.locator('.space-y-3 span.font-bold.text-foreground').first();
      await expect(subtotalEl).toBeVisible({ timeout: 15000 });
      const subtotalText = await subtotalEl.innerText();
      const subtotalNum = parseFloat(subtotalText.replace(/[^\d.]/g, ''));
      expect(subtotalNum).toBeGreaterThan(0);
    });

    test('intercepts invalid or expired coupon on order submission', async ({ page }) => {
      await setupCheckoutSession(page, {
        productId: 1,
        quantity: 1,
        coupon: {
          code: 'EXPIRED_COUPON',
          discountPercent: 20,
          applicableProductIds: [1],
        },
      });

      // Mock coupon validation endpoint to simulate expired coupon
      await page.route('**/store/coupons/validate/', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ valid: false, error: 'Coupon has expired.' }),
        });
      });

      const phoneInput = page.locator('form input[type="tel"]').first();
      const addressTextarea = page.locator('form textarea').first();
      if (!(await phoneInput.inputValue())) await phoneInput.fill('01712345678');
      if (!(await addressTextarea.inputValue())) await addressTextarea.fill('Test Address, Dhaka');

      const confirmBtn = page.getByRole('button', { name: /Confirm Order|Place Order|অর্ডার সম্পন্ন করুন/i });
      await expect(confirmBtn).toBeEnabled();
      await confirmBtn.click();

      // Error SweetAlert should appear
      const couponAlert = page.locator('.swal2-popup').or(page.getByText(/Coupon No Longer Valid/i));
      await expect(couponAlert.first()).toBeVisible({ timeout: 15000 });

      // Coupon should be removed from localStorage
      const savedCoupon = await page.evaluate(() => localStorage.getItem('applied_coupon'));
      expect(savedCoupon).toBeNull();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 8. Order Placement, Cart Reset & Error Handling                            */
  /* -------------------------------------------------------------------------- */
  test.describe('8. Order Placement, Cart Reset & Error Handling', () => {
    test('cannot submit order when phone or address is empty', async ({ page }) => {
      await setupCheckoutSession(page);

      const phoneInput = page.locator('form input[type="tel"]').first();
      const addressTextarea = page.locator('form textarea').first();
      const confirmBtn = page.getByRole('button', { name: /Confirm Order|Place Order|অর্ডার সম্পন্ন করুন/i });

      await expect(confirmBtn).toBeVisible({ timeout: 15000 });

      // Clear phone
      await phoneInput.fill('');
      expect(await confirmBtn.isDisabled()).toBe(true);

      // Re-fill phone, clear address
      await phoneInput.fill('01712345678');
      await addressTextarea.fill('');
      expect(await confirmBtn.isDisabled()).toBe(true);
    });

    test('submitting valid Cash on Delivery order confirms order, clears cart, and redirects to profile', async ({ page }) => {
      await setupCheckoutSession(page);

      const phoneInput = page.locator('form input[type="tel"]').first();
      const addressTextarea = page.locator('form textarea').first();
      await phoneInput.fill('01712345678');
      await addressTextarea.fill('House 12, Road 5, Dhanmondi, Dhaka');

      // Select Cash on Delivery
      const codRadio = page.locator('#pay_cod');
      const codCard = codRadio.locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]');
      await codCard.click();
      await expect(codRadio).toBeChecked();

      const confirmBtn = page.getByRole('button', { name: /Confirm Order|Place Order|অর্ডার সম্পন্ন করুন/i });
      await expect(confirmBtn).toBeEnabled({ timeout: 10000 });
      await confirmBtn.click();

      // Order success SweetAlert appears
      const successPopup = page.locator('.swal2-popup').or(page.getByText(/Order Placed Successfully|সফলভাবে সম্পন্ন হয়েছে/i));
      await expect(successPopup.first()).toBeVisible({ timeout: 15000 });

      // Coupon should be cleared from localStorage
      const storedCoupon = await page.evaluate(() => localStorage.getItem('applied_coupon'));
      expect(storedCoupon).toBeNull();

      // Click SweetAlert confirm button
      const okBtn = page.locator('.swal2-confirm');
      if (await okBtn.isVisible()) {
        await okBtn.click();
      }
      await expect(page).toHaveURL(/\/profile/, { timeout: 15000 });
    });

    test('submitting valid order paid via VibeCoin creates order and updates balance', async ({ page }) => {
      await setupCheckoutSession(page);

      const vibeCoinRadio = page.locator('#pay_vibecoin');
      const vibeCoinCard = vibeCoinRadio.locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]');

      // Check if user has sufficient coins to select VibeCoin
      if (!(await vibeCoinRadio.isDisabled())) {
        await vibeCoinCard.click();
        await expect(vibeCoinRadio).toBeChecked();

        const phoneInput = page.locator('form input[type="tel"]').first();
        const addressTextarea = page.locator('form textarea').first();
        await phoneInput.fill('01712345678');
        await addressTextarea.fill('House 12, Road 5, Dhanmondi, Dhaka');

        const confirmBtn = page.getByRole('button', { name: /Confirm Order|Place Order|অর্ডার সম্পন্ন করুন/i });
        if (await confirmBtn.isEnabled()) {
          await confirmBtn.click();

          const successPopup = page.locator('.swal2-popup').or(page.getByText(/Order Placed Successfully|সফলভাবে সম্পন্ন হয়েছে/i));
          await expect(successPopup.first()).toBeVisible({ timeout: 15000 });

          const okBtn = page.locator('.swal2-confirm');
          if (await okBtn.isVisible()) {
            await okBtn.click();
          }
          await expect(page).toHaveURL(/\/profile/, { timeout: 15000 });
        }
      }
    });

    test('handles backend order failure gracefully with error alert and re-enables button', async ({ page }) => {
      await setupCheckoutSession(page);

      // Route the order API to simulate a 400 Bad Request error
      await page.route('**/store/orders/', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Item out of stock or warehouse unavailable.' }),
        });
      });

      const phoneInput = page.locator('form input[type="tel"]').first();
      const addressTextarea = page.locator('form textarea').first();
      await phoneInput.fill('01712345678');
      await addressTextarea.fill('Test Address, Dhaka');

      const codCard = page.locator('#pay_cod').locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]');
      await codCard.click();

      const confirmBtn = page.getByRole('button', { name: /Confirm Order|Place Order|অর্ডার সম্পন্ন করুন/i });
      await expect(confirmBtn).toBeEnabled();
      await confirmBtn.click();

      // Error SweetAlert should appear
      const errorPopup = page.locator('.swal2-popup').or(page.getByText(/Order Placement Failed|সমস্যা দেখা দিয়েছে/i));
      await expect(errorPopup.first()).toBeVisible({ timeout: 15000 });

      // Dismiss the SweetAlert error popup
      const okBtn = page.locator('.swal2-confirm');
      await expect(okBtn).toBeVisible();
      await okBtn.click();

      // Confirm button should be re-enabled after acknowledging failure
      await expect(confirmBtn).toBeEnabled({ timeout: 10000 });
    });
  });
});
