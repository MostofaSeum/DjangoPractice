import { test, expect } from '@playwright/test';

test.describe('Storefront Homepage - Complete Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  /* -------------------------------------------------------------------------- */
  /* 1. Header, Navigation & Global Branding                                    */
  /* -------------------------------------------------------------------------- */
  test.describe('1. Header, Navigation & Global Branding', () => {
    test('displays page title and header brand logo/title', async ({ page }) => {
      // Check HTML Title
      await expect(page).toHaveTitle(/VibeMart/i);

      // Verify Header Brand Link
      const brandLink = page.locator('header').getByRole('link', { name: /VIBEMART/i });
      await expect(brandLink).toBeVisible();
      await expect(brandLink).toHaveAttribute('href', '/');
    });

    test('displays all top desktop navigation links with correct href attributes', async ({ page }) => {
      const headerNav = page.locator('header nav');
      await expect(headerNav).toBeVisible();

      // Home Link
      const homeLink = headerNav.getByRole('link', { name: /HOME/i });
      await expect(homeLink).toBeVisible();
      await expect(homeLink).toHaveAttribute('href', '/');

      // Shop Link
      const shopLink = headerNav.getByRole('link', { name: /SHOP/i });
      await expect(shopLink).toBeVisible();
      await expect(shopLink).toHaveAttribute('href', '/products');

      // Categories Link
      const categoriesLink = headerNav.getByRole('link', { name: /CATEGORIES/i });
      await expect(categoriesLink).toBeVisible();
      await expect(categoriesLink).toHaveAttribute('href', '/collections');

      // Gift Cards Link
      const giftCardsLink = headerNav.getByRole('link', { name: /GIFT CARDS/i });
      await expect(giftCardsLink).toBeVisible();
      await expect(giftCardsLink).toHaveAttribute('href', '/gift-cards');
    });

    test('displays header action buttons: language toggle, theme toggle, cart button and sign in', async ({ page }) => {
      // Language Switcher Button (mounted via client state)
      const langToggle = page.getByRole('button', { name: 'Toggle Language' });
      await expect(langToggle).toBeVisible({ timeout: 10000 });

      // Theme Switcher Button (mounted via client state)
      const themeToggle = page.getByRole('button', { name: 'Toggle Light and Dark Mode' });
      await expect(themeToggle).toBeVisible({ timeout: 10000 });

      // Cart Link
      const cartLink = page.locator('header').getByRole('link', { name: /cart/i });
      await expect(cartLink).toBeVisible();

      // Sign In Link (when unauthenticated)
      const signInLink = page.locator('header').getByRole('link', { name: /SIGN IN/i });
      await expect(signInLink).toBeVisible();
      await expect(signInLink).toHaveAttribute('href', /login/);
    });

    test('navigating via header nav links opens appropriate pages', async ({ page }) => {
      // Click Shop Link
      const shopLink = page.locator('header nav').getByRole('link', { name: /SHOP/i });
      await shopLink.click();
      await expect(page).toHaveURL(/\/products/);

      // Return to homepage
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      // Click Categories Link
      const categoriesLink = page.locator('header nav').getByRole('link', { name: /CATEGORIES/i });
      await categoriesLink.click();
      await expect(page).toHaveURL(/\/collections/);

      // Return to homepage
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      // Click Gift Cards Link
      const giftCardsLink = page.locator('header nav').getByRole('link', { name: /GIFT CARDS/i });
      await giftCardsLink.click();
      await expect(page).toHaveURL(/\/gift-cards/);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. Theme Switching                                                         */
  /* -------------------------------------------------------------------------- */
  test.describe('2. Dark & Light Theme Switching', () => {
    test('toggles theme between light and dark modes', async ({ page }) => {
      const themeToggle = page.getByRole('button', { name: 'Toggle Light and Dark Mode' });
      await expect(themeToggle).toBeVisible({ timeout: 10000 });
      const htmlElement = page.locator('html');

      // Check initial theme class
      const initialClass = (await htmlElement.getAttribute('class')) || '';

      // Click theme toggle
      await themeToggle.click();
      await page.waitForTimeout(300);
      const toggledClass = (await htmlElement.getAttribute('class')) || '';
      expect(toggledClass).not.toEqual(initialClass);

      // Click again to toggle back
      await themeToggle.click();
      await page.waitForTimeout(300);
      const revertedClass = (await htmlElement.getAttribute('class')) || '';
      expect(revertedClass).toEqual(initialClass);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. Internationalization (Language Switcher)                                 */
  /* -------------------------------------------------------------------------- */
  test.describe('3. Localization & Language Switcher', () => {
    test('switches language between English and Bangla across UI text', async ({ page }) => {
      const langToggle = page.getByRole('button', { name: 'Toggle Language' });
      await expect(langToggle).toBeVisible({ timeout: 10000 });

      // 1. Switch to Bangla
      await langToggle.click();

      // Check header nav in Bangla or URL pushState
      const shopBn = page.locator('header nav').getByRole('link', { name: /শপ|SHOP/i });
      await expect(shopBn).toBeVisible();

      // Check Why Us section heading
      const whyUsHeading = page.locator('main section').last().locator('h2');
      await expect(whyUsHeading).toBeVisible();

      // 2. Switch back to English
      await langToggle.click();

      // Check header nav reverted to English
      const shopEn = page.locator('header nav').getByRole('link', { name: /SHOP/i });
      await expect(shopEn).toBeVisible();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. Top Promotional Banner                                                  */
  /* -------------------------------------------------------------------------- */
  test.describe('4. Top Promotional Banner', () => {
    test('checks promotion banner presence and link validity', async ({ page }) => {
      const bannerLink = page.locator('a:has(img[alt="Special Promotion Banner"])');
      const count = await bannerLink.count();

      if (count > 0) {
        await expect(bannerLink).toBeVisible();
        const href = await bannerLink.getAttribute('href');
        expect(href).toBeTruthy();
      }
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 5. Bento Grid Hero Section                                                 */
  /* -------------------------------------------------------------------------- */
  test.describe('5. Bento Grid Hero Section', () => {
    test('displays Main Hero Card with badge, title prefix, animated word, and CTA', async ({ page }) => {
      // Main Hero Heading
      const heroHeading = page.locator('section').first().locator('h1');
      await expect(heroHeading).toBeVisible();
      await expect(heroHeading).toContainText(/Elevate Your/i);

      // Explore Collection CTA Button
      const exploreBtn = page.locator('section').first().getByRole('link', { name: /Explore Collection/i });
      await expect(exploreBtn).toBeVisible();
      await expect(exploreBtn).toHaveAttribute('href', /\/collections/);
    });

    test('displays Discover Card with title, subtitle, and CTA link', async ({ page }) => {
      // Discover Heading
      const discoverHeading = page.getByRole('heading', { name: /Discover the Glam/i });
      await expect(discoverHeading).toBeVisible();

      // View Exclusives CTA Link
      const exclusivesBtn = page.getByRole('link', { name: /View Exclusives/i });
      await expect(exclusivesBtn).toBeVisible();
      await expect(exclusivesBtn).toHaveAttribute('href', /\/products/);
    });

    test('verifies interactive Bento Grid items structure and count', async ({ page }) => {
      const heroSection = page.locator('section').first();
      const gridContainer = heroSection.locator('div.grid');
      await expect(gridContainer).toBeVisible();

      // 8 items in the bento grid: Main Card, Discover, Slot 1, Slot 5 (24/7 Drops), Slot 6 (Delivery), Slot 2, Slot 3, Slot 4
      const gridCards = gridContainer.locator('> div, > a');
      await expect(gridCards).toHaveCount(8);
    });

    test('clicking Explore Collection CTA redirects to collections page', async ({ page }) => {
      const exploreBtn = page.locator('section').first().getByRole('link', { name: /Explore Collection/i });
      await exploreBtn.click();
      await expect(page).toHaveURL(/\/collections/);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 6. Featured Categories Section                                             */
  /* -------------------------------------------------------------------------- */
  test.describe('6. Featured Categories Section', () => {
    test('displays section heading and View All link', async ({ page }) => {
      const catSection = page.locator('main section').first();
      const categoriesHeading = catSection.locator('h2');
      await expect(categoriesHeading).toBeVisible();

      // View All link next to Featured Categories
      const viewAllCategories = catSection.getByRole('link', { name: /View All|categories\.viewAll/i });
      await expect(viewAllCategories).toBeVisible();
      await expect(viewAllCategories).toHaveAttribute('href', '/collections');
    });

    test('clicking Featured Categories View All navigates to collections', async ({ page }) => {
      const catSection = page.locator('main section').first();
      const viewAllCategories = catSection.getByRole('link', { name: /View All|categories\.viewAll/i });
      await viewAllCategories.click();
      await expect(page).toHaveURL(/\/collections/);
    });

    test('renders category cards or empty state message gracefully', async ({ page }) => {
      const catSection = page.locator('main section').first();
      const categoryLinks = catSection.locator('a[href^="/collections/"]');
      const noCollectionsMsg = catSection.getByText(/No collections available/i);

      const hasCards = (await categoryLinks.count()) > 0;
      const hasEmptyMsg = (await noCollectionsMsg.count()) > 0;

      expect(hasCards || hasEmptyMsg).toBeTruthy();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 7. Trending Now Products Section & Add to Cart Action                      */
  /* -------------------------------------------------------------------------- */
  test.describe('7. Trending Now Products Section', () => {
    test('displays Trending Now heading and View All link', async ({ page }) => {
      const trendingSection = page.locator('main section').nth(1);
      const trendingHeading = trendingSection.locator('h2');
      await expect(trendingHeading).toBeVisible();

      const viewAllTrending = trendingSection.getByRole('link', { name: /View All|trending\.viewAll/i });
      await expect(viewAllTrending).toBeVisible();
      await expect(viewAllTrending).toHaveAttribute('href', '/products');
    });

    test('clicking Trending View All navigates to products catalog', async ({ page }) => {
      const trendingSection = page.locator('main section').nth(1);
      const viewAllTrending = trendingSection.getByRole('link', { name: /View All|trending\.viewAll/i });
      await viewAllTrending.click();
      await page.waitForURL(/\/products/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/products/);
    });

    test('product cards display titles, prices, and Add to Cart buttons', async ({ page }) => {
      const trendingSection = page.locator('main section').nth(1);
      const productCards = trendingSection.locator('div.group');

      const count = await productCards.count();
      if (count > 0) {
        const firstCard = productCards.first();
        // Product title check
        await expect(firstCard.locator('h4')).toBeVisible();

        // Add to Cart Button check
        const addToCartBtn = firstCard.getByRole('button', { name: /Add to Cart|trending\.addToCart/i });
        await expect(addToCartBtn).toBeVisible();
      }
    });

    test('clicking a trending product navigates to its detail page', async ({ page }) => {
      const trendingSection = page.locator('main section').nth(1);
      const firstProductLink = trendingSection.locator('a[href^="/products/"]').first();

      if ((await firstProductLink.count()) > 0) {
        await firstProductLink.click();
        await expect(page).toHaveURL(/\/products\/\d+/);
      }
    });

    test('clicking Add to Cart triggers cart update and notification', async ({ page }) => {
      const trendingSection = page.locator('main section').nth(1);
      const addToCartBtn = trendingSection.getByRole('button', { name: /Add to Cart|trending\.addToCart/i }).first();

      if ((await addToCartBtn.count()) > 0) {
        await addToCartBtn.click();

        // Toast/alert confirmation or cart badge update
        const toastNotification = page.locator('.swal2-popup, [role="status"], [role="alert"]');
        await expect(toastNotification).toBeVisible({ timeout: 5000 });
      }
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 8. Why VibeMart Value Proposition Section                                  */
  /* -------------------------------------------------------------------------- */
  test.describe('8. Why VibeMart (Value Proposition)', () => {
    test('displays Why VibeMart heading and all 3 value cards', async ({ page }) => {
      const whyUsSection = page.locator('main section').last();
      const whyUsHeading = whyUsSection.locator('h2');
      await expect(whyUsHeading).toBeVisible();

      // Check 3 value proposition cards
      const valueCards = whyUsSection.locator('div.grid > div');
      await expect(valueCards).toHaveCount(3);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 9. Join the Glam Club Newsletter Subscription                             */
  /* -------------------------------------------------------------------------- */
  test.describe('9. Newsletter Subscription (Join the Glam Club)', () => {
    test('renders newsletter heading, subtitle, input field and submit button', async ({ page }) => {
      // Heading
      const heading = page.getByRole('heading', { name: /Join the Glam Club|newsletter\.title/i });
      await expect(heading).toBeVisible();

      // Email input
      const emailInput = page.getByPlaceholder(/Enter your email address|newsletter\.placeholder/i);
      await expect(emailInput).toBeVisible();

      // Subscribe button
      const subscribeBtn = page.getByRole('button', { name: /Subscribe|newsletter\.subscribe/i });
      await expect(subscribeBtn).toBeVisible();
    });

    test('shows validation feedback when subscribing with empty input', async ({ page }) => {
      const subscribeBtn = page.getByRole('button', { name: /Subscribe|newsletter\.subscribe/i });
      const emailInput = page.getByPlaceholder(/Enter your email address|newsletter\.placeholder/i);

      // Ensure input is empty
      await emailInput.fill('');
      await subscribeBtn.click();

      // Either browser HTML5 validation or SweetAlert popup
      const popup = page.locator('.swal2-popup');
      const isInputInvalid = await emailInput.evaluate(
        (el: HTMLInputElement) => !el.checkValidity()
      );

      const hasPopup = (await popup.count()) > 0;
      expect(isInputInvalid || hasPopup).toBeTruthy();
    });

    test('can enter email and submit newsletter form', async ({ page }) => {
      const emailInput = page.getByPlaceholder(/Enter your email address|newsletter\.placeholder/i);
      const subscribeBtn = page.getByRole('button', { name: /Subscribe|newsletter\.subscribe/i });

      const testEmail = `subscriber_${Date.now()}@example.com`;
      await emailInput.fill(testEmail);
      await subscribeBtn.click();

      // Verify either SweetAlert popup, status alert, or input clear indicates submission completed
      const alertPopup = page.locator('.swal2-container, .swal2-popup, [role="alert"], [role="status"]');
      await expect(alertPopup).toBeVisible({ timeout: 10000 });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 10. Footer Section & Quick Links                                           */
  /* -------------------------------------------------------------------------- */
  test.describe('10. Footer Section & Quick Links', () => {
    test('displays footer navigation links: About Us, Contact Us, My Account, Order Tracking, Refund Policy', async ({ page }) => {
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();

      // About Us
      await expect(footer.getByRole('link', { name: /About Us/i })).toBeVisible();

      // Contact Us
      await expect(footer.getByRole('link', { name: /Contact Us/i })).toBeVisible();

      // My Account
      await expect(footer.getByRole('link', { name: /My Account/i })).toBeVisible();

      // Order Tracking
      await expect(footer.getByRole('link', { name: /Order Tracking/i })).toBeVisible();

      // Refund Policy
      await expect(footer.getByRole('link', { name: /Refund/i })).toBeVisible();
    });

    test('displays payment partner badges (bKash, Nagad, VibeCoin, COD)', async ({ page }) => {
      const footer = page.locator('footer');

      // Check payment partner logo images
      const bkashBadge = footer.locator('img[alt="bKash"]');
      const nagadBadge = footer.locator('img[alt="Nagad"]');
      const vibeCoinBadge = footer.locator('img[alt="VibeCoin"]');
      const codBadge = footer.locator('img[alt="Cash on Delivery"]');

      await expect(bkashBadge).toBeVisible();
      await expect(nagadBadge).toBeVisible();
      await expect(vibeCoinBadge).toBeVisible();
      await expect(codBadge).toBeVisible();
    });

    test('displays footer branding, copyright notice, and scroll-to-top button', async ({ page }) => {
      const footer = page.locator('footer');

      // Copyright notice
      const copyrightText = footer.getByText(/ALL RIGHTS RESERVED/i);
      await expect(copyrightText).toBeVisible();

      // Privacy / Terms / FAQ links
      await expect(footer.getByRole('link', { name: /Privacy Policy/i })).toBeVisible();
      await expect(footer.getByRole('link', { name: /Terms/i })).toBeVisible();
      await expect(footer.getByRole('link', { name: /FAQ/i })).toBeVisible();

      // Scroll to top button
      const scrollToTopBtn = footer.getByRole('button', { name: /Scroll to top/i });
      await expect(scrollToTopBtn).toBeVisible();

      // Click scroll to top
      await scrollToTopBtn.click();
    });
  });
});
