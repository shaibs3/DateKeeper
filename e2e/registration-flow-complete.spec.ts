import { test, expect } from '@playwright/test';
import { AuthMock } from './test-helpers/auth-mock';

test.describe('Complete Registration Flow Tests', () => {
  let authMock: AuthMock;

  test.beforeEach(async ({ page }) => {
    authMock = new AuthMock(page);
    await authMock.setupOAuthMocking();
  });

  test.afterEach(async () => {
    await authMock.cleanup();
  });

  test.describe('New User Scenarios', () => {
    test('new user attempting sign-in succeeds (auto-registration)', async ({ page }) => {
      await authMock.setMockUserScenario('new-user', 'newuser@example.com');

      // Go to sign-in page
      await page.goto('/auth/signin');
      await expect(page.locator('h2')).toContainText('Sign in to BirthdayBuddy');

      // Attempt to sign in
      await page.click('button:has-text("Sign in with Google")');

      // With simplified auth, new users are automatically created and signed in
      await expect(page).toHaveURL('/home');
    });

    test('new user can successfully sign up', async ({ page }) => {
      await authMock.setMockUserScenario('new-user', 'newuser@example.com');

      // Go to sign-up page
      await page.goto('/auth/signup');
      await expect(page.locator('h2')).toContainText('Create your account');

      // Attempt to sign up
      await page.click('button:has-text("Sign up with Google")');

      // Should be redirected to home page (success)
      await expect(page).toHaveURL('/home');
    });

    test('new user follows correct flow after initial error', async ({ page }) => {
      await authMock.setMockUserScenario('new-user', 'newuser@example.com');

      // Start with incorrect flow (sign-in)
      await page.goto('/auth/signin');
      await page.click('button:has-text("Sign in with Google")');

      // Get error
      await expect(page).toHaveURL('/auth/error?error=UserNotRegistered');

      // Follow the correct path via error page
      await page.click('a:has-text("Sign Up")');
      await expect(page).toHaveURL('/auth/signup');

      // Now successfully sign up
      await page.click('button:has-text("Sign up with Google")');
      await expect(page).toHaveURL('/home');
    });
  });

  test.describe('Existing User Scenarios', () => {
    test('existing user attempting sign-up succeeds (simplified auth)', async ({ page }) => {
      await authMock.setMockUserScenario('existing-user', 'existing@example.com');

      // Go to sign-up page
      await page.goto('/auth/signup');
      await expect(page.locator('h2')).toContainText('Create your account');

      // Attempt to sign up
      await page.click('button:has-text("Sign up with Google")');

      // With simplified auth, existing users can use signup page too
      await expect(page).toHaveURL('/home');
    });

    test('existing user can successfully sign in', async ({ page }) => {
      await authMock.setMockUserScenario('existing-user', 'existing@example.com');

      // Go to sign-in page
      await page.goto('/auth/signin');
      await expect(page.locator('h2')).toContainText('Sign in to BirthdayBuddy');

      // Attempt to sign in
      await page.click('button:has-text("Sign in with Google")');

      // Should be redirected to home page (success)
      await expect(page).toHaveURL('/home');
    });

    test('existing user can use either signup or signin page (simplified auth)', async ({ page }) => {
      await authMock.setMockUserScenario('existing-user', 'existing@example.com');

      // Test signup page works for existing users
      await page.goto('/auth/signup');
      await page.click('button:has-text("Sign up with Google")');
      await expect(page).toHaveURL('/home');

      // Reset and test signin page also works
      await page.goto('/auth/signout');
      await page.goto('/auth/signin');
      await page.click('button:has-text("Sign in with Google")');
      await expect(page).toHaveURL('/home');
    });
  });

  test.describe('OAuth Parameter Validation', () => {
    test('sign-in flow does not include signup parameter', async ({ page }) => {
      await page.goto('/auth/signin');

      // Mock the OAuth redirect to capture parameters
      let oauthUrl = '';
      await page.route('**/api/auth/signin/google**', async route => {
        oauthUrl = route.request().url();
        await route.fulfill({
          status: 302,
          headers: { Location: '/auth/signin' },
        });
      });

      await page.click('button:has-text("Sign in with Google")');

      // Verify OAuth request doesn't include signup parameter
      expect(oauthUrl).not.toContain('signup=true');
      expect(oauthUrl).not.toContain('signup%3Dtrue');
    });

    test('sign-up flow includes signup parameter in callback URL', async ({ page }) => {
      await page.goto('/auth/signup');

      // Mock the OAuth redirect to capture parameters
      let oauthUrl = '';
      await page.route('**/api/auth/signin/google**', async route => {
        oauthUrl = route.request().url();
        // Use JavaScript redirect instead of HTTP 302
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<script>history.back();</script>',
        });
      });

      await page.click('button:has-text("Sign up with Google")');

      // Verify OAuth request includes signup parameter in callback URL
      // The parameter should be in the callbackUrl parameter: callbackUrl=/home?signup=true
      expect(oauthUrl).toContain('callbackUrl');
      expect(oauthUrl).toContain('signup%3Dtrue');
    });
  });

  test.describe('Error Page Functionality', () => {
    test('UserNotRegistered error page has working navigation', async ({ page }) => {
      await page.goto('/auth/error?error=UserNotRegistered');

      // Test Sign Up button
      await page.click('a:has-text("Sign Up")');
      await expect(page).toHaveURL('/auth/signup');

      // Go back to error page
      await page.goto('/auth/error?error=UserNotRegistered');

      // Test Back to Sign In button
      await page.click('a:has-text("Back to Sign In")');
      await expect(page).toHaveURL('/auth/signin');
    });

    test('UserAlreadyExists error page has working navigation', async ({ page }) => {
      await page.goto('/auth/error?error=UserAlreadyExists');

      // Test Sign In button
      await page.click('a:has-text("Sign In")');
      await expect(page).toHaveURL('/auth/signin');

      // Go back to error page
      await page.goto('/auth/error?error=UserAlreadyExists');

      // Test Back to Sign Up button
      await page.click('a:has-text("Back to Sign Up")');
      await expect(page).toHaveURL('/auth/signup');
    });

    test('unknown error displays generic error message', async ({ page }) => {
      await page.goto('/auth/error?error=UnknownError');

      await expect(page.locator('h2')).toContainText('Authentication Error');
      await expect(page.locator('text=An error occurred during authentication')).toBeVisible();
      await expect(page.locator('a:has-text("Return to Sign In")')).toBeVisible();
    });
  });

  test.describe('Cross-Flow Prevention', () => {
    test('user cannot bypass registration by manually changing URLs', async ({ page }) => {
      await authMock.setMockUserScenario('new-user', 'newuser@example.com');

      // Try to access protected routes directly
      await page.goto('/home');
      // Should be redirected to landing page or sign-in (depending on auth middleware)
      await expect(page).toHaveURL('/');

      await page.goto('/dashboard');
      // Should be redirected to sign-in page
      await expect(page).toHaveURL('/auth/signin');
    });

    test('registration flow is consistent across different entry points', async ({ page }) => {
      await authMock.setMockUserScenario('new-user', 'newuser@example.com');

      // Test from landing page
      await page.goto('/');
      await page.click('a[href="/auth/signin"]');
      await page.click('button:has-text("Sign in with Google")');
      await expect(page).toHaveURL('/auth/error?error=UserNotRegistered');

      // Test direct navigation
      await page.goto('/auth/signin');
      await page.click('button:has-text("Sign in with Google")');
      await expect(page).toHaveURL('/auth/error?error=UserNotRegistered');
    });
  });
});
