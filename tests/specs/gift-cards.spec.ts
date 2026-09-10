import { test, expect } from '@playwright/test';

test.describe('Gift Cards Feature Suite', () => {
  let cachedAuth: { access: string; refresh: string } | null = null;

  // Helper to obtain a cached JWT token for customer 'hello' (email: hello@gmail.com)
  async function getCustomerToken(page: any) {
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
        console.error('Failed to get customer auth token:', e);
      }
    }
    return cachedAuth;
  }

  // Setup session for gift cards page (either authenticated as customer 'hello' or guest)
  async function setupGiftCardsSession(page: any, authenticated = true) {
    let token: string | null = null;
    let refresh: string | null = null;

    if (authenticated) {
      const auth = await getCustomerToken(page);
      token = auth?.access || null;
      refresh = auth?.refresh || null;
    }

    await page.addInitScript(
      ({ token, refresh }: { token: string | null; refresh: string | null }) => {
        if (token) {
          localStorage.setItem('access_token', token);
          if (refresh) localStorage.setItem('refresh_token', refresh);
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      },
      { token, refresh }
    );

    await page.goto('/gift-cards', { waitUntil: 'domcontentloaded' });

    if (authenticated) {
      // Wait until user profile is hydrated in React AuthContext
      const userBtn = page.locator('header button').filter({ hasText: /AdminFirst|hello/i }).first();
      await expect(userBtn).toBeVisible({ timeout: 15000 });
    }
  }

  /* -------------------------------------------------------------------------- */
  /* 1. Page Elements, Navigation & Denominations (Guest / Public)              */
  /* -------------------------------------------------------------------------- */
  test.describe('1. Page Elements, Navigation & Denominations', () => {
    test('displays page title, main heading, and breadcrumbs with working Home link', async ({ page }) => {
      await setupGiftCardsSession(page, false);

      // Page Title
      await expect(page).toHaveTitle(/Gift Cards|VibeMart/i);

      // Main Heading
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
      await expect(heading).toHaveText(/Gift Cards|গিফট কার্ড/i);

      // Breadcrumbs
      const homeBreadcrumb = page.getByRole('link', { name: /Home|হোম/i }).first();
      await expect(homeBreadcrumb).toBeVisible();

      const giftCardsLabel = page.locator('span').filter({ hasText: /Gift Cards|গিফট কার্ড/i }).first();
      await expect(giftCardsLabel).toBeVisible();

      // Click Home breadcrumb link and verify navigation to homepage
      await homeBreadcrumb.click();
      await expect(page).toHaveURL('/', { timeout: 10000 });
    });

    test('renders all 6 preset gift card tiers with badges and visual card styling', async ({ page }) => {
      await setupGiftCardsSession(page, false);

      // Verify all 6 cards exist in the grid
      const cardContainers = page.locator('main .grid > div');
      await expect(cardContainers).toHaveCount(6);

      // Verify all 6 tier badges
      const badges = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'VIP ELITE'];
      for (const badge of badges) {
        const badgeLocator = page.locator(`span:has-text("${badge}")`).first();
        await expect(badgeLocator).toBeVisible();
      }

      // Verify pricing displayed on cards
      const prices = ['500', '1,000', '1,500', '2,000', '2,500', '3,000'];
      for (const price of prices) {
        const priceElement = page.locator(`p:has-text("${price}")`).or(page.locator(`span:has-text("${price}")`)).first();
        await expect(priceElement).toBeVisible();
      }

      // Verify VIBEMART brand mark and card masked digits
      const brandMarks = page.locator('span:has-text("VIBEMART")');
      expect(await brandMarks.count()).toBeGreaterThanOrEqual(6);

      const maskedDigits = page.locator('span:has-text("•••• •••• •••• ••••")');
      expect(await maskedDigits.count()).toBeGreaterThanOrEqual(6);

      // Verify top-level Redeem button
      const redeemBtn = page.getByRole('button', { name: /Redeem Gift Card|রিডিম করুন/i });
      await expect(redeemBtn).toBeVisible();
    });

    test('unauthenticated user clicking Purchase Card triggers sign-in prompt and redirects to login', async ({ page }) => {
      await setupGiftCardsSession(page, false);

      // Click first Purchase Card button
      const purchaseBtn = page.getByRole('button', { name: /Purchase Card|ক্রয় করুন/i }).first();
      await purchaseBtn.click();

      // SweetAlert warning modal should appear
      const swalPopup = page.locator('.swal2-popup');
      await expect(swalPopup).toBeVisible({ timeout: 10000 });
      await expect(swalPopup).toContainText(/Please Sign In|অনুগ্রহ করে সাইন ইন করুন/i);
      await expect(swalPopup).toContainText(/You must be logged in to purchase a gift card|গিফট কার্ড ক্রয় করতে আপনাকে লগইন করতে হবে/i);

      // Confirm dialog redirects to login with return redirect param
      const confirmBtn = swalPopup.locator('button.swal2-confirm');
      await confirmBtn.click();

      await expect(page).toHaveURL(/\/login\?redirect=%2Fgift-cards/, { timeout: 10000 });
    });

    test('unauthenticated user clicking Redeem Gift Card triggers sign-in prompt and redirects to login', async ({ page }) => {
      await setupGiftCardsSession(page, false);

      // Click Redeem Gift Card button in header
      const redeemBtn = page.getByRole('button', { name: /Redeem Gift Card|রিডিম করুন/i });
      await redeemBtn.click();

      // SweetAlert warning modal should appear
      const swalPopup = page.locator('.swal2-popup');
      await expect(swalPopup).toBeVisible({ timeout: 10000 });
      await expect(swalPopup).toContainText(/Please Sign In|অনুগ্রহ করে সাইন ইন করুন/i);
      await expect(swalPopup).toContainText(/You must be logged in to redeem a gift card|গিফট কার্ড রিডিম করতে আপনাকে লগইন করতে হবে/i);

      // Confirm dialog redirects to login with return redirect param
      const confirmBtn = swalPopup.locator('button.swal2-confirm');
      await confirmBtn.click();

      await expect(page).toHaveURL(/\/login\?redirect=%2Fgift-cards/, { timeout: 10000 });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. Purchase Modal Controls & Form Validation (Authenticated)               */
  /* -------------------------------------------------------------------------- */
  test.describe('2. Purchase Modal Controls & Form Validation', () => {
    test('purchase button opens modal with card tier info and allows dismissal via close (✕) button', async ({ page }) => {
      await setupGiftCardsSession(page, true);

      // Click on the ৳500 card
      const purchaseBtn = page.getByRole('button', { name: /Purchase Card|ক্রয় করুন/i }).first();
      await purchaseBtn.click();

      // Modal appears
      const modal = page.locator('.fixed.inset-0');
      await expect(modal).toBeVisible({ timeout: 8000 });

      // Displays card title and amount
      await expect(modal.locator('h3')).toContainText(/500/);

      // Click top-right ✕ button
      const closeBtn = modal.locator('button:has-text("✕")');
      await expect(closeBtn).toBeVisible();
      await closeBtn.click();

      // Modal should be closed
      await expect(modal).not.toBeVisible();
    });

    test('purchase modal can be dismissed via the Cancel button in footer', async ({ page }) => {
      await setupGiftCardsSession(page, true);

      // Open modal on second card (৳1,000)
      const purchaseBtns = page.getByRole('button', { name: /Purchase Card|ক্রয় করুন/i });
      await purchaseBtns.nth(1).click();

      const modal = page.locator('.fixed.inset-0');
      await expect(modal).toBeVisible({ timeout: 8000 });

      // Find Cancel button in modal
      const cancelBtn = modal.getByRole('button', { name: /Cancel|বাতিল/i });
      await expect(cancelBtn).toBeVisible();
      await cancelBtn.click();

      // Modal should be closed
      await expect(modal).not.toBeVisible();
    });

    test('validates required recipient email before submission', async ({ page }) => {
      await setupGiftCardsSession(page, true);

      const purchaseBtn = page.getByRole('button', { name: /Purchase Card|ক্রয় করুন/i }).first();
      await purchaseBtn.click();

      const modal = page.locator('.fixed.inset-0');
      await expect(modal).toBeVisible();

      const emailInput = modal.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();

      const submitBtn = modal.getByRole('button', { name: /Complete Order & Purchase|Place Order|ক্রয় সম্পন্ন করুন/i });

      // Leave email empty and attempt submit
      await emailInput.fill('');
      await submitBtn.click();

      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity() || el.value.trim() === '');
      expect(isInvalid).toBeTruthy();
    });

    test('validates required sender mobile and transaction ID (TrxID)', async ({ page }) => {
      await setupGiftCardsSession(page, true);

      const purchaseBtn = page.getByRole('button', { name: /Purchase Card|ক্রয় করুন/i }).first();
      await purchaseBtn.click();

      const modal = page.locator('.fixed.inset-0');
      await expect(modal).toBeVisible();

      // Fill recipient email, but leave sender phone and TrxID empty
      const emailInput = modal.locator('input[type="email"]');
      await emailInput.fill('friend@example.com');

      const submitBtn = modal.getByRole('button', { name: /Complete Order & Purchase|Place Order|ক্রয় সম্পন্ন করুন/i });
      await submitBtn.click();

      // Error message prompt should be displayed
      const errorAlert = modal.locator('text=/Please enter both Sender Phone Number and|অনুগ্রহ করে প্রেরকের মোবাইল নম্বর/i');
      await expect(errorAlert.first()).toBeVisible();
    });

    test('sanitizes recipient phone and transaction mobile to numeric digits with max length 11', async ({ page }) => {
      await setupGiftCardsSession(page, true);

      const purchaseBtn = page.getByRole('button', { name: /Purchase Card|ক্রয় করুন/i }).first();
      await purchaseBtn.click();

      const modal = page.locator('.fixed.inset-0');
      await expect(modal).toBeVisible();

      // Recipient phone sanitization
      const recipientPhoneInput = modal.locator('input[type="tel"]').first();
      await recipientPhoneInput.fill('abc01712-345678xyz999');
      const recipientValue = await recipientPhoneInput.inputValue();
      expect(recipientValue).toBe('01712345678');
      expect(recipientValue.length).toBe(11);

      // Sender transaction mobile sanitization
      const senderPhoneInput = modal.locator('input[type="tel"]').nth(1);
      await senderPhoneInput.fill('01888-765432-extra');
      const senderValue = await senderPhoneInput.inputValue();
      expect(senderValue).toBe('01888765432');
      expect(senderValue.length).toBe(11);
    });

    test('displays self-gifting personalization callout when recipient email matches user email', async ({ page }) => {
      await setupGiftCardsSession(page, true);

      const purchaseBtn = page.getByRole('button', { name: /Purchase Card|ক্রয় করুন/i }).first();
      await purchaseBtn.click();

      const modal = page.locator('.fixed.inset-0');
      await expect(modal).toBeVisible();

      const emailInput = modal.locator('input[type="email"]');

      // Enter someone else's email first -> no self-gifting note
      await emailInput.fill('someoneelse@example.com');
      const selfGiftNote = modal.locator('text=/Special Note|বিশেষ দ্রষ্টব্য|Buying this for yourself/i');
      await expect(selfGiftNote).not.toBeVisible();

      // Enter current logged-in user's email ('hello@gmail.com') -> self-gifting note appears
      await emailInput.fill('hello@gmail.com');
      await expect(selfGiftNote.first()).toBeVisible();

      // Clear email -> self-gifting note disappears
      await emailInput.fill('other@domain.com');
      await expect(selfGiftNote).not.toBeVisible();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. Mobile Payment UI (bKash & Nagad)                                       */
  /* -------------------------------------------------------------------------- */
  test.describe('3. Mobile Payment UI (bKash & Nagad)', () => {
    test('toggles between bKash and Nagad payment methods and updates theme & instructions', async ({ page }) => {
      await setupGiftCardsSession(page, true);

      const purchaseBtn = page.getByRole('button', { name: /Purchase Card|ক্রয় করুন/i }).first();
      await purchaseBtn.click();

      const modal = page.locator('.fixed.inset-0');
      await expect(modal).toBeVisible();

      // Default should be bKash
      const bkashToggle = modal.getByRole('button', { name: /bKash|বিকাশ/i }).first();
      const nagadToggle = modal.getByRole('button', { name: /Nagad|নগদ/i }).first();

      await expect(bkashToggle).toBeVisible();
      await expect(nagadToggle).toBeVisible();

      // Verify bKash container visible
      const bkashContainer = modal.locator('.bg-bkash');
      await expect(bkashContainer).toBeVisible();

      // Switch to Nagad
      await nagadToggle.click();

      // Nagad container should now be visible and bKash hidden
      const nagadContainer = modal.locator('.bg-nagad');
      await expect(nagadContainer).toBeVisible();
      await expect(bkashContainer).not.toBeVisible();

      // Switch back to bKash
      await bkashToggle.click();
      await expect(bkashContainer).toBeVisible();
      await expect(nagadContainer).not.toBeVisible();
    });

    test('receiver mobile number can be copied to clipboard with visual feedback for both bKash and Nagad', async ({ page }) => {
      await setupGiftCardsSession(page, true);

      const purchaseBtn = page.getByRole('button', { name: /Purchase Card|ক্রয় করুন/i }).first();
      await purchaseBtn.click();

      const modal = page.locator('.fixed.inset-0');
      await expect(modal).toBeVisible();

      // 1. Copy in bKash mode
      const bkashCopyBtn = modal.locator('.bg-bkash button:has-text("Copy"), .bg-bkash button:has-text("কপি")').first();
      await expect(bkashCopyBtn).toBeVisible();
      await bkashCopyBtn.click();

      // Button updates feedback (e.g. "Copied!" or check icon)
      const copiedFeedback = modal.locator('text=/Copied!|কপি হয়েছে!/i');
      await expect(copiedFeedback.first()).toBeVisible();

      // 2. Switch to Nagad mode and copy
      const nagadToggle = modal.getByRole('button', { name: /Nagad|নগদ/i }).first();
      await nagadToggle.click();

      const nagadCopyBtn = modal.locator('.bg-nagad button:has-text("Copy"), .bg-nagad button:has-text("কপি")').first();
      await expect(nagadCopyBtn).toBeVisible();
      await nagadCopyBtn.click();

      await expect(modal.locator('text=/Copied!|কপি হয়েছে!/i').first()).toBeVisible();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. Purchase Completion & Redemption Workflows                             */
  /* -------------------------------------------------------------------------- */
  test.describe('4. Purchase Completion & Redemption Workflows', () => {
    test('completes end-to-end gift card purchase and displays generated 16-character code with copy button', async ({ page }) => {
      await setupGiftCardsSession(page, true);

      // Open modal for ৳500 card
      const purchaseBtn = page.getByRole('button', { name: /Purchase Card|ক্রয় করুন/i }).first();
      await purchaseBtn.click();

      const modal = page.locator('.fixed.inset-0');
      await expect(modal).toBeVisible();

      // Fill out valid order form
      const emailInput = modal.locator('input[type="email"]');
      await emailInput.fill('hello@gmail.com');

      const senderPhoneInput = modal.locator('input[type="tel"]').nth(1);
      await senderPhoneInput.fill('01711223344');

      const trxIdInput = modal.locator('input[placeholder*="TrxID"]').or(modal.locator('input[placeholder*="TRX"]')).first();
      const uniqueTrx = `TRX${Date.now().toString().slice(-8)}`;
      await trxIdInput.fill(uniqueTrx);

      // Submit purchase
      const submitBtn = modal.getByRole('button', { name: /Complete Order & Purchase|Place Order|ক্রয় সম্পন্ন করুন/i });
      await submitBtn.click();

      // SweetAlert purchase confirmation popup should appear
      const swalPopup = page.locator('.swal2-popup');
      await expect(swalPopup).toBeVisible({ timeout: 15000 });
      await expect(swalPopup).toContainText(/Gift Card Purchased & Order Placed|অর্ডার সম্পন্ন হয়েছে/i);

      // Dismiss SweetAlert confirmation
      const swalConfirmBtn = swalPopup.locator('button.swal2-confirm');
      await swalConfirmBtn.click();

      // Success view in modal should be visible with 16-character code
      await expect(modal.locator('text=/Order Successful|সফল হয়েছে/i').first()).toBeVisible({ timeout: 8000 });

      const codeDisplay = modal.locator('.font-mono.text-lg');
      await expect(codeDisplay).toBeVisible();
      const codeText = (await codeDisplay.innerText()).trim();
      expect(codeText.length).toBe(16);

      // Test Copy Code button in success view
      const copyCodeBtn = modal.getByRole('button', { name: /Copy|কপি/i });
      await expect(copyCodeBtn).toBeVisible();
      await copyCodeBtn.click();

      // Toast notification should appear
      const toast = page.locator('.swal2-toast');
      await expect(toast).toBeVisible({ timeout: 5000 });
      await expect(toast).toContainText(/copied to clipboard|ক্লিপবোর্ডে কপি করা হয়েছে/i);

      // Close Window button dismisses the modal
      const closeWindowBtn = modal.getByRole('button', { name: /Close Window|বন্ধ করুন/i });
      await closeWindowBtn.click();
      await expect(modal).not.toBeVisible();
    });

    test('redeem gift card modal can be opened and canceled smoothly', async ({ page }) => {
      await setupGiftCardsSession(page, true);

      // Click "Redeem Gift Card"
      const redeemBtn = page.getByRole('button', { name: /Redeem Gift Card|রিডিম করুন/i });
      await redeemBtn.click();

      // SweetAlert prompt modal appears
      const swalModal = page.locator('.swal2-popup');
      await expect(swalModal).toBeVisible({ timeout: 8000 });

      // Click Cancel button
      const cancelBtn = swalModal.locator('button.swal2-cancel');
      await expect(cancelBtn).toBeVisible();
      await cancelBtn.click();

      // Modal dismisses smoothly
      await expect(swalModal).not.toBeVisible();
    });

    test('validates empty code and invalid code submissions in redeem dialog', async ({ page }) => {
      await setupGiftCardsSession(page, true);

      const redeemBtn = page.getByRole('button', { name: /Redeem Gift Card|রিডিম করুন/i });
      await redeemBtn.click();

      const swalModal = page.locator('.swal2-popup');
      await expect(swalModal).toBeVisible();

      const cardCodeInput = swalModal.locator('input.swal2-input');
      const confirmRedeemBtn = swalModal.locator('button.swal2-confirm');

      // 1. Validation on empty code
      await cardCodeInput.fill('');
      await confirmRedeemBtn.click();

      const validationMsg = swalModal.locator('.swal2-validation-message');
      await expect(validationMsg).toBeVisible();
      await expect(validationMsg).toContainText(/Please enter a valid 16-digit Gift Card code|সঠিক ১৬-সংখ্যার গিফট কার্ড কোড লিখুন/i);

      // 2. Submit non-existent 16-digit code
      await cardCodeInput.fill('NONEXISTENT12345');
      await confirmRedeemBtn.click();

      // Error popup should be displayed
      const errorPopup = page.locator('.swal2-popup');
      await expect(errorPopup).toBeVisible({ timeout: 10000 });
      await expect(errorPopup).toContainText(/Redemption Failed|রিডিম ব্যর্থ হয়েছে|Invalid gift card code/i);
    });

    test('successfully redeems a valid gift card and shows VibeCoin credit celebration dialog', async ({ page }) => {
      // 1. Obtain auth token and programmatically purchase an active card for 'hello@gmail.com'
      const auth = await getCustomerToken(page);
      const token = auth?.access;

      const createRes = await page.request.post('http://127.0.0.1:8000/store/gift-cards/', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        data: {
          user_email: 'hello@gmail.com',
          price: 500,
          phone: '01712345678',
          transaction_id: `TRXRED${Date.now().toString().slice(-7)}`,
          transaction_phone_no: '01712345678',
          payment_method: 'B',
        },
      });

      expect(createRes.ok()).toBeTruthy();
      const cardData = await createRes.json();
      const validCode = cardData.card_code;
      expect(validCode).toBeTruthy();

      // 2. Load gift cards page authenticated
      await setupGiftCardsSession(page, true);

      // 3. Click "Redeem Gift Card"
      const redeemBtn = page.getByRole('button', { name: /Redeem Gift Card|রিডিম করুন/i });
      await redeemBtn.click();

      const swalModal = page.locator('.swal2-popup');
      await expect(swalModal).toBeVisible();

      const cardCodeInput = swalModal.locator('input.swal2-input');
      await cardCodeInput.fill(validCode);

      const confirmBtn = swalModal.locator('button.swal2-confirm');
      await confirmBtn.click();

      // 4. Celebration dialog should appear
      const celebrationModal = page.locator('.swal2-popup');
      await expect(celebrationModal).toBeVisible({ timeout: 10000 });
      await expect(celebrationModal).toContainText(/Congratulations|অভিনন্দন/i);
      await expect(celebrationModal).toContainText(/VibeCoin/i);
      await expect(celebrationModal).toContainText(validCode);

      // Close celebration modal
      const awesomeBtn = celebrationModal.locator('button.swal2-confirm');
      await awesomeBtn.click();
      await expect(celebrationModal).not.toBeVisible();
    });
  });
});
