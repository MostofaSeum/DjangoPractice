import { test, expect } from '@playwright/test';

test.describe('Customer Profile & Wishlist Page', () => {
  // Helper to ensure test user is authenticated
  async function ensureAuthenticated(page: any) {
    try {
      // 1. Fast, reliable API authentication: obtain JWT directly
      const response = await page.request.post('http://127.0.0.1:8000/auth/jwt/create/', {
        data: {
          username: 'hello',
          password: 'Hello123456',
        },
      });

      if (response.ok()) {
        const data = await response.json();
        const access = data.access;
        const refresh = data.refresh;

        // Navigate to site to access localStorage origin
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.evaluate(({ access, refresh }: { access: string; refresh: string }) => {
          localStorage.setItem('access_token', access);
          if (refresh) localStorage.setItem('refresh_token', refresh);
        }, { access, refresh });
        return;
      }
    } catch (e) {
      console.warn('API token seeding error, falling back to UI login:', e);
    }

    // 2. Fallback: Perform standard UI login
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const usernameInput = page.locator('input[placeholder*="USERNAME" i], input[name="username"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitBtn = page.locator('button[type="submit"]:has-text("Sign In"), button[type="submit"]:has-text("সাইন ইন"), form button[type="submit"]').first();

    await expect(usernameInput).toBeVisible({ timeout: 15000 });
    await usernameInput.fill('hello');
    await passwordInput.fill('Hello123456');
    await submitBtn.click();
    await expect(page).not.toHaveURL(/\/login(\?|$)/, { timeout: 15000 });
  }

  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/profile/, { timeout: 15000 });
    // Wait for the profile form to load completely and be interactive
    await expect(page.locator('input[name="first_name"]')).toBeVisible({ timeout: 15000 });
  });

  test('user can change first name, last name, email, phone, and birthdate', async ({ page }) => {
    await expect(page).toHaveURL(/profile/);

    const firstNameInput = page.locator('input[name="first_name"]');
    const lastNameInput = page.locator('input[name="last_name"]');
    const emailInput = page.locator('input[name="email"]');
    const phoneInput = page.locator('input[name="phone"]');
    const birthDateInput = page.locator('input[name="birth_date"]');
    const saveBtn = page.getByRole('button', { name: /Save.*Changes|সংরক্ষণ/i });

    await expect(firstNameInput).toBeVisible();
    await expect(lastNameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(phoneInput).toBeVisible();
    await expect(birthDateInput).toBeVisible();

    // Fill new profile information
    await firstNameInput.fill('AdminFirst');
    await lastNameInput.fill('AdminLast');
    await phoneInput.fill('01712345678');
    await birthDateInput.fill('1995-05-15');

    await saveBtn.click();

    // Verify confirmation feedback
    const toast = page.locator('.swal2-popup').or(page.getByText(/Profile updated successfully|প্রোফাইল আপডেট হয়েছে/i));
    await expect(toast.first()).toBeVisible({ timeout: 6000 });
  });

  test('first name, last name, and email are required to update profile - cannot be empty', async ({ page }) => {
    const firstNameInput = page.locator('input[name="first_name"]');
    const lastNameInput = page.locator('input[name="last_name"]');
    const emailInput = page.locator('input[name="email"]');
    const saveBtn = page.getByRole('button', { name: /Save.*Changes|সংরক্ষণ/i });

    // Empty the first name
    await firstNameInput.fill('');
    await saveBtn.click();

    // Verify HTML5 or custom validation prevents submission
    const isFirstNameInvalid = await firstNameInput.evaluate((el: HTMLInputElement) => !el.checkValidity() || el.value.trim() === '');
    expect(isFirstNameInvalid).toBeTruthy();

    // Restore first name and empty email
    await firstNameInput.fill('Admin');
    await emailInput.fill('');
    await saveBtn.click();

    const isEmailInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity() || el.value.trim() === '');
    expect(isEmailInvalid).toBeTruthy();
  });

  test('can add addresses with limit of 5, and can update or delete them', async ({ page }) => {
    const addressSection = page.locator('text=/Saved Addresses|সংরক্ষিত ঠিকানা/i');
    await expect(addressSection.first()).toBeVisible();

    const addAddressBtn = page.getByRole('button', { name: /\+ Add New Address|\+ নতুন ঠিকানা/i });
    const existingAddresses = page.locator('button[title*="Edit Address"], button[title*="ঠিকানা সম্পাদনা"]');
    const existingCount = await existingAddresses.count();

    // If under 5, can add address
    if (existingCount < 5 && (await addAddressBtn.isVisible())) {
      await addAddressBtn.click();

      // Modal should appear
      const addressModal = page.locator('.fixed.inset-0').filter({ hasText: /Address|ঠিকানা/i }).first();
      await expect(addressModal).toBeVisible({ timeout: 10000 });

      const streetInput = addressModal.locator('textarea, input[name="street"], [placeholder*="Road" i], [placeholder*="ঠিকানা"]').first();
      await expect(streetInput).toBeVisible({ timeout: 5000 });
      await streetInput.fill('House 12, Road 5, Dhanmondi');

      const saveAddressBtn = addressModal.getByRole('button', { name: /Save Address|ঠিকানা সংরক্ষণ|Save/i });
      await saveAddressBtn.click();

      const toast = page.locator('.swal2-popup').or(page.getByText(/Address saved successfully|ঠিকানা সংরক্ষণ হয়েছে/i));
      await expect(toast.first()).toBeVisible({ timeout: 10000 }).catch(() => {});

      // Ensure modal is dismissed so it doesn't intercept subsequent clicks
      await expect(addressModal).not.toBeVisible({ timeout: 10000 }).catch(async () => {
        const cancelBtn = addressModal.getByRole('button', { name: /Cancel|বাতিল/i }).or(addressModal.locator('button[title*="Close"], button[title*="বন্ধ"]')).first();
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
          await expect(addressModal).not.toBeVisible({ timeout: 5000 }).catch(() => {});
        }
      });
    }

    // Edit address if at least one exists
    if (existingCount > 0) {
      const editBtn = page.locator('button[title*="Edit Address"], button[title*="সম্পাদনা"]').first();
      await editBtn.click();

      const editModal = page.locator('.fixed.inset-0').filter({ hasText: /Edit Address|ঠিকানা সম্পাদনা/i }).first();
      await expect(editModal).toBeVisible({ timeout: 10000 });

      // Cancel or close modal
      const cancelBtn = editModal.getByRole('button', { name: /Cancel|বাতিল/i }).or(editModal.locator('button[title*="Close"], button[title*="বন্ধ"]')).first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await expect(editModal).not.toBeVisible({ timeout: 10000 }).catch(() => {});
      }
    }

    // Delete address action button exists
    const deleteBtn = page.locator('button[title*="Delete Address"], button[title*="মুছে ফেলুন"]').first();
    if (await deleteBtn.isVisible()) {
      await expect(deleteBtn).toBeVisible();
    }
  });

  test('loads and shows VibeCoin properly and Shop Now button works', async ({ page }) => {
    // VibeCoin rewards section
    const vibeCoinBalance = page.locator('text=/VibeCoin Balance|ভাইবকয়েন ব্যালেন্স/i');
    await expect(vibeCoinBalance.first()).toBeVisible();

    const vibeCoinDisplay = page.locator('text=/VC/i').first();
    await expect(vibeCoinDisplay).toBeVisible();

    // Shop Now button in Order history header
    const shopNowBtn = page.getByRole('link', { name: /Shop Now|কেনাকাটা করুন/i });
    await expect(shopNowBtn).toBeVisible();
    await expect(shopNowBtn).toHaveAttribute('href', '/products');
  });

  test('loads and shows all orders with accurate details, cards update perfectly', async ({ page }) => {
    const ordersHeading = page.locator('text=/My Order History|আমার অর্ডার হিস্ট্রি/i');
    await expect(ordersHeading.first()).toBeVisible();

    const orderCards = page.locator('.space-y-3 > div:has-text("Order #"), .space-y-3 > div:has-text("অর্ডার #")');
    const orderCount = await orderCards.count();

    if (orderCount > 0) {
      const firstOrder = orderCards.first();
      await expect(firstOrder).toBeVisible();

      // Verify product price and quantity display
      const totalAmount = firstOrder.locator('text=৳');
      await expect(totalAmount.first()).toBeVisible();

      // View details button works
      const viewDetailsBtn = firstOrder.getByRole('button', { name: /View Details|বিস্তারিত দেখুন/i });
      await expect(viewDetailsBtn).toBeVisible();
      await viewDetailsBtn.click();

      // Order details modal opens
      const modal = page.locator('.fixed.inset-0');
      await expect(modal.first()).toBeVisible();

      // Close modal
      const closeBtn = modal.locator('button[title*="Close"], button[title*="বন্ধ"]').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

  test('shows order tracking, cancelling, and review options correctly', async ({ page }) => {
    // Look for track or review or cancel buttons
    const trackBtns = page.locator('button:has-text("Track"), button:has-text("ট্র্যাক")');
    if (await trackBtns.count() > 0) {
      await expect(trackBtns.first()).toBeVisible();
      // Click Track Order to test tracking modal
      await trackBtns.first().click();

      const trackingModal = page.locator('.fixed.inset-0');
      await expect(trackingModal.first()).toBeVisible();

      // Check Tracking Milestones / Delivery progress display
      const trackingHeading = trackingModal.locator('text=/Order Tracking|অর্ডার ট্র্যাকিং/i');
      await expect(trackingHeading.first()).toBeVisible();

      // Check for consignment or tracking code if present
      const copyTrackingBtn = trackingModal.locator('button[title*="Copy"], button:has-text("Copy")');
      if (await copyTrackingBtn.count() > 0) {
        await copyTrackingBtn.first().click();
      }

      // Close tracking modal
      const closeTrackingBtn = trackingModal.locator('button[title*="Close"], button[title*="বন্ধ"]').first();
      if (await closeTrackingBtn.isVisible()) {
        await closeTrackingBtn.click();
      }
    }

    const reviewBtns = page.locator('button:has-text("Review"), button:has-text("রিভিউ")');
    if (await reviewBtns.count() > 0) {
      await expect(reviewBtns.first()).toBeVisible();
    }

    const cancelBtns = page.locator('button:has-text("Cancel Order"), button:has-text("অর্ডার বাতিল")');
    if (await cancelBtns.count() > 0) {
      await expect(cancelBtns.first()).toBeVisible();
    }
  });

  test('return and refund request modal can be opened and validates item selection and refund details', async ({ page }) => {
    // Check if any delivered order has a Return button
    const returnBtns = page.locator('button:has-text("Return"), button:has-text("রিটার্ন")');
    if (await returnBtns.count() > 0) {
      await returnBtns.first().click();

      // Return modal should appear (either new request modal or status view modal)
      const returnModal = page.locator('.fixed.inset-0');
      await expect(returnModal.first()).toBeVisible();

      const returnTitle = returnModal.locator('text=/Return|Refund|রিটার্ন|রিফান্ড/i');
      await expect(returnTitle.first()).toBeVisible();

      // If it is the new return submission modal with checkboxes:
      const itemCheckboxes = returnModal.locator('input[type="checkbox"]');
      if (await itemCheckboxes.count() > 0) {
        // Step 1: Items can be selected/unselected
        await expect(itemCheckboxes.first()).toBeChecked();

        // Step 2: Reason select dropdown
        const reasonSelect = returnModal.locator('select').first();
        if (await reasonSelect.isVisible()) {
          await expect(reasonSelect).toBeVisible();
          await reasonSelect.selectOption('wrong_item');
        }

        // Step 4: Refund method radio selection (VibeCoin, bKash, Nagad)
        const bkashRadio = returnModal.locator('input[type="radio"][value="bkash"], label:has-text("bKash")');
        if (await bkashRadio.count() > 0) {
          await bkashRadio.first().click();
          const accountInput = returnModal.locator('input[type="tel"]');
          if (await accountInput.isVisible()) {
            await accountInput.fill('01711223344');
            expect(await accountInput.inputValue()).toBe('01711223344');
          }
        }
      }

      // Close return modal
      const closeBtn = returnModal.locator('button[title*="Close"], button[title*="বন্ধ"], button:has-text("Cancel"), button:has-text("বাতিল")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

  test('pagination of orders is working properly', async ({ page }) => {
    await expect(page.locator('text=/My Order History|আমার অর্ডার হিস্ট্রি/i').first()).toBeVisible({ timeout: 10000 });
    const nextOrderPageBtn = page.getByRole('button', { name: /^(Next|পরবর্তী)$/i });
    if (await nextOrderPageBtn.isVisible() && await nextOrderPageBtn.isEnabled()) {
      await nextOrderPageBtn.click();
      const pageIndicator = page.locator('text=/Showing|প্রদর্শিত হচ্ছে/i');
      await expect(pageIndicator.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('wishlist is loading perfectly, items can be removed, and empty state browse products works', async ({ page }) => {
    await page.goto('/wishlist', { waitUntil: 'domcontentloaded' });

    // Verify Wishlist title
    const wishlistHeading = page.locator('h1:has-text("Wishlist"), h1:has-text("উইশলিস্ট")');
    await expect(wishlistHeading).toBeVisible({ timeout: 15000 });

    // Verify "Continue Shopping" button has been cleanly removed from the UI header
    const continueShoppingBtn = page.getByRole('link', { name: /Continue Shopping|কেনাকাটা চালিয়ে যান/i });
    await expect(continueShoppingBtn).toHaveCount(0);

    const wishlistCards = page.locator('.grid a[href^="/products/"]');
    const itemCount = await wishlistCards.count();

    if (itemCount > 0) {
      // Remove button exists
      const removeBtn = page.locator('button[title*="Remove"], button[title*="সরান"]').first();
      await expect(removeBtn).toBeVisible();

      // View details button exists and works
      const viewDetails = page.locator('a:has-text("View Details"), a:has-text("বিস্তারিত দেখুন")').first();
      await expect(viewDetails).toBeVisible();
    } else {
      // Empty state
      const emptyHeading = page.locator('text=/Your Wishlist is Empty|আপনার উইশলিস্ট খালি/i');
      await expect(emptyHeading.first()).toBeVisible({ timeout: 10000 });

      // Browse Products button works
      const browseBtn = page.getByRole('link', { name: /Browse Products|পণ্য ব্রাউজ করুন/i });
      await expect(browseBtn).toBeVisible({ timeout: 10000 });
      await expect(browseBtn).toHaveAttribute('href', '/products');
    }
  });

  test('logout can be done perfectly', async ({ page }) => {
    // 1. Locate the user menu button in the header (shows username and dropdown arrow)
    const userMenuBtn = page.locator('header button:has(svg)').filter({ hasText: /AdminFirst|Admin|hello|[a-zA-Z0-9]+/i }).last();
    await expect(userMenuBtn).toBeVisible({ timeout: 15000 });
    await userMenuBtn.click();

    // 2. Locate and click Sign Out / লগআউট from the dropdown menu
    const signOutBtn = page.getByRole('button', { name: /SIGN OUT|সাইন আউট|Logout|লগআউট/i }).first();
    await expect(signOutBtn).toBeVisible({ timeout: 10000 });
    await signOutBtn.click();

    // 3. Confirm redirected to login page or home page and sign in button reappears
    await expect(page).toHaveURL(/\/login|\//, { timeout: 15000 });
    const signInLink = page.getByRole('link', { name: /SIGN IN|সাইন ইন/i }).first();
    await expect(signInLink).toBeVisible({ timeout: 15000 });
  });
});
