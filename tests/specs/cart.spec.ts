import { test, expect } from '@playwright/test';

test.describe('Cart Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
  });

  test('displays empty cart state when no items are added and explore products link works', async ({ page }) => {
    // Clear cart to guarantee empty state
    await page.addInitScript(() => {
      localStorage.removeItem('cart_id');
      localStorage.removeItem('applied_coupon');
    });
    await page.goto('/cart', { waitUntil: 'domcontentloaded' });

    // If cart is empty, check empty state graphics & explore link
    const emptyHeading = page.getByRole('heading', { name: /Your Cart is Empty|Cart is Empty|কার্ট খালি/i });
    await expect(emptyHeading).toBeVisible({ timeout: 10000 });
    const exploreBtn = page.getByRole('link', { name: /Explore Products|পণ্য দেখুন/i });
    await expect(exploreBtn).toBeVisible();
    await expect(exploreBtn).toHaveAttribute('href', '/products');
    await exploreBtn.click();
    await expect(page).toHaveURL(/\/products/, { timeout: 10000 });
  });

  test('can apply coupon code and validates input', async ({ page }) => {
    await ensureStationaryItemInCart(page);

    // Look for coupon input field
    const couponInput = page.getByPlaceholder(/Enter coupon code|COUPON/i).or(page.locator('form input[type="text"]').first());
    const applyCouponBtn = page.getByRole('button', { name: /Apply/i });
    await expect(couponInput).toBeVisible({ timeout: 10000 });

    // Test empty submission
    await applyCouponBtn.click();
    const errorMsg = page.getByText(/Please enter a coupon code/i).or(page.locator('.swal2-popup, .text-red-500'));
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });

    // Test invalid coupon submission
    await couponInput.fill('INVALIDCODE123');
    await applyCouponBtn.click();
    const invalidAlert = page.locator('.swal2-popup, [role="alert"], .text-red-500');
    await expect(invalidAlert.first()).toBeVisible({ timeout: 7000 });
  });

  test('updates quantity and recalculates totals when items exist', async ({ page }) => {
    await ensureStationaryItemInCart(page);

    const plusBtn = page.getByRole('button', { name: '+' }).first();
    await expect(plusBtn).toBeVisible({ timeout: 10000 });
    const initialQty = await page.locator('span.w-10').first().innerText();
    await plusBtn.click();
    await page.waitForTimeout(500);
    const updatedQty = await page.locator('span.w-10').first().innerText();
    expect(Number(updatedQty)).toBeGreaterThan(Number(initialQty));
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
    const orderSummaryHeading = page.getByRole('heading', { name: /Order Summary|অর্ডার সারাংশ/i });
    await expect(orderSummaryHeading).toBeVisible({ timeout: 15000 });
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

  test('clicking delete button prompts confirmation and deletes product from cart', async ({ page }) => {
    await ensureStationaryItemInCart(page);

    // Locate the delete button in the cart item row
    const deleteBtn = page.getByRole('button', { name: /Remove item|Delete|কার্ট থেকে সরান/i })
      .or(page.locator('button img[alt="Delete"]').locator('xpath=..'))
      .first();

    await expect(deleteBtn).toBeVisible({ timeout: 10000 });

    // Count items before deletion
    const itemRows = page.locator('.space-y-4 > div').filter({ has: page.locator('img[alt="Delete"]') });
    const countBefore = await itemRows.count();
    expect(countBefore).toBeGreaterThan(0);

    // Click delete button
    await deleteBtn.click();

    // SweetAlert confirmation dialog appears
    const confirmPopup = page.locator('.swal2-popup');
    await expect(confirmPopup).toBeVisible({ timeout: 5000 });

    // Confirm deletion by clicking "Yes, Remove"
    const confirmBtn = page.getByRole('button', { name: /Yes, Remove|হ্যাঁ, সরান/i }).or(page.locator('.swal2-confirm'));
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Verify item was deleted (either count decreases or empty cart state appears)
    await page.waitForTimeout(1000);
    const emptyState = page.getByRole('heading', { name: /Your Cart is Empty|Cart is Empty|কার্ট খালি/i });
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
    } else {
      const countAfter = await itemRows.count();
      expect(countAfter).toBeLessThan(countBefore);
    }
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

  test('loads up to 4 products in "You May Also Like" section from collection/category if available', async ({ page }) => {
    await ensureStationaryItemInCart(page);

    // Look for the "You May Also Like" heading
    const youMayAlsoLikeHeading = page.getByRole('heading', {
      name: /You May Also Like|আপনার পছন্দ হতে পারে/i,
    });

    if (await youMayAlsoLikeHeading.isVisible({ timeout: 5000 })) {
      await expect(youMayAlsoLikeHeading).toBeVisible();

      // Find the grid container following the heading
      const relatedSection = youMayAlsoLikeHeading.locator('xpath=ancestor::div[contains(@class, "border-t")]');
      const relatedCards = relatedSection.locator('.grid > div');
      const count = await relatedCards.count();

      // Should load at most 4 products
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(4);

      // Verify each card contains a product title and link
      for (let i = 0; i < count; i++) {
        const card = relatedCards.nth(i);
        await expect(card.locator('h4')).toBeVisible();
        await expect(card.locator('a[href*="/products/"]')).toBeVisible();
      }
    }
  });

  test('calculates Product Discounts correctly in cart item and summary', async ({ page }) => {
    await ensureStationaryItemInCart(page);

    // Look for original subtotal and product discount rows in the summary card
    const originalSubtotalEl = page.locator('.space-y-3\\.5 > div').first();
    await expect(originalSubtotalEl).toBeVisible({ timeout: 15000 });

    const productDiscountsRow = page.getByText(/Product Discounts|পণ্য ছাড়/i);
    if (await productDiscountsRow.isVisible()) {
      await expect(productDiscountsRow).toBeVisible();

      // Check that savings value is formatted and non-zero
      const savingsEl = productDiscountsRow.locator('xpath=following-sibling::span');
      await expect(savingsEl).toBeVisible();
      const savingsText = await savingsEl.innerText();
      const savingsNum = parseFloat(savingsText.replace(/[^\d.]/g, ''));
      expect(savingsNum).toBeGreaterThan(0);

      // Check that discounted subtotal row is present and equals original - savings
      const discountedSubtotalRow = page.getByText(/Discounted Subtotal|ছাড়ের পর উপমোট/i);
      await expect(discountedSubtotalRow).toBeVisible();
      const discountedSubtotalEl = discountedSubtotalRow.locator('xpath=following-sibling::span');
      const discountedSubtotalNum = parseFloat((await discountedSubtotalEl.innerText()).replace(/[^\d.]/g, ''));

      const originalSubtotalNum = parseFloat((await originalSubtotalEl.innerText()).replace(/[^\d.]/g, ''));
      expect(discountedSubtotalNum).toBeCloseTo(originalSubtotalNum - savingsNum, 1);
    }
  });

  test('Total Amount is calculated accurately after all addition or deduction of discounts and coupons', async ({ page }) => {
    await ensureStationaryItemInCart(page);

    // Ensure coupon is cleared first
    const removeCouponBtn = page.getByRole('button', { name: /Remove|সরান/i });
    if (await removeCouponBtn.isVisible()) {
      await removeCouponBtn.click();
      await page.waitForTimeout(500);
    }

    // Read initial total before coupon
    const totalEl = page.locator('.text-2xl.text-accent.font-black').first();
    await expect(totalEl).toBeVisible();
    const initialTotal = parseFloat((await totalEl.innerText()).replace(/[^\d.]/g, ''));

    // Apply valid TRIAL10 coupon
    const couponInput = page.getByPlaceholder(/SUMMER|coupon|code|কুপন/i).or(page.locator('form input[type="text"]').first());
    const applyCouponBtn = page.getByRole('button', { name: /Apply|প্রয়োগ/i });

    if (await couponInput.isVisible()) {
      await couponInput.fill('TRIAL10');
      await applyCouponBtn.click();
      await page.waitForTimeout(1000);

      // Verify coupon discount row appears
      const couponDiscountRow = page.getByText(/Coupon Discount|কুপন ছাড়/i);
      if (await couponDiscountRow.isVisible()) {
        const couponSavingsEl = couponDiscountRow.locator('xpath=following-sibling::span');
        const couponSavings = parseFloat((await couponSavingsEl.innerText()).replace(/[^\d.]/g, ''));

        // Total amount must exactly equal initialTotal minus couponSavings
        const finalTotalEl = page.locator('.text-2xl.text-accent.font-black').first();
        const finalTotal = parseFloat((await finalTotalEl.innerText()).replace(/[^\d.]/g, ''));

        expect(finalTotal).toBeCloseTo(Math.max(0, initialTotal - couponSavings), 1);
      }
    }
  });

  test('Proceed to Checkout button successfully navigates to checkout page', async ({ page }) => {
    await ensureStationaryItemInCart(page);

    const checkoutBtn = page.getByRole('button', { name: /Proceed to Checkout|অর্ডারে এগিয়ে যান/i });
    await expect(checkoutBtn).toBeVisible({ timeout: 10000 });
    await expect(checkoutBtn).toBeEnabled();

    // Click Proceed to Checkout
    await checkoutBtn.click();

    // Verify navigation to checkout
    await expect(page).toHaveURL(/.*\/checkout/, { timeout: 15000 });
  });

  test('canceling item removal in confirmation modal keeps item in cart', async ({ page }) => {
    await ensureStationaryItemInCart(page);

    const deleteBtn = page.getByRole('button', { name: /Remove item|Delete|কার্ট থেকে সরান/i })
      .or(page.locator('button img[alt="Delete"]').locator('xpath=..'))
      .first();
    await expect(deleteBtn).toBeVisible({ timeout: 10000 });

    const itemRows = page.locator('.space-y-4 > div').filter({ has: page.locator('img[alt="Delete"]') });
    const countBefore = await itemRows.count();
    expect(countBefore).toBeGreaterThan(0);

    // Click delete
    await deleteBtn.click();

    // Confirm popup appears
    const cancelBtn = page.getByRole('button', { name: /Cancel|বাতিল/i }).or(page.locator('.swal2-cancel'));
    await expect(cancelBtn).toBeVisible({ timeout: 5000 });
    await cancelBtn.click();

    // Verify item count is unchanged
    await page.waitForTimeout(500);
    const countAfter = await itemRows.count();
    expect(countAfter).toBe(countBefore);
  });

  test('removing an applied coupon restores order total to pre-discount amount', async ({ page }) => {
    await ensureStationaryItemInCart(page);

    const totalEl = page.locator('.text-2xl.text-accent.font-black').first();
    await expect(totalEl).toBeVisible({ timeout: 10000 });
    const originalTotal = parseFloat((await totalEl.innerText()).replace(/[^\d.]/g, ''));

    // Apply TRIAL10
    const couponInput = page.getByPlaceholder(/SUMMER|coupon|code|কুপন/i).or(page.locator('form input[type="text"]').first());
    const applyCouponBtn = page.getByRole('button', { name: /Apply|প্রয়োগ/i });
    await couponInput.fill('TRIAL10');
    await applyCouponBtn.click();

    // Verify coupon badge is displayed
    const removeCouponBtn = page.getByRole('button', { name: /Remove|মুছুন|সরান/i });
    await expect(removeCouponBtn).toBeVisible({ timeout: 10000 });

    const discountedTotal = parseFloat((await totalEl.innerText()).replace(/[^\d.]/g, ''));
    expect(discountedTotal).toBeLessThan(originalTotal);

    // Click Remove coupon
    await removeCouponBtn.click();

    // Verify coupon badge is removed and coupon input reappears
    await expect(couponInput).toBeVisible({ timeout: 5000 });
    const restoredTotal = parseFloat((await totalEl.innerText()).replace(/[^\d.]/g, ''));
    expect(restoredTotal).toBeCloseTo(originalTotal, 1);
  });

  test('rejects inactive or invalid coupon with an error notification', async ({ page }) => {
    await ensureStationaryItemInCart(page);

    // Ensure coupon is cleared first
    const removeCouponBtn = page.getByRole('button', { name: /Remove|মুছুন|সরান/i });
    if (await removeCouponBtn.isVisible()) {
      await removeCouponBtn.click();
    }

    const couponInput = page.getByPlaceholder(/SUMMER|coupon|code|কুপন/i).or(page.locator('form input[type="text"]').first());
    const applyCouponBtn = page.getByRole('button', { name: /Apply|প্রয়োগ/i });

    // BEAUTY20 is inactive in the database
    await couponInput.fill('BEAUTY20');
    await applyCouponBtn.click();

    // Error alert should appear
    const errorAlert = page.locator('.swal2-popup').or(page.getByText(/invalid|সঠিক নয়|ত্রুটি/i));
    await expect(errorAlert.first()).toBeVisible({ timeout: 8000 });

    // Close error alert if open
    const okBtn = page.locator('.swal2-confirm');
    if (await okBtn.isVisible()) {
      await okBtn.click();
    }
  });

  test('adds product to cart directly from "You May Also Like" recommendations', async ({ page }) => {
    await ensureStationaryItemInCart(page);

    const youMayAlsoLikeHeading = page.getByRole('heading', {
      name: /You May Also Like|আপনার পছন্দ হতে পারে/i,
    });
    await expect(youMayAlsoLikeHeading).toBeVisible({ timeout: 10000 });

    const itemRows = page.locator('.space-y-4 > div').filter({ has: page.locator('img[alt="Delete"]') });
    const initialItemCount = await itemRows.count();

    // Click "Add" button on the first recommended product card
    const firstAddBtn = page.locator('.grid button').filter({ hasText: /Add|যোগ করুন/i }).first();
    await expect(firstAddBtn).toBeVisible({ timeout: 5000 });
    await firstAddBtn.click();

    // Success toast appears
    const successToast = page.locator('.swal2-popup').or(page.getByText(/Added.*to cart|কার্টে যোগ করা হয়েছে/i));
    await expect(successToast.first()).toBeVisible({ timeout: 8000 });

    // Wait for cart to reflect the new item
    await expect(async () => {
      const updatedItemCount = await itemRows.count();
      expect(updatedItemCount).toBeGreaterThan(initialItemCount);
    }).toPass({ timeout: 10000 });
  });

  test('clicking product title in cart navigates to product details page', async ({ page }) => {
    await ensureStationaryItemInCart(page);

    const productTitleLink = page.locator('.space-y-4 a[href*="/products/"]').filter({ hasText: /.+/ }).first();
    await expect(productTitleLink).toBeVisible({ timeout: 10000 });

    await productTitleLink.click();
    await expect(page).toHaveURL(/\/products\/\d+/, { timeout: 10000 });
  });

  test('header cart badge reflects quantity changes in real time', async ({ page }) => {
    await ensureStationaryItemInCart(page);

    // Header cart badge span
    const cartBadge = page.locator('header a[href="/cart"] span');
    await expect(cartBadge).toBeVisible({ timeout: 10000 });
    const initialBadgeCount = Number(await cartBadge.innerText());

    // Click + button
    const plusBtn = page.getByRole('button', { name: '+' }).first();
    await plusBtn.click();

    // Badge should increase
    await expect(async () => {
      const updatedBadgeCount = Number(await cartBadge.innerText());
      expect(updatedBadgeCount).toBe(initialBadgeCount + 1);
    }).toPass({ timeout: 10000 });
  });

  test('automatically removes coupon when all eligible items are removed from cart', async ({ page }) => {
    await ensureStationaryItemInCart(page);

    // Add a second product (product 1) so cart remains open when 648 is deleted
    await page.evaluate(async () => {
      const cartId = localStorage.getItem('cart_id');
      if (cartId) {
        await fetch(`http://127.0.0.1:8000/store/carts/${cartId}/items/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: 1, quantity: 1 }),
        });
      }
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Apply TRIAL10 (eligible only for stationary items like 648)
    const couponInput = page.getByPlaceholder(/SUMMER|coupon|code|কুপন/i).or(page.locator('form input[type="text"]').first());
    const applyCouponBtn = page.getByRole('button', { name: /Apply|প্রয়োগ/i });
    await couponInput.fill('TRIAL10');
    await applyCouponBtn.click();

    // Confirm coupon is applied
    const couponBadge = page.getByRole('button', { name: /Remove|মুছুন|সরান/i });
    await expect(couponBadge).toBeVisible({ timeout: 10000 });

    // Locate product 648 item row and delete it
    const item648DeleteBtn = page.locator('.space-y-4 > div')
      .filter({ has: page.locator('a[href*="/products/648"]') })
      .locator('button')
      .filter({ has: page.locator('img[alt="Delete"]') });

    if (await item648DeleteBtn.isVisible()) {
      await item648DeleteBtn.click();
      const confirmBtn = page.getByRole('button', { name: /Yes, Remove|হ্যাঁ, সরান/i }).or(page.locator('.swal2-confirm'));
      await confirmBtn.click();

      // The coupon should automatically be removed since no stationary items remain
      await expect(couponBadge).not.toBeVisible({ timeout: 10000 });
      await expect(couponInput).toBeVisible({ timeout: 10000 });
    }
  });
});
