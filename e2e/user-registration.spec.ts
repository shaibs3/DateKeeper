import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the landing page before each test
    await page.goto('/');
  });

  test('displays sign-in page correctly', async ({ page }) => {
    await page.click('a[href="/auth/signin"]');

    await expect(page).toHaveURL('/auth/signin');
    await expect(page.locator('h2')).toContainText('Sign in to BirthdayBuddy');
    await expect(page.locator('button', { hasText: 'Sign in with Google' })).toBeVisible();
  });

  test('displays sign-up page correctly', async ({ page }) => {
    await page.click('a[href="/auth/signup"]');

    await expect(page).toHaveURL('/auth/signup');
    await expect(page.locator('h2')).toContainText('Create your account');
    await expect(page.locator('button', { hasText: 'Sign up with Google' })).toBeVisible();
  });

  test('sign-in button initiates OAuth with correct parameters', async ({ page }) => {
    await page.goto('/auth/signin');

    // Mock the OAuth request to check parameters
    let oauthRequestUrl = '';
    await page.route('**/api/auth/signin/google**', async route => {
      oauthRequestUrl = route.request().url();
      // Prevent actual OAuth redirect
      await route.fulfill({
        status: 200,
        body: 'OAuth intercepted for testing',
      });
    });

    await page.click('button:has-text("Sign in with Google")');

    // Check that OAuth request doesn't include signup parameter in callback
    expect(oauthRequestUrl).not.toContain('signup%3Dtrue');
    expect(oauthRequestUrl).not.toContain('signup=true');
  });

  test('sign-up button initiates OAuth with signup parameter', async ({ page }) => {
    await page.goto('/auth/signup');

    // Mock the OAuth request to check parameters
    let oauthRequestUrl = '';
    let requestsCaptured = 0;

    await page.route('**/api/auth/**', async route => {
      const url = route.request().url();
      console.log('Captured request:', url);
      requestsCaptured++;

      if (url.includes('/signin/google')) {
        oauthRequestUrl = url;
        console.log('OAuth URL captured:', oauthRequestUrl);
      }

      // Prevent actual OAuth redirect
      await route.fulfill({
        status: 200,
        body: 'OAuth intercepted for testing',
      });
    });

    console.log('Clicking sign up button...');
    await page.click('button:has-text("Sign up with Google")');

    // Wait a bit for async operations
    await page.waitForTimeout(1000);

    console.log('Requests captured:', requestsCaptured);
    console.log('Final OAuth URL:', oauthRequestUrl);

    // Check that OAuth request includes signup parameter in callback URL
    // The parameter should be in the callbackUrl parameter: callbackUrl=/home?signup=true
    expect(oauthRequestUrl).not.toBe('');
    expect(oauthRequestUrl).toContain('callbackUrl');
    expect(oauthRequestUrl).toContain('signup%3Dtrue');
  });

  test('error page displays correctly for user not registered', async ({ page }) => {
    await page.goto('/auth/error?error=UserNotRegistered');

    await expect(page.locator('h2')).toContainText('Account Not Found');
    await expect(page.locator('text=No account found with this email address')).toBeVisible();
    await expect(page.locator('a:has-text("Sign Up")')).toBeVisible();
    await expect(page.locator('a:has-text("Back to Sign In")')).toBeVisible();
  });

  test('error page displays correctly for user already exists', async ({ page }) => {
    await page.goto('/auth/error?error=UserAlreadyExists');

    await expect(page.locator('h2')).toContainText('Account Already Exists');
    await expect(page.locator('text=An account with this email already exists')).toBeVisible();
    await expect(page.locator('a:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('a:has-text("Back to Sign Up")')).toBeVisible();
  });

  test('error page navigation works correctly', async ({ page }) => {
    // Test navigation from UserNotRegistered error
    await page.goto('/auth/error?error=UserNotRegistered');
    await page.click('a:has-text("Sign Up")');
    await expect(page).toHaveURL('/auth/signup');

    // Test navigation from UserAlreadyExists error
    await page.goto('/auth/error?error=UserAlreadyExists');
    await page.click('a:has-text("Sign In")');
    await expect(page).toHaveURL('/auth/signin');
  });

  test('navigation between sign-in and sign-up works', async ({ page }) => {
    // Start at sign-up page
    await page.goto('/auth/signup');
    await expect(page.locator('h2')).toContainText('Create your account');

    // Navigate to sign-in via link
    await page.click('a[href="/auth/signin"]');
    await expect(page).toHaveURL('/auth/signin');
    await expect(page.locator('h2')).toContainText('Sign in to BirthdayBuddy');
  });
});
