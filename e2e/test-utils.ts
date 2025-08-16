import { Page, expect } from '@playwright/test';

/**
 * Test utilities for E2E tests
 */

/**
 * Mock authentication state for testing authenticated flows
 * This is a placeholder implementation - you'll need to implement based on your auth setup
 */
export async function mockAuthenticatedUser(page: Page, userEmail = 'test@example.com') {
  // Option 1: Set session storage/local storage
  await page.addInitScript(email => {
    localStorage.setItem('test-user-email', email);
  }, userEmail);

  // Option 2: Set cookies (more realistic for NextAuth)
  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
    },
  ]);

  // Note: For full implementation, you'd need to:
  // 1. Create a test user in your database
  // 2. Generate a valid session token
  // 3. Set up proper auth state
}

/**
 * Clear authentication state
 */
export async function clearAuthState(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Wait for navigation and check URL
 */
export async function expectNavigation(page: Page, expectedPath: string) {
  await page.waitForURL(expectedPath);
  await expect(page).toHaveURL(expectedPath);
}

/**
 * Check for loading state to be gone
 */
export async function waitForLoadingToFinish(page: Page) {
  // Wait for common loading indicators to disappear
  await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {
    // Loading spinner might not be present, that's ok
  });
}

/**
 * Helper to fill and submit forms
 */
export async function fillAndSubmitForm(
  page: Page,
  formData: Record<string, string>,
  submitButtonText = 'Submit'
) {
  for (const [field, value] of Object.entries(formData)) {
    await page.fill(`[name="${field}"]`, value);
  }
  await page.click(`button:has-text("${submitButtonText}")`);
}

/**
 * Check for error messages
 */
export async function expectErrorMessage(page: Page, message?: string) {
  if (message) {
    await expect(page.locator(`text=${message}`)).toBeVisible();
  } else {
    // Look for common error indicators
    const errorSelectors = [
      '.error',
      '.alert-error',
      '[role="alert"]',
      '.text-red-500',
      '.text-red-600',
    ];

    let errorFound = false;
    for (const selector of errorSelectors) {
      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 2000 });
        errorFound = true;
        break;
      } catch {
        // Continue to next selector
      }
    }

    if (!errorFound) {
      throw new Error('No error message found');
    }
  }
}

/**
 * Check for success messages
 */
export async function expectSuccessMessage(page: Page, message?: string) {
  if (message) {
    await expect(page.locator(`text=${message}`)).toBeVisible();
  } else {
    // Look for common success indicators
    const successSelectors = ['.success', '.alert-success', '.text-green-500', '.text-green-600'];

    let successFound = false;
    for (const selector of successSelectors) {
      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 5000 });
        successFound = true;
        break;
      } catch {
        // Continue to next selector
      }
    }

    if (!successFound) {
      throw new Error('No success message found');
    }
  }
}

/**
 * Take a screenshot for debugging
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true });
}
