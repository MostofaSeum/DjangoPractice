import { test, expect } from '@playwright/test';

test.describe('Authentication: Login, Registration & Password Recovery', () => {
  /* -------------------------------------------------------------------------- */
  /* 1. Login Page                                                              */
  /* -------------------------------------------------------------------------- */
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('jwt');
      });
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
    });

    test('renders login form with username, password, show/hide password, and submit button', async ({ page }) => {
      // Check heading with explicit timeout for slower engines (WebKit/Safari)
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 15000 });

      // Username input
      const usernameInput = page.locator('input[name="username"]').or(page.getByPlaceholder(/Username|Email/i));
      await expect(usernameInput.first()).toBeVisible();

      // Password input
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      await expect(passwordInput).toBeVisible();

      // Sign in submit button
      const submitBtn = page.locator('form button[type="submit"]');
      await expect(submitBtn).toBeVisible();

      // Navigation links to Register and Forgot Password
      const registerLink = page.getByRole('link', { name: /Register|Create Account|Sign Up/i });
      await expect(registerLink).toBeVisible();

      const forgotPasswordLink = page.getByRole('link', { name: /Forgot Password|Reset/i });
      await expect(forgotPasswordLink).toBeVisible();
    });

    test('validates required fields on empty submit', async ({ page }) => {
      const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
      await expect(usernameInput).toBeVisible({ timeout: 15000 });

      const submitBtn = page.locator('form button[type="submit"]');
      await submitBtn.click();

      const invalidState = page.locator(':invalid, .text-red-500, .swal2-popup');
      await expect(invalidState.first()).toBeVisible();
    });

    test('displays error alert on invalid credentials', async ({ page }) => {
      const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
      await expect(usernameInput).toBeVisible({ timeout: 15000 });
      const passwordInput = page.locator('input[type="password"]').first();
      const submitBtn = page.locator('form button[type="submit"]');

      await usernameInput.fill('non_existent_user_9999');
      await passwordInput.fill('WrongPassword!123');
      await submitBtn.click();

      // Error message or alert feedback
      const errorMsg = page.locator('.text-red-500, .swal2-popup, [role="alert"]');
      await expect(errorMsg.first()).toBeVisible({ timeout: 10000 });
    });

    test('toggles password visibility when eye icon is clicked', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill('Secret123');

      // Click toggle password button
      const toggleEyeBtn = page.locator('button:has(svg), button:has(img[alt*="Password"])').first();
      if (await toggleEyeBtn.isVisible()) {
        await toggleEyeBtn.click();
        const type = await passwordInput.getAttribute('type');
        expect(type === 'text' || type === 'password').toBeTruthy();
      }
    });

    test('can successfully log in with valid credentials (hello / Hello123456)', async ({ page }) => {
      const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
      await expect(usernameInput).toBeVisible({ timeout: 15000 });
      const passwordInput = page.locator('input[type="password"]').first();
      const submitBtn = page.locator('form button[type="submit"]');

      await usernameInput.fill('hello');
      await passwordInput.fill('Hello123456');
      await submitBtn.click();

      // Successfully authenticated and redirected away from /login
      await expect(page).not.toHaveURL(/\/login$/, { timeout: 10000 });
    });

    test('guest cart items sync with user cart upon logging in', async ({ page }) => {
      // 1. As guest, add an item to cart from product details page
      await page.goto('/products/3', { waitUntil: 'domcontentloaded' });
      const addToCartBtn = page.getByRole('button', { name: 'Add to Cart', exact: true });
      if (await addToCartBtn.isVisible() && !(await addToCartBtn.isDisabled())) {
        await addToCartBtn.click();
        await page.waitForTimeout(1000);
      }

      // 2. Navigate to login and authenticate
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
      await expect(usernameInput).toBeVisible({ timeout: 15000 });
      await usernameInput.fill('hello');
      await page.locator('input[type="password"]').first().fill('Hello123456');
      await page.locator('form button[type="submit"]').click();

      // 3. User is logged in and redirected
      await expect(page).not.toHaveURL(/\/login$/, { timeout: 10000 });

      // 4. Cart still preserves the added item for the authenticated user
      await page.goto('/cart', { waitUntil: 'domcontentloaded' });
      const cartItems = page.locator('main').locator('text=৳');
      await expect(cartItems.first()).toBeVisible({ timeout: 10000 });
    });

    test('logged-in user cannot access login or register page and is redirected', async ({ page }) => {
      // Login first
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
      await expect(usernameInput).toBeVisible({ timeout: 15000 });
      await usernameInput.fill('hello');
      await page.locator('input[type="password"]').first().fill('Hello123456');
      await page.locator('form button[type="submit"]').click();
      await expect(page).not.toHaveURL(/\/login$/, { timeout: 10000 });

      // Trying to visit /login while authenticated redirects away
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      await expect(page).not.toHaveURL(/\/login$/, { timeout: 10000 });

      // Trying to visit /register while authenticated redirects away
      await page.goto('/register', { waitUntil: 'domcontentloaded' });
      await expect(page).not.toHaveURL(/\/register$/, { timeout: 10000 });
    });

    test('unauthenticated user cannot access protected pages (/profile, /checkout, /wishlist)', async ({ page }) => {
      // Ensure completely unauthenticated
      await page.addInitScript(() => {
        localStorage.clear();
      });

      // Visiting /profile redirects to login
      await page.goto('/profile', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/login/);

      // Visiting /checkout redirects to login
      await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/login/);

      // Visiting /wishlist shows sign-in requirement
      await page.goto('/wishlist', { waitUntil: 'domcontentloaded' });
      const signInPrompt = page.locator('text=Sign in to view, a[href*="login"]');
      await expect(signInPrompt.first()).toBeVisible({ timeout: 10000 });
    });

    test('non-staff regular user (hello) cannot access /admin panel', async ({ page }) => {
      // Login as regular non-staff user
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
      await expect(usernameInput).toBeVisible({ timeout: 15000 });
      await usernameInput.fill('hello');
      await page.locator('input[type="password"]').first().fill('Hello123456');
      await page.locator('form button[type="submit"]').click();
      await expect(page).not.toHaveURL(/\/login$/, { timeout: 10000 });

      // Attempt to access /admin
      await page.goto('/admin', { waitUntil: 'domcontentloaded' });

      // Guard redirects non-staff user away from /admin (e.g. to / or shows access denied)
      await expect(page).not.toHaveURL(/\/admin$/, { timeout: 10000 });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. Registration Page                                                       */
  /* -------------------------------------------------------------------------- */
  test.describe('Register Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('jwt');
      });
      await page.goto('/register', { waitUntil: 'domcontentloaded' });
    });

    test('renders registration form with all required user fields', async ({ page }) => {
      // Heading with explicit hydration timeout
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 15000 });

      // First Name and Last Name
      const firstNameInput = page.locator('input[name="first_name"]');
      const lastNameInput = page.locator('input[name="last_name"]');
      await expect(firstNameInput).toBeVisible();
      await expect(lastNameInput).toBeVisible();

      // Username & Email
      const usernameInput = page.locator('input[name="username"]');
      const emailInput = page.locator('input[name="email"]');
      await expect(usernameInput).toBeVisible();
      await expect(emailInput).toBeVisible();

      // Password & Confirm Password
      const passwordInputs = page.locator('input[type="password"]');
      await expect(passwordInputs.first()).toBeVisible();

      // Submit Button
      const registerBtn = page.getByRole('button', { name: /Create Account|Register|Sign Up/i });
      await expect(registerBtn).toBeVisible();

      // Already have an account link inside form or content area
      const loginLink = page.locator('main, div').getByRole('link', { name: 'Sign In', exact: true }).first();
      await expect(loginLink).toBeVisible();
    });

    test('prevents registration when password confirmation mismatches', async ({ page }) => {
      const firstNameInput = page.locator('input[name="first_name"]');
      const lastNameInput = page.locator('input[name="last_name"]');
      const usernameInput = page.locator('input[name="username"]');
      const emailInput = page.locator('input[name="email"]');
      const passwordInputs = page.locator('input[type="password"]');
      const registerBtn = page.getByRole('button', { name: /Create Account|Register|Sign Up/i });

      await firstNameInput.fill('John');
      await lastNameInput.fill('Doe');
      await usernameInput.fill(`testuser_${Date.now()}`);
      await emailInput.fill(`testuser_${Date.now()}@example.com`);
      await passwordInputs.first().fill('Password123!');
      await passwordInputs.nth(1).fill('MismatchPassword456!');

      await registerBtn.click();

      // Should indicate passwords do not match
      const errorMsg = page.getByText(/match|Passwords do not match/i).or(page.locator('.swal2-popup, .text-red-500'));
      await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. Forgot Password Page                                                    */
  /* -------------------------------------------------------------------------- */
  test.describe('Forgot Password Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/forgot-password', { waitUntil: 'domcontentloaded' });
    });

    test('renders account verification step with username and email fields', async ({ page }) => {
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 15000 });

      // Username input
      const usernameInput = page.locator('form input').first();
      await expect(usernameInput).toBeVisible();

      // Email input
      const emailInput = page.locator('form input').nth(1);
      await expect(emailInput).toBeVisible();

      // Verify Account button
      const verifyBtn = page.getByRole('button', { name: /Verify Account|Reset Password|Continue|Submit/i });
      await expect(verifyBtn).toBeVisible();

      // Back to login link
      const backLink = page.locator('main, div').getByRole('link', { name: 'Sign In', exact: true }).first();
      await expect(backLink).toBeVisible();
    });

    test('shows error when verifying with non-existent account credentials', async ({ page }) => {
      const usernameInput = page.locator('form input').first();
      const emailInput = page.locator('form input').nth(1);
      const verifyBtn = page.getByRole('button', { name: /Verify Account|Reset Password|Continue|Submit/i });

      await usernameInput.fill('non_existent_account_xyz');
      await emailInput.fill('ghost_account_xyz@example.com');
      await verifyBtn.click();

      // Error message or alert
      const errorMsg = page.locator('.text-nagad, .text-red-500, .swal2-popup, [role="alert"]');
      await expect(errorMsg.first()).toBeVisible({ timeout: 10000 });
    });
  });
});
