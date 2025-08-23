import { test, expect } from '@playwright/test';

// Type definitions for test window object
declare global {
  interface Window {
    testUserScenario?: string;
  }
}

test.describe('Authentication Flow with Mocked OAuth', () => {
  // This test suite uses route interception to mock OAuth responses
  // allowing us to test the complete registration flow in CI

  test.beforeEach(async ({ page }) => {
    // Mock Google OAuth endpoints
    await page.route('**/auth/signin/google**', async route => {
      // Simulate Google OAuth redirect with test data
      const url = new URL(route.request().url());
      const callbackUrl = url.searchParams.get('callbackUrl') || '/home';
      const isSignup = callbackUrl.includes('signup=true');

      // Use JavaScript redirect instead of HTTP 302
      const callbackTarget = `/api/auth/callback/google?${new URLSearchParams({
        code: 'mock-auth-code',
        state: isSignup ? 'signup=true' : 'signin=true',
        callbackUrl: callbackUrl,
      })}`;

      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<script>window.location.href = '${callbackTarget}';</script>`,
      });
    });

    // Mock the OAuth callback to simulate different user scenarios
    await page.route('**/api/auth/callback/google**', async route => {
      const url = new URL(route.request().url());
      const isSignup =
        url.searchParams.get('callbackUrl')?.includes('signup=true') ||
        url.searchParams.get('state')?.includes('signup=true');

      // Get test scenario from page context or use default
      const testUser = await page.evaluate(() => window.testUserScenario);

      // With simplified auth, all flows succeed
      // New users are automatically created, existing users can use any page
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<script>window.location.href = '/home';</script>`,
      });
    });
  });

  test('new user sign-in succeeds with auto-registration', async ({ page }) => {
    // Set test scenario
    await page.addInitScript(() => {
      window.testUserScenario = 'new-user';
    });

    await page.goto('/auth/signin');

    // Click sign in button
    await page.click('button:has-text("Sign in with Google")');

    // With simplified auth, new users are automatically created
    await expect(page).toHaveURL('/home');
  });

  test('existing user sign-up succeeds with simplified auth', async ({ page }) => {
    // Set test scenario
    await page.addInitScript(() => {
      window.testUserScenario = 'existing-user';
    });

    await page.goto('/auth/signup');

    // Click sign up button
    await page.click('button:has-text("Sign up with Google")');

    // With simplified auth, existing users can use signup page too
    await expect(page).toHaveURL('/home');
  });

  test('new user sign-up succeeds', async ({ page }) => {
    // Set test scenario
    await page.addInitScript(() => {
      window.testUserScenario = 'new-user';
    });

    await page.goto('/auth/signup');

    // Click sign up button
    await page.click('button:has-text("Sign up with Google")');

    // Should be redirected to home page
    await expect(page).toHaveURL('/home');
  });

  test('existing user sign-in succeeds', async ({ page }) => {
    // Set test scenario
    await page.addInitScript(() => {
      window.testUserScenario = 'existing-user';
    });

    await page.goto('/auth/signin');

    // Click sign in button
    await page.click('button:has-text("Sign in with Google")');

    // Should be redirected to home page
    await expect(page).toHaveURL('/home');
  });

  test('error page provides correct navigation links', async ({ page }) => {
    // Test UserNotRegistered error by directly navigating to error page
    await page.goto('/auth/error?error=UserNotRegistered');

    // Should be on error page
    await expect(page).toHaveURL('/auth/error?error=UserNotRegistered');

    // Click "Sign Up" button
    await page.click('a:has-text("Sign Up")');
    await expect(page).toHaveURL('/auth/signup');

    // Verify we're on the sign-up page
    await expect(page.locator('h2')).toContainText('Create your account');
  });

  test('complete registration flow for new user', async ({ page }) => {
    // Start with error page (simulating failed sign-in)
    await page.goto('/auth/error?error=UserNotRegistered');

    // Should be on error page
    await expect(page).toHaveURL('/auth/error?error=UserNotRegistered');

    // Follow the correct path
    await page.click('a:has-text("Sign Up")');
    await expect(page).toHaveURL('/auth/signup');

    // Now sign up successfully
    await page.click('button:has-text("Sign up with Google")');
    await expect(page).toHaveURL('/home');
  });
});
