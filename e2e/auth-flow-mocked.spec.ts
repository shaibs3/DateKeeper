import { test, expect } from '@playwright/test';

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

      // Redirect to our callback with mock data
      await route.fulfill({
        status: 302,
        headers: {
          Location: `/api/auth/callback/google?${new URLSearchParams({
            code: 'mock-auth-code',
            state: isSignup ? 'signup=true' : 'signin=true',
            callbackUrl: callbackUrl,
          })}`,
        },
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

      if (testUser === 'new-user' && !isSignup) {
        // New user trying to sign in - should fail
        await route.fulfill({
          status: 302,
          headers: {
            Location: '/auth/error?error=UserNotRegistered',
          },
        });
      } else if (testUser === 'existing-user' && isSignup) {
        // Existing user trying to sign up - should fail
        await route.fulfill({
          status: 302,
          headers: {
            Location: '/auth/error?error=UserAlreadyExists',
          },
        });
      } else {
        // Successful flow
        await route.fulfill({
          status: 302,
          headers: {
            Location: '/home',
          },
        });
      }
    });
  });

  test('new user sign-in fails with UserNotRegistered error', async ({ page }) => {
    // Set test scenario
    await page.addInitScript(() => {
      window.testUserScenario = 'new-user';
    });

    await page.goto('/auth/signin');

    // Click sign in button
    await page.click('button:has-text("Sign in with Google")');

    // Should be redirected to error page
    await expect(page).toHaveURL('/auth/error?error=UserNotRegistered');
    await expect(page.locator('h2')).toContainText('Account Not Found');
    await expect(page.locator('text=No account found with this email address')).toBeVisible();
  });

  test('existing user sign-up fails with UserAlreadyExists error', async ({ page }) => {
    // Set test scenario
    await page.addInitScript(() => {
      window.testUserScenario = 'existing-user';
    });

    await page.goto('/auth/signup');

    // Click sign up button
    await page.click('button:has-text("Sign up with Google")');

    // Should be redirected to error page
    await expect(page).toHaveURL('/auth/error?error=UserAlreadyExists');
    await expect(page.locator('h2')).toContainText('Account Already Exists');
    await expect(page.locator('text=An account with this email already exists')).toBeVisible();
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
    // Test UserNotRegistered error
    await page.addInitScript(() => {
      window.testUserScenario = 'new-user';
    });

    await page.goto('/auth/signin');
    await page.click('button:has-text("Sign in with Google")');

    // Should be on error page
    await expect(page).toHaveURL('/auth/error?error=UserNotRegistered');

    // Click "Sign Up" button
    await page.click('a:has-text("Sign Up")');
    await expect(page).toHaveURL('/auth/signup');

    // Verify we're on the sign-up page
    await expect(page.locator('h2')).toContainText('Create your account');
  });

  test('complete registration flow for new user', async ({ page }) => {
    await page.addInitScript(() => {
      window.testUserScenario = 'new-user';
    });

    // Start with incorrect flow (sign-in for new user)
    await page.goto('/auth/signin');
    await page.click('button:has-text("Sign in with Google")');

    // Should get error
    await expect(page).toHaveURL('/auth/error?error=UserNotRegistered');

    // Follow the correct path
    await page.click('a:has-text("Sign Up")');
    await expect(page).toHaveURL('/auth/signup');

    // Now sign up successfully
    await page.click('button:has-text("Sign up with Google")');
    await expect(page).toHaveURL('/home');
  });
});
