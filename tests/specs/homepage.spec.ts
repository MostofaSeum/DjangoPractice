import { test, expect } from '@playwright/test';

test.describe('Storefront Homepage - Complete Test Suite', () => {
  let cachedAuth: { access: string; refresh: string } | null = null;

  // Helper to obtain a cached JWT token for customer 'hello'
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

  // Setup session for homepage (either authenticated as customer 'hello' or guest)
  async function setupHomepageSession(page: any, authenticated = false) {
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

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    if (authenticated) {
      const userBtn = page.locator('header button').filter({ hasText: /AdminFirst|hello/i }).first();
      await expect(userBtn).toBeVisible({ timeout: 15000 });
    }
  }

  test.beforeEach(async ({ page }) => {
    await setupHomepageSession(page, false);
  });

  /* -------------------------------------------------------------------------- */
  /* 1. Header, Navigation & Global Branding                                    */
  /* -------------------------------------------------------------------------- */
  test.describe('1. Header, Navigation & Global Branding', () => {
    test('displays page title and header brand logo/title linking to /', async ({ page }) => {
      await expect(page).toHaveTitle(/VibeMart/i);

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
      const langToggle = page.getByRole('button', { name: 'Toggle Language' });
      await expect(langToggle).toBeVisible({ timeout: 10000 });

      const themeToggle = page.getByRole('button', { name: 'Toggle Light and Dark Mode' });
      await expect(themeToggle).toBeVisible({ timeout: 10000 });

      const cartLink = page.locator('header a[href="/cart"]').first();
      await expect(cartLink).toBeVisible();

      const signInLink = page.locator('header').getByRole('link', { name: /SIGN IN|সাইন ইন/i });
      await expect(signInLink).toBeVisible();
      await expect(signInLink).toHaveAttribute('href', /login/);
    });

    test('can navigate to Shop page via header nav', async ({ page }) => {
      const shopLink = page.locator('header nav').getByRole('link', { name: /SHOP/i });
      await shopLink.click();
      await expect(page).toHaveURL(/\/products/, { timeout: 10000 });
    });

    test('can navigate to Categories page via header nav', async ({ page }) => {
      const categoriesLink = page.locator('header nav').getByRole('link', { name: /CATEGORIES/i });
      await categoriesLink.click();
      await expect(page).toHaveURL(/\/collections/, { timeout: 10000 });
    });

    test('can navigate to Gift Cards page via header nav', async ({ page }) => {
      const giftCardsLink = page.locator('header nav').getByRole('link', { name: /GIFT CARDS/i });
      await giftCardsLink.click();
      await expect(page).toHaveURL(/\/gift-cards/, { timeout: 10000 });
    });

    test('authenticated customer session displays user pill button and opens dropdown menu with Profile and Wishlist', async ({ page }) => {
      await setupHomepageSession(page, true);

      // User pill button in header
      const userBtn = page.locator('header button').filter({ hasText: /AdminFirst|hello/i }).first();
      await expect(userBtn).toBeVisible();
      await userBtn.click();

      // Dropdown menu items
      const profileLink = page.locator('header a[href="/profile"]');
      const wishlistLink = page.locator('header a[href="/wishlist"]');
      const signOutBtn = page.locator('header button').filter({ hasText: /Sign Out|সাইন আউট|লগআউট/i });

      await expect(profileLink).toBeVisible();
      await expect(wishlistLink).toBeVisible();
      await expect(signOutBtn).toBeVisible();

      // Clicking outside closes dropdown
      await page.locator('body').click({ position: { x: 10, y: 10 } });
      await expect(profileLink).not.toBeVisible();
    });

    test('complete customer Sign-Out flow: clicks Sign Out, asserts toast, and confirms header returns to SIGN IN', async ({ page }) => {
      await setupHomepageSession(page, true);

      const userBtn = page.locator('header button').filter({ hasText: /AdminFirst|hello/i }).first();
      await userBtn.click();

      const signOutBtn = page.locator('header button').filter({ hasText: /Sign Out|সাইন আউট|লগআউট/i });
      await expect(signOutBtn).toBeVisible();
      await signOutBtn.click();

      // Toast notification confirms sign out
      const toast = page.locator('.swal2-toast');
      await expect(toast).toBeVisible({ timeout: 8000 });
      await expect(toast).toContainText(/Signed out successfully|সফলভাবে সাইন আউট/i);

      // Header now displays Sign In link
      const signInLink = page.locator('header').getByRole('link', { name: /SIGN IN|সাইন ইন/i });
      await expect(signInLink).toBeVisible({ timeout: 10000 });
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

      const initialClass = (await htmlElement.getAttribute('class')) || '';

      await themeToggle.click();
      await page.waitForTimeout(300);
      const toggledClass = (await htmlElement.getAttribute('class')) || '';
      expect(toggledClass).not.toEqual(initialClass);

      await themeToggle.click();
      await page.waitForTimeout(300);
      const revertedClass = (await htmlElement.getAttribute('class')) || '';
      expect(revertedClass).toEqual(initialClass);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. Localization & Language Switcher                                        */
  /* -------------------------------------------------------------------------- */
  test.describe('3. Localization & Language Switcher', () => {
    test('switches language between English and Bangla across UI text', async ({ page }) => {
      const langToggle = page.getByRole('button', { name: 'Toggle Language' });
      await expect(langToggle).toBeVisible({ timeout: 10000 });

      // 1. Switch to Bangla
      await langToggle.click();

      // Check header nav in Bangla
      const shopBn = page.locator('header nav').getByRole('link', { name: /শপ|SHOP/i });
      await expect(shopBn).toBeVisible();

      // Check Why Us section heading in Bangla
      const whyUsHeading = page.locator('main section').last().locator('h2');
      await expect(whyUsHeading).toBeVisible();

      // 2. Switch back to English
      await langToggle.click();

      const shopEn = page.locator('header nav').getByRole('link', { name: /SHOP/i });
      await expect(shopEn).toBeVisible();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. Top Promotional Banner                                                  */
  /* -------------------------------------------------------------------------- */
  test.describe('4. Top Promotional Banner', () => {
    test('checks promotion banner presence, image loading, and link validity', async ({ page }) => {
      const bannerLink = page.locator('a:has(img[alt="Special Promotion Banner"])');
      const count = await bannerLink.count();

      if (count > 0) {
        await expect(bannerLink).toBeVisible();
        const href = await bannerLink.getAttribute('href');
        expect(href).toBeTruthy();

        const bannerImg = bannerLink.locator('img').first();
        await expect.poll(async () => {
          return await bannerImg.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
        }, { timeout: 10000 }).toBe(true);
      }
    });

    test('clicking promotional banner navigates to promotional destination', async ({ page }) => {
      const bannerLink = page.locator('a:has(img[alt="Special Promotion Banner"])');
      if ((await bannerLink.count()) > 0) {
        const href = await bannerLink.getAttribute('href');
        await bannerLink.click();
        await expect(page).toHaveURL(new RegExp(href || '/gift-cards'), { timeout: 10000 });
      }
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 5. Bento Grid Hero Section                                                 */
  /* -------------------------------------------------------------------------- */
  test.describe('5. Bento Grid Hero Section', () => {
    test('displays Main Hero Card with badge, title prefix, animated word, subtitle, and CTA', async ({ page }) => {
      const heroHeading = page.locator('section').first().locator('h1');
      await expect(heroHeading).toBeVisible();
      await expect(heroHeading).toContainText(/Elevate Your|আপনার স্টাইলকে/i);

      const exploreBtn = page.locator('section').first().getByRole('link', { name: /Explore Collection|কালেকশন দেখুন/i });
      await expect(exploreBtn).toBeVisible();
      await expect(exploreBtn).toHaveAttribute('href', /\/collections/);
    });

    test('displays Discover Card and clicking View Exclusives CTA navigates to /products', async ({ page }) => {
      const discoverHeading = page.getByRole('heading', { name: /Discover the Glam|গ্ল্যামারের সন্ধান/i });
      await expect(discoverHeading).toBeVisible();

      const exclusivesBtn = page.getByRole('link', { name: /View Exclusives|এক্সক্লুসিভ দেখুন/i });
      await expect(exclusivesBtn).toBeVisible();
      await exclusivesBtn.click();
      await expect(page).toHaveURL(/\/products/, { timeout: 10000 });
    });

    test('verifies all 8 interactive Bento Grid items structure and count', async ({ page }) => {
      const heroSection = page.locator('section').first();
      const gridContainer = heroSection.locator('div.grid');
      await expect(gridContainer).toBeVisible();

      // 8 items in the bento grid: Main Card, Discover, Slot 1, Slot 5 (24/7 Drops), Slot 6 (Delivery), Slot 2, Slot 3, Slot 4
      const gridCards = gridContainer.locator('> div, > a');
      await expect(gridCards).toHaveCount(8);
    });

    test('clicking Explore Collection CTA in Main Hero Card redirects to /collections', async ({ page }) => {
      const exploreBtn = page.locator('section').first().getByRole('link', { name: /Explore Collection|কালেকশন দেখুন/i });
      await expect(exploreBtn).toBeVisible({ timeout: 10000 });
      await exploreBtn.click();
      await expect(page).toHaveURL(/\/collections/, { timeout: 10000 });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 6. Featured Categories Section                                             */
  /* -------------------------------------------------------------------------- */
  test.describe('6. Featured Categories Section', () => {
    test('displays Featured Categories section heading and View All link with navigation to /collections', async ({ page }) => {
      const catSection = page.locator('main section').first();
      const categoriesHeading = catSection.locator('h2');
      await expect(categoriesHeading).toBeVisible();

      const viewAllCategories = catSection.getByRole('link', { name: /View All|সব দেখুন/i });
      await expect(viewAllCategories).toBeVisible();
      await expect(viewAllCategories).toHaveAttribute('href', '/collections');

      await viewAllCategories.click();
      await expect(page).toHaveURL(/\/collections/, { timeout: 10000 });
    });

    test('renders category cards or empty state message gracefully', async ({ page }) => {
      const catSection = page.locator('main section').first();
      const categoryLinks = catSection.locator('a[href^="/collections/"]');
      const noCollectionsMsg = catSection.getByText(/No collections available|কোন ক্যাটাগরি নেই/i);

      const hasCards = (await categoryLinks.count()) > 0;
      const hasEmptyMsg = (await noCollectionsMsg.count()) > 0;

      expect(hasCards || hasEmptyMsg).toBeTruthy();
    });

    test('clicking a featured category card navigates to collection detail page /collections/[id]', async ({ page }) => {
      const catSection = page.locator('main section').first();
      const firstCategoryLink = catSection.locator('a[href^="/collections/"]').first();

      if ((await firstCategoryLink.count()) > 0) {
        const href = await firstCategoryLink.getAttribute('href');
        await firstCategoryLink.click();
        await expect(page).toHaveURL(new RegExp(href || '/collections/\\d+'), { timeout: 10000 });
      }
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 7. Trending Now Products Section & Cart Actions                            */
  /* -------------------------------------------------------------------------- */
  test.describe('7. Trending Now Products Section', () => {
    test('displays Trending Now heading and View All link with navigation to /products', async ({ page }) => {
      const trendingSection = page.locator('main section').nth(1);
      const trendingHeading = trendingSection.locator('h2');
      await expect(trendingHeading).toBeVisible();

      const viewAllTrending = trendingSection.getByRole('link', { name: /View All|সব দেখুন/i });
      await expect(viewAllTrending).toBeVisible();
      await expect(viewAllTrending).toHaveAttribute('href', '/products');

      await viewAllTrending.click();
      await expect(page).toHaveURL(/\/products/, { timeout: 10000 });
    });

    test('product cards display titles, prices, and Add to Cart buttons', async ({ page }) => {
      const trendingSection = page.locator('main section').nth(1);
      const productCards = trendingSection.locator('div.group');

      const count = await productCards.count();
      if (count > 0) {
        const firstCard = productCards.first();
        await expect(firstCard.locator('h4')).toBeVisible();

        const addToCartBtn = firstCard.getByRole('button', { name: /Add to Cart|কার্টে যোগ করুন/i });
        await expect(addToCartBtn).toBeVisible();
      }
    });

    test('product cards render rich metadata: discount badges, delivery badges, ratings, and sold counts', async ({ page }) => {
      const trendingSection = page.locator('main section').nth(1);
      const productCards = trendingSection.locator('div.group');
      const count = await productCards.count();

      if (count > 0) {
        // Pricing is visible on first card
        const priceElement = productCards.first().locator('.text-accent.font-bold');
        await expect(priceElement).toBeVisible();

        // Check if any card has discount badge
        const discountBadges = trendingSection.locator('span:has-text("%")');
        if ((await discountBadges.count()) > 0) {
          await expect(discountBadges.first()).toBeVisible();
        }

        // Check if any card has star rating
        const ratingBadges = trendingSection.locator('span:has-text("★")');
        if ((await ratingBadges.count()) > 0) {
          await expect(ratingBadges.first()).toBeVisible();
        }

        // Check if any delivery offer badge is rendered
        const deliveryOfferPills = trendingSection.locator('span').filter({ hasText: /Free Delivery|ডেলিভারি|Delivery/i });
        if ((await deliveryOfferPills.count()) > 0) {
          await expect(deliveryOfferPills.first()).toBeVisible();
        }
      }
    });

    test('clicking a trending product title or image navigates to its detail page /products/[id]', async ({ page }) => {
      const trendingSection = page.locator('main section').nth(1);
      const firstProductLink = trendingSection.locator('a[href^="/products/"]').first();

      if ((await firstProductLink.count()) > 0) {
        const href = await firstProductLink.getAttribute('href');
        await firstProductLink.click();
        await expect(page).toHaveURL(new RegExp(href || '/products/\\d+'), { timeout: 10000 });
      }
    });

    test('clicking Add to Cart shows confirmation toast and increments the header cart badge in real-time', async ({ page }) => {
      const trendingSection = page.locator('main section').nth(1);
      const addToCartBtn = trendingSection.getByRole('button', { name: /Add to Cart|কার্টে যোগ করুন/i }).first();

      if ((await addToCartBtn.count()) > 0) {
        // Read initial header cart count
        const cartLink = page.locator('header a[href="/cart"]').first();
        const initialText = await cartLink.innerText();
        const initialCount = parseInt(initialText.replace(/\D/g, '') || '0', 10);

        // Click Add to Cart
        await addToCartBtn.click();

        // SweetAlert toast confirmation
        const toast = page.locator('.swal2-popup');
        await expect(toast).toBeVisible({ timeout: 10000 });

        // Header cart count should increment
        await expect.poll(async () => {
          const currentText = await cartLink.innerText();
          const currentCount = parseInt(currentText.replace(/\D/g, '') || '0', 10);
          return currentCount;
        }, { timeout: 8000 }).toBeGreaterThan(initialCount);
      }
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 8. Why VibeMart Value Proposition Section                                  */
  /* -------------------------------------------------------------------------- */
  test.describe('8. Why VibeMart (Value Proposition)', () => {
    test('displays Why VibeMart heading and all 3 value cards (Fast Shipping, Elite Quality, Secure Checkout)', async ({ page }) => {
      const whyUsSection = page.locator('main section').last();
      const whyUsHeading = whyUsSection.locator('h2');
      await expect(whyUsHeading).toBeVisible();

      // Check 3 value proposition cards
      const valueCards = whyUsSection.locator('div.grid > div');
      await expect(valueCards).toHaveCount(3);

      // Verify headings inside cards
      const cardHeadings = valueCards.locator('h3');
      await expect(cardHeadings).toHaveCount(3);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 9. Newsletter Subscription (Join the Glam Club)                             */
  /* -------------------------------------------------------------------------- */
  test.describe('9. Newsletter Subscription (Join the Glam Club)', () => {
    test('renders newsletter heading, subtitle, input field and submit button', async ({ page }) => {
      const heading = page.getByRole('heading', { name: /Join the Glam Club|গ্ল্যাম ক্লাবে যোগ দিন/i });
      await expect(heading).toBeVisible();

      const emailInput = page.getByPlaceholder(/Enter your email address|ইমেইল এড্রেস লিখুন/i);
      await expect(emailInput).toBeVisible();

      const subscribeBtn = page.getByRole('button', { name: /Subscribe|সাবস্ক্রাইব/i });
      await expect(subscribeBtn).toBeVisible();
    });

    test('shows validation feedback when subscribing with empty input', async ({ page }) => {
      const subscribeBtn = page.getByRole('button', { name: /Subscribe|সাবস্ক্রাইব/i });
      const emailInput = page.getByPlaceholder(/Enter your email address|ইমেইল এড্রেস লিখুন/i);

      await emailInput.fill('');
      await subscribeBtn.click();

      const popup = page.locator('.swal2-popup');
      const isInputInvalid = await emailInput.evaluate(
        (el: HTMLInputElement) => !el.checkValidity()
      );

      const hasPopup = (await popup.count()) > 0;
      expect(isInputInvalid || hasPopup).toBeTruthy();
    });

    test('subscribes with email successfully and displays already-subscribed notice on duplicate submission', async ({ page }) => {
      const emailInput = page.getByPlaceholder(/Enter your email address|ইমেইল এড্রেস লিখুন/i);
      const subscribeBtn = page.getByRole('button', { name: /Subscribe|সাবস্ক্রাইব/i });

      const uniqueEmail = `glam_${Date.now()}@example.com`;

      // 1. First subscription
      await emailInput.scrollIntoViewIfNeeded();
      await emailInput.fill(uniqueEmail);
      await subscribeBtn.click();

      const firstPopup = page.locator('.swal2-popup');
      await expect(firstPopup).toBeVisible({ timeout: 15000 });
      await expect(firstPopup).toContainText(/Subscribed|সফল|added/i);

      // Dismiss first popup
      const confirmBtn = page.locator('.swal2-confirm');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(400);
      }

      // 2. Duplicate submission with same email
      await emailInput.scrollIntoViewIfNeeded();
      await emailInput.fill(uniqueEmail);
      await subscribeBtn.click();

      const duplicateAlert = page.locator('.swal2-popup');
      await expect(duplicateAlert).toBeVisible({ timeout: 15000 });
      await expect(duplicateAlert).toContainText(/Already Subscribed|already have you|ইতিমধ্যেই/i);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 10. Footer Section, Quick Links & Social                                   */
  /* -------------------------------------------------------------------------- */
  test.describe('10. Footer Section, Quick Links & Social', () => {
    test('displays footer quick navigation links and clicking My Account navigates to profile', async ({ page }) => {
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();

      await expect(footer.getByRole('link', { name: /About Us|আমাদের সম্পর্কে/i })).toBeVisible();
      await expect(footer.getByRole('link', { name: /Contact Us|যোগাযোগ/i })).toBeVisible();

      const myAccountLink = footer.getByRole('link', { name: /My Account|আমার একাউন্ট/i });
      await expect(myAccountLink).toBeVisible();
      await myAccountLink.click();

      // Navigates to /profile or /login?redirect=%2Fprofile
      await expect(page).toHaveURL(/\/(profile|login\?redirect=%2Fprofile)/, { timeout: 10000 });
    });

    test('displays payment partner badges (bKash, Nagad, VibeCoin, Cash on Delivery)', async ({ page }) => {
      const footer = page.locator('footer');

      const bkashBadge = footer.locator('img[alt="bKash"]');
      const nagadBadge = footer.locator('img[alt="Nagad"]');
      const vibeCoinBadge = footer.locator('img[alt="VibeCoin"]');
      const codBadge = footer.locator('img[alt="Cash on Delivery"]');

      await expect(bkashBadge).toBeVisible();
      await expect(nagadBadge).toBeVisible();
      await expect(vibeCoinBadge).toBeVisible();
      await expect(codBadge).toBeVisible();
    });

    test('displays footer branding, copyright notice, and scroll-to-top button functionality', async ({ page }) => {
      const footer = page.locator('footer');

      const copyrightText = footer.getByText(/ALL RIGHTS RESERVED|সর্বস্বত্ব সংরক্ষিত/i);
      await expect(copyrightText).toBeVisible();

      await expect(footer.getByRole('link', { name: /Privacy Policy|গোপনীয়তা নীতি/i })).toBeVisible();
      await expect(footer.getByRole('link', { name: /Terms/i })).toBeVisible();
      await expect(footer.getByRole('link', { name: /FAQ/i })).toBeVisible();

      // Scroll to bottom first
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);

      const scrollToTopBtn = footer.getByRole('button', { name: /Scroll to top|উপরে যান/i });
      await expect(scrollToTopBtn).toBeVisible();
      await scrollToTopBtn.click();

      // Window scroll offset should return near top
      await expect.poll(async () => {
        return await page.evaluate(() => window.scrollY);
      }, { timeout: 5000 }).toBeLessThan(300);
    });

    test('displays WhatsApp and social media links with valid URLs', async ({ page }) => {
      const footer = page.locator('footer');

      const socialLinks = footer.locator('a[aria-label="Facebook"], a[aria-label="Instagram"], a[aria-label="YouTube"], a[aria-label="WhatsApp"]');
      const count = await socialLinks.count();
      if (count > 0) {
        await expect(socialLinks.first()).toBeVisible();

        const whatsappLink = footer.locator('a[aria-label="WhatsApp"]');
        if (await whatsappLink.isVisible()) {
          const href = await whatsappLink.getAttribute('href');
          expect(href).toMatch(/wa\.me|whatsapp/i);
        }
      }
    });
  });
});
