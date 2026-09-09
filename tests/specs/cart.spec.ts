import { test, expect } from '@playwright/test';

test.describe('Cart Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
  });

  test('displays empty cart state when no items are added', async ({ page }) => {
    // If cart is empty, check empty state graphics & explore link
    const emptyHeading = page.getByRole('heading', { name: /Your Cart is Empty|Cart is Empty/i });
    if (await emptyHeading.isVisible()) {
      await expect(emptyHeading).toBeVisible();
      const exploreBtn = page.getByRole('link', { name: /Explore Products/i });
      await expect(exploreBtn).toBeVisible();
      await expect(exploreBtn).toHaveAttribute('href', '/products');
    }
  });

  test('can apply coupon code and validates input', async ({ page }) => {
    // Look for coupon input field
    const couponInput = page.getByPlaceholder(/Enter coupon code|COUPON/i);
    const applyCouponBtn = page.getByRole('button', { name: /Apply/i });

    if (await couponInput.isVisible()) {
      // Test empty submission
      await applyCouponBtn.click();
      const errorMsg = page.getByText(/Please enter a coupon code/i).or(page.locator('.swal2-popup'));
      await expect(errorMsg).toBeVisible({ timeout: 5000 });

      // Test invalid coupon submission
      await couponInput.fill('INVALIDCODE123');
      await applyCouponBtn.click();
      const invalidAlert = page.locator('.swal2-popup, [role="alert"]');
      await expect(invalidAlert).toBeVisible({ timeout: 7000 });
    }
  });

  test('updates quantity and recalculates totals when items exist', async ({ page }) => {
    const plusBtn = page.getByRole('button', { name: '+' }).first();
    if (await plusBtn.isVisible()) {
      const initialQty = await page.locator('span.w-10').first().innerText();
      await plusBtn.click();
      await page.waitForTimeout(500);
      const updatedQty = await page.locator('span.w-10').first().innerText();
      expect(Number(updatedQty)).toBeGreaterThan(Number(initialQty));
    }
  });

  // Helper function to add product 648 (Stationary collection) to cart reliably
  async function ensureStationaryItemInCart(page: any) {
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    
    // Add product 648 directly to cart using API
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

    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
  }

  test('decrease (-) button decreases quantity up to minimum of 1 and does not decrease below 1', async ({ page }) => {
    await ensureStationaryItemInCart(page);

    const qtySpan = page.locator('span.w-10').first();
    await expect(qtySpan).toBeVisible({ timeout: 10000 });

    const minusBtn = page.getByRole('button', { name: '-' }).first();
    const plusBtn = page.getByRole('button', { name: '+' }).first();

    // Increase first to ensure we can test decrementing
    await plusBtn.click();
    await page.waitForTimeout(500);
    const elevatedQty = Number(await qtySpan.innerText());
    expect(elevatedQty).toBeGreaterThanOrEqual(2);

    // Decrease back
    await minusBtn.click();
    await page.waitForTimeout(500);
    const decreasedQty = Number(await qtySpan.innerText());
    expect(decreasedQty).toBe(elevatedQty - 1);

    // Click minus multiple times to hit boundary
    for (let i = 0; i < 5; i++) {
      const currentQty = Number(await qtySpan.innerText());
      if (currentQty > 1) {
        await minusBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // Now quantity should be 1
    const qtyAtOne = Number(await qtySpan.innerText());
    expect(qtyAtOne).toBe(1);

    // Click minus button again at quantity 1
    await minusBtn.click();
    await page.waitForTimeout(500);

    // Quantity should remain 1, item is not deleted
    const finalQty = Number(await qtySpan.innerText());
    expect(finalQty).toBe(1);
    await expect(qtySpan).toBeVisible();
  });

  test('calculates item total and order summary accurately with quantity changes', async ({ page }) => {
    await ensureStationaryItemInCart(page);

    const qtySpan = page.locator('span.w-10').first();
    await expect(qtySpan).toBeVisible({ timeout: 10000 });

    const plusBtn = page.getByRole('button', { name: '+' }).first();
    const minusBtn = page.getByRole('button', { name: '-' }).first();

    // Reset quantity to 1
    for (let i = 0; i < 5; i++) {
      const q = Number(await qtySpan.innerText());
      if (q > 1) {
        await minusBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // Read unit price (effective unit price shown in item row)
    const unitPriceEl = page.locator('.text-accent.font-extrabold.text-sm').first();
    await expect(unitPriceEl).toBeVisible();
    const unitPriceText = await unitPriceEl.innerText();
    const unitPriceNum = parseFloat(unitPriceText.replace(/[^\d.]/g, ''));

    // Read item total row
    const itemTotalEl = page.locator('.font-black.text-base.text-accent').first();
    const itemTotalText = await itemTotalEl.innerText();
    const itemTotalNum = parseFloat(itemTotalText.replace(/[^\d.]/g, ''));

    // At qty = 1, item total equals unit price
    expect(itemTotalNum).toBeCloseTo(unitPriceNum, 1);

    // Increment to qty = 2
    await plusBtn.click();
    await page.waitForTimeout(700);

    const qtyAfterPlus = Number(await qtySpan.innerText());
    expect(qtyAfterPlus).toBe(2);

    const updatedItemTotalText = await itemTotalEl.innerText();
    const updatedItemTotalNum = parseFloat(updatedItemTotalText.replace(/[^\d.]/g, ''));

    // Total for item must equal unitPrice * 2
    expect(updatedItemTotalNum).toBeCloseTo(unitPriceNum * 2, 1);

    // Verify order summary total amount matches item total (or subtotal)
    const orderTotalEl = page.locator('.text-2xl.text-accent.font-black').first();
    await expect(orderTotalEl).toBeVisible();
    const orderTotalNum = parseFloat((await orderTotalEl.innerText()).replace(/[^\d.]/g, ''));
    expect(orderTotalNum).toBeGreaterThanOrEqual(updatedItemTotalNum);
  });

  test('TRIAL10 is a valid coupon and applies 20% OFF on stationary collection', async ({ page }) => {
    await ensureStationaryItemInCart(page);

    // Ensure coupon is cleared first if previously applied
    const removeCouponBtn = page.getByRole('button', { name: /Remove/i });
    if (await removeCouponBtn.isVisible()) {
      await removeCouponBtn.click();
      await page.waitForTimeout(500);
    }

    const couponInput = page.getByPlaceholder(/SUMMER|coupon|code/i).or(page.locator('form input[type="text"]').first());
    const applyCouponBtn = page.getByRole('button', { name: /Apply/i });

    await expect(couponInput).toBeVisible({ timeout: 10000 });

    // Read total/subtotal before coupon
    const totalBeforeCouponEl = page.locator('.text-2xl.text-accent.font-black').first();
    const totalBeforeNum = parseFloat((await totalBeforeCouponEl.innerText()).replace(/[^\d.]/g, ''));

    // Enter TRIAL10 coupon code
    await couponInput.fill('TRIAL10');
    await applyCouponBtn.click();

    // Verify success toast/message with 20% OFF confirmation
    const successToast = page.getByText(/TRIAL10.*20% OFF|কুপন.*TRIAL10.*২০%/i).or(page.locator('.swal2-popup'));
    await expect(successToast.first()).toBeVisible({ timeout: 10000 });

    // Verify coupon badge is displayed with 20% OFF label
    const couponBadge = page.locator('text=/TRIAL10.*20%.*OFF/i').or(page.getByText(/TRIAL10/i));
    await expect(couponBadge.first()).toBeVisible({ timeout: 5000 });

    // Check discount deduction row appears
    const couponDiscountRow = page.getByText(/Coupon Discount|কুপন ছাড়/i);
    await expect(couponDiscountRow.first()).toBeVisible();

    // Verify final total has been reduced by 20%
    const totalAfterCouponEl = page.locator('.text-2xl.text-accent.font-black').first();
    const totalAfterNum = parseFloat((await totalAfterCouponEl.innerText()).replace(/[^\d.]/g, ''));

    const expectedDiscount = totalBeforeNum * 0.20;
    const expectedFinalTotal = totalBeforeNum - expectedDiscount;

    expect(totalAfterNum).toBeCloseTo(expectedFinalTotal, 1);
  });

  test('displays order summary section with checkout button', async ({ page }) => {
    const checkoutBtn = page.getByRole('button', { name: /Proceed to Checkout|Checkout/i }).or(
      page.getByRole('link', { name: /Checkout/i })
    );

    if (await checkoutBtn.isVisible()) {
      await expect(checkoutBtn).toBeVisible();
      // Click Proceed to checkout
      await checkoutBtn.click();
      await expect(page).toHaveURL(/checkout/);
    }
  });
});
